/** Janela: criação e ciclo de vida — arquivos relacionados agrupados para manutenção. */
import { BrowserWindow, app, Notification } from "electron";
import path from "node:path";
import { textoNoIdioma } from "../bandeja/conteudoDaBandeja.js";
import { estadoDoAplicativo } from "../estadoDoAplicativo.js";
import { origemPermitida, rendererDir } from "../tipos/aplicativo.js";
import { raizDoAplicativo } from "../../compartilhado/raizDoAplicativo.js";
import { idiomaAtual } from "../../configuracoes/servico.js";
import { empilharAviso } from "../avisos/avisos.js";

// ── criarJanela ──
export function criarJanela(): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1080, height: 720, minWidth: 820, minHeight: 560, show: false, backgroundColor: '#0b1020', title: 'Prumo QA',
    icon: path.join(raizDoAplicativo, 'assets', 'prumo-icon.png'),
    webPreferences: { preload: path.join(raizDoAplicativo, 'backend', 'aplicativo', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, devTools: !app.isPackaged }
  });
  janela.once('ready-to-show', () => janela.show());
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // A única navegação permitida é recarregar a própria página (ao entrar ou sair da conta, para não sobrar dado da sessão anterior).
  janela.webContents.on('will-navigate', (e, url) => { if (url !== origemPermitida) e.preventDefault(); });
  janela.webContents.on('will-attach-webview', e => e.preventDefault());
  // Fechar a janela não encerra o Prumo: ele continua na bandeja para que as rotinas sigam funcionando.
  janela.on('close', e => {
    if (estadoDoAplicativo.saindo) return;
    e.preventDefault(); janela.hide();
    if (!estadoDoAplicativo.avisouBandeja && Notification.isSupported()) { estadoDoAplicativo.avisouBandeja = true; const i = idiomaAtual(); new Notification({ title: textoNoIdioma('bandejaTitulo', i), body: textoNoIdioma('bandejaCorpo', i), silent: true }).show(); }
  });
  janela.on('closed', () => { if (estadoDoAplicativo.janelaPrincipal === janela) estadoDoAplicativo.janelaPrincipal = null; });
  void janela.loadFile(path.join(rendererDir, 'index.html'));
  return janela;
}

// ── controleDaJanela ──
export function mostrarJanela() {
  if (!estadoDoAplicativo.janelaPrincipal || estadoDoAplicativo.janelaPrincipal.isDestroyed()) {
    estadoDoAplicativo.janelaPrincipal = criarJanela();
  }
  const janela = estadoDoAplicativo.janelaPrincipal;
  if (janela.isMinimized()) janela.restore();
  janela.show();
  janela.focus();
}

/** Solicita navegação pelo canal de avisos, sem executar código da página. */
export function navegarPara(destino: string) {
  empilharAviso({ tipo: 'NAVEGAR', titulo: destino, detalhe: '', destino });
  mostrarJanela();
}
