import { app, BrowserWindow, Menu, dialog, ipcMain, session, shell, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { mascarar } from '../projeto.js';
import { diretorioDados, excluirAtividades } from '../atividades.js';
import { excluirEvidencias } from '../evidencias.js';
import { prepararConexao, aplicarConexao } from '../conexoes.js';
import { adicionarVinculo, copiarDemonstracao, projetoVinculado } from '../vinculos.js';
import { esquemasIpc, canaisFrequentes, catalogo, type CanalIpc } from '../contratos.js';
import { carregarVersoes, apresentarVersoes, conferirInstalada, repositorio } from '../versoes.js';
import { verificarAtualizacao, mensagemOffline, urlConsulta } from '../atualizacao.js';
import { registrarDiagnostico, lerDiagnostico, excluirDiagnostico } from '../diagnostico.js';
import { resumirDados } from '../dados.js';
import * as painel from '../painel.js';

/**
 * Processo principal: janela + IPC. Toda regra vive no núcleo (src/*.ts); aqui só validamos
 * argumentos (esquemas de src/contratos.ts), abrimos diálogos nativos e chamamos o adaptador `painel`.
 * O servidor MCP NÃO roda aqui: cada cliente de IA inicia o seu (dist/mcp.js), então fechar a janela não o afeta.
 */
const raizApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rendererDir = path.join(raizApp, 'app', 'renderer');
const origemPermitida = pathToFileURL(rendererDir).href + '/'; // barra final: "renderer-x" não casa
const versao = app.getVersion();
const arquivoVersoes = path.join(raizApp, 'app', 'versoes.json');

// Dados do aplicativo no mesmo diretório do histórico (LOCALAPPDATA\PrumoQA), nunca em roaming.
app.setPath('userData', path.join(diretorioDados(), 'app'));

type Resposta = { ok: true; data: unknown } | { ok: false; error: string };
/**
 * Registra um canal do catálogo: recusa remetente que não seja a nossa página, valida com o esquema do contrato,
 * grava diagnóstico (só metadados) e nunca vaza stack. Consultas frequentes só deixam rastro quando falham.
 */
function canal<C extends CanalIpc>(nome: C, fn: (a: z.output<(typeof esquemasIpc)[C]>, janela: BrowserWindow | null) => unknown | Promise<unknown>) {
  ipcMain.handle('prumo:' + nome, async (e: IpcMainInvokeEvent, bruto: unknown): Promise<Resposta> => {
    const inicio = performance.now(); const correlationId = randomUUID(); let apagaDiagnostico = false;
    const diag = (state: 'OK' | 'ERROR', code?: string) => {
      // Excluir o diagnóstico não deve deixar um novo registro de si mesmo; consultas frequentes só deixam rastro ao falhar.
      if (nome === 'diagnostico:listar' || apagaDiagnostico || (state === 'OK' && canaisFrequentes.has(nome))) return;
      registrarDiagnostico({ at: new Date().toISOString(), channel: nome, state, durationMs: Math.round(performance.now() - inicio), ...(code ? { code } : {}), correlationId });
    };
    try {
      if (!e.senderFrame?.url.startsWith(origemPermitida)) throw new Error('IPC_SENDER_REJECTED');
      const args = esquemasIpc[nome].parse(bruto ?? {}) as z.output<(typeof esquemasIpc)[C]>;
      apagaDiagnostico = nome === 'dados:excluir' && (args as { escopo?: string }).escopo === 'diagnostico';
      const data = await fn(args, BrowserWindow.fromWebContents(e.sender));
      diag('OK'); return { ok: true, data };
    } catch (err) {
      const msg = err instanceof z.ZodError ? 'INVALID_ARGUMENTS: argumentos recusados.' : mascarar((err as Error).message);
      diag('ERROR', /^([A-Z][A-Z_]{2,63})\b/.exec(msg)?.[1] ?? 'TOOL_ERROR');
      return { ok: false, error: msg };
    }
  });
}

canal('app:info', () => ({ version: versao, dataDir: diretorioDados(), platform: process.platform, packaged: app.isPackaged }));
canal('projetos:listar', () => painel.projetos());
canal('projetos:escolher', async (_a, janela) => {
  const r = await dialog.showOpenDialog(janela!, { title: 'Selecionar a pasta do projeto', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return { canceled: false, ...(await adicionarVinculo(r.filePaths[0]!)) };
});
canal('projetos:demo', async () => {
  const origem = app.isPackaged ? path.join(process.resourcesPath, 'demo') : path.join(raizApp, 'exemplos', 'projeto-demo');
  return adicionarVinculo(copiarDemonstracao(origem));
});
canal('projetos:desvincular', a => painel.desvincular(a.root));
canal('projeto:visao', a => painel.visao(a.root));
canal('projeto:logs', a => painel.logs(a.root, a.filter));
canal('projeto:historico', a => painel.historico(a.root, a.filter));
canal('projeto:evidencias', a => painel.evidencias(a.root, a.jobId));
canal('projeto:conexoes', a => painel.conexoes(a.root));
canal('ajuda:documentos', () => painel.ajuda(path.join(raizApp, 'app', 'ajuda'), versao));
canal('ajuda:versoes', () => { const v = carregarVersoes(arquivoVersoes); conferirInstalada(v, versao); return { installed: versao, versions: apresentarVersoes(v, versao) }; });
canal('ajuda:integracoes', () => catalogo());
canal('diagnostico:listar', () => lerDiagnostico());
canal('dados:resumo', () => resumirDados());

// Alterar configuração de outro programa exige uma caixa de confirmação NATIVA, que a página não consegue simular.
canal('conexao:aplicar', async (a, janela) => {
  const p = await projetoVinculado(a.root);
  const plano = prepararConexao(p, a.client);
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar conexão', buttons: ['Cancelar', 'Adicionar configuração'], defaultId: 0, cancelId: 0, noLink: true,
    message: `Adicionar o servidor MCP "${plano.name}" ao ${a.client}?`,
    detail: `Destino: ${plano.destination}\n\nComando:\n${plano.command}\n\nConfigurações existentes com o mesmo nome não são sobrescritas. Isto não comprova uma sessão ativa.` });
  if (r.response !== 1) return { configured: false, reason: 'Cancelado; nenhuma alteração.' };
  return aplicarConexao(plano, plano.confirmation);
});
canal('logs:exportar', async (a, janela) => {
  const aviso = await dialog.showMessageBox(janela!, { type: 'info', title: 'Exportar logs', buttons: ['Cancelar', 'Continuar'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Os registros podem conter informações relacionadas ao projeto (identificadores, contagens, estados).', detail: 'O arquivo será gravado onde você escolher. O Prumo não envia nada pela rede.' });
  if (aviso.response !== 1) return { exported: false };
  const conteudo = await painel.exportarLogs(a.root);
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar logs', defaultPath: 'prumo-logs.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, conteudo, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
});

// Exclusão: escopo explícito, confirmação nativa destrutiva e módulos donos de cada formato. Não existe equivalente em MCP.
const textoExclusao = { historico: 'Excluir o histórico operacional (logs, histórico e métricas) deste projeto?', evidencias: 'Excluir as evidências de execução deste projeto (pasta .prumo\\evidencias)?', diagnostico: 'Excluir o diagnóstico técnico da interface?' } as const;
canal('dados:excluir', async (a, janela) => {
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar exclusão', buttons: ['Cancelar', 'Excluir'], defaultId: 0, cancelId: 0, noLink: true,
    message: textoExclusao[a.escopo], detail: 'Esta ação não pode ser desfeita. Código-fonte e demais arquivos do projeto não são tocados e o vínculo do projeto é mantido.' });
  if (r.response !== 1) return { canceled: true, deleted: 0, failed: [] };
  if (a.escopo === 'diagnostico') return { canceled: false, ...excluirDiagnostico() };
  const p = await projetoVinculado(a.root);
  return { canceled: false, ...(a.escopo === 'historico' ? excluirAtividades(p) : await excluirEvidencias(p)) };
});

// Atualização: consulta manual no processo principal (a janela segue sem rede). Nada é baixado nem instalado.
let ultimaRelease: string | undefined;
canal('atualizacao:verificar', async () => {
  // Servidor de teste em 127.0.0.1 só é aceito fora do pacote (desenvolvimento e testes automatizados).
  const teste = !app.isPackaged ? process.env.PRUMO_UPDATE_TEST_URL : undefined;
  let r;
  try { r = await verificarAtualizacao(versao, teste ? { url: teste, permitirLocal: true } : { url: urlConsulta }); }
  catch { r = { status: 'INDISPONIVEL' as const, installed: versao, message: mensagemOffline }; }
  ultimaRelease = r.status === 'ATUALIZACAO_DISPONIVEL' ? r.url : undefined;
  return r;
});
canal('atualizacao:abrir', async (_a, janela) => {
  if (!ultimaRelease || !new RegExp(`^https://github\\.com/${repositorio}/releases/tag/v\\d+\\.\\d+\\.\\d+$`).test(ultimaRelease)) throw new Error('NO_VERIFIED_RELEASE: verifique as atualizações antes.');
  const r = await dialog.showMessageBox(janela!, { type: 'question', title: 'Abrir página oficial', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir a página oficial da nova versão?', detail: `${ultimaRelease}\n\nO Prumo não baixa nem instala nada. Confira o SHA-256 informado na página antes de executar o instalador.` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(ultimaRelease); return { opened: true };
});

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1080, height: 720, minWidth: 820, minHeight: 560, show: false, backgroundColor: '#14171c', title: 'Prumo QA',
    icon: path.join(raizApp, 'assets', 'prumo-icon.png'),
    webPreferences: { preload: path.join(raizApp, 'app', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, devTools: !app.isPackaged }
  });
  janela.once('ready-to-show', () => janela.show());
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', e => e.preventDefault());
  janela.webContents.on('will-attach-webview', e => e.preventDefault());
  void janela.loadFile(path.join(rendererDir, 'index.html'));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const j = BrowserWindow.getAllWindows()[0]; if (j) { if (j.isMinimized()) j.restore(); j.focus(); } });
  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Nada de rede na janela: só file:// (a própria página) e devtools em desenvolvimento.
    session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !(d.url.startsWith('file:') || d.url.startsWith('devtools:')) }));
    session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
    criarJanela();
  });
  app.on('window-all-closed', () => app.quit());
}
