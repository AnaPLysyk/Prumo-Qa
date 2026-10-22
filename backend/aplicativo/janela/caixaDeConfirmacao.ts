/** Confirmações do processo principal com o visual do Design System, sem expor a decisão ao renderer. */
/* A caixa é outra página (WebContentsView sobre a janela, ou janela própria quando o app está na bandeja), sem preload:
 * a página do app não lê, não clica e não desenha por cima dela, e a resposta só chega ao processo principal. */
import { BrowserWindow, WebContentsView, type MessageBoxOptions, type MessageBoxReturnValue, type WebContents, type WebPreferences } from "electron";
import path from "node:path";
import { estadoDoAplicativo } from "../estadoDoAplicativo.js";
import { rendererDir } from "../tipos/aplicativo.js";
import { raizDoAplicativo } from "../../compartilhado/raizDoAplicativo.js";
import { lerPreferencias } from "../../configuracoes/servico.js";

/** As opções de dialog.showMessageBox que a caixa desenha; noLink fica aceito porque ela nunca transforma botão em link. */
export type Pergunta = Pick<MessageBoxOptions, 'type' | 'title' | 'message' | 'detail' | 'buttons' | 'defaultId' | 'cancelId' | 'checkboxLabel' | 'checkboxChecked' | 'noLink'>;

const pagina = path.join(rendererDir, 'caixa-de-confirmacao.html');
const preferenciasSeguras: WebPreferences = { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, spellcheck: false, devTools: false };
const mudancasDeTamanho = ['resize', 'maximize', 'unmaximize', 'restore', 'enter-full-screen', 'leave-full-screen'];
let fila: Promise<unknown> = Promise.resolve();

/** Mesmo retorno de dialog.showMessageBox. Confirmações esperam a vez uma da outra; aviso de um botão só não entra na fila. */
export function perguntarNaJanela(janela: BrowserWindow | null | undefined, opcoes: Pergunta): Promise<MessageBoxReturnValue> {
  if ((opcoes.buttons?.length ?? 0) <= 1) return mostrar(janela ?? null, opcoes);
  const vez = fila.then(() => mostrar(janela ?? null, opcoes));
  fila = vez.catch(() => undefined);
  return vez;
}

/** A página responde trocando o fragmento da própria URL; nada além de um índice de botão válido é aceito. */
export function lerResposta(url: string, botoes: number): MessageBoxReturnValue | null {
  const m = /^file:([^#?]*)(?:\?[^#]*)?#resposta=(\d{1,2})&marcado=([01])$/.exec(url);
  if (!m?.[1]?.endsWith('/caixa-de-confirmacao.html') || Number(m[2]) >= botoes) return null;
  return { response: Number(m[2]), checkboxChecked: m[3] === '1' };
}

function mostrar(janela: BrowserWindow | null, opcoes: Pergunta): Promise<MessageBoxReturnValue> {
  const botoes = opcoes.buttons?.length ? opcoes.buttons : ['OK'];
  const cancelado = { response: opcoes.cancelId ?? 0, checkboxChecked: opcoes.checkboxChecked ?? false };
  // Quem perguntou sobre uma janela que já fechou, ou com o app saindo, não ganha caixa solta: conta como Cancelar.
  if (janela?.isDestroyed() || estadoDoAplicativo.saindo) return Promise.resolve(cancelado);
  const { tema, idioma } = lerPreferencias();
  const pedido = JSON.stringify({ tipo: opcoes.type, titulo: opcoes.title, mensagem: opcoes.message, detalhe: opcoes.detail, botoes, padrao: opcoes.defaultId, cancelar: cancelado.response, caixa: opcoes.checkboxLabel, marcado: opcoes.checkboxChecked, tema, idioma, solta: !janela });
  return new Promise(resolve => {
    let concluida = false;
    let desmontar = () => {};
    const concluir = (r: MessageBoxReturnValue) => { if (concluida) return; concluida = true; desmontar(); resolve(r); };
    const desistir = () => concluir(cancelado);
    const preparar = (wc: WebContents, exibir: () => void) => {
      wc.setWindowOpenHandler(() => ({ action: 'deny' }));
      wc.on('will-navigate', e => e.preventDefault());
      wc.on('will-attach-webview', e => e.preventDefault());
      wc.on('did-navigate-in-page', (_e, url, principal) => { const r = principal ? lerResposta(url, botoes.length) : null; if (r) concluir(r); });
      wc.on('render-process-gone', desistir);
      // Se o script da caixa falhar, sobraria um véu sem botões: cancelar é melhor do que prender a pessoa.
      wc.once('did-finish-load', () => { wc.executeJavaScript('!!document.querySelector(".cc-cartao:not([hidden])")').then(pronta => { if (pronta) exibir(); else desistir(); }, desistir); });
      wc.loadFile(pagina, { query: { pedido } }).catch(desistir);
    };
    if (janela) {
      // Sobre a janela do app: cobre a área inteira e escurece o fundo, como um modal da própria tela.
      if (janela.isMinimized()) janela.restore();
      if (!janela.isVisible()) janela.show();
      const vista = new WebContentsView({ webPreferences: preferenciasSeguras });
      vista.setBackgroundColor('#00000000');
      const eventos: NodeJS.EventEmitter = janela;
      const ajustar = () => { const { width, height } = janela.getContentBounds(); vista.setBounds({ x: 0, y: 0, width, height }); };
      // No Windows, ao voltar para a janela o foco iria para a página de baixo; ele fica na caixa.
      const focar = () => vista.webContents.focus();
      ajustar();
      janela.contentView.addChildView(vista);
      for (const evento of mudancasDeTamanho) eventos.on(evento, ajustar);
      janela.on('focus', focar);
      // O X da janela só a esconde na bandeja; com a caixa aberta, ele responde Cancelar.
      janela.once('hide', desistir);
      janela.once('closed', desistir);
      desmontar = () => {
        for (const evento of mudancasDeTamanho) eventos.off(evento, ajustar);
        janela.off('focus', focar); janela.off('hide', desistir); janela.off('closed', desistir);
        if (!janela.isDestroyed()) { janela.contentView.removeChildView(vista); janela.webContents.focus(); }
        vista.webContents.close();
      };
      preparar(vista.webContents, () => { janela.focus(); focar(); });
      return;
    }
    // Sem janela (bandeja): uma janela pequena só para a pergunta, no tamanho do conteúdo.
    const solta = new BrowserWindow({ width: 470, height: 240, useContentSize: true, show: false, resizable: false, minimizable: false, maximizable: false, fullscreenable: false, alwaysOnTop: true, autoHideMenuBar: true, title: opcoes.title || 'Prumo QA', icon: path.join(raizDoAplicativo, 'assets', 'prumo-icon.png'), webPreferences: preferenciasSeguras });
    solta.setMenu(null);
    solta.on('page-title-updated', e => e.preventDefault());
    solta.once('closed', desistir);
    desmontar = () => { solta.off('closed', desistir); if (!solta.isDestroyed()) solta.destroy(); };
    preparar(solta.webContents, async () => {
      const altura = await solta.webContents.executeJavaScript('document.querySelector(".cc-cartao").scrollHeight').catch(() => 240);
      if (solta.isDestroyed()) return;
      solta.setContentSize(470, Math.min(Math.max(Number(altura) || 240, 160), 640));
      solta.show(); solta.focus();
    });
  });
}
