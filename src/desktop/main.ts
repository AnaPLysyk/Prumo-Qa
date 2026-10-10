import { app, BrowserWindow, Menu, dialog, ipcMain, session, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { mascarar } from '../projeto.js';
import { diretorioDados } from '../atividades.js';
import { prepararConexao, aplicarConexao } from '../conexoes.js';
import { situacaoProjeto, adicionarVinculo, copiarDemonstracao, projetoVinculado } from '../vinculos.js';
import * as painel from '../painel.js';

/**
 * Processo principal: janela + IPC. Toda regra vive no núcleo (src/*.ts); aqui só validamos
 * argumentos, abrimos diálogos nativos e chamamos o adaptador `painel`.
 * O servidor MCP NÃO roda aqui: cada cliente de IA inicia o seu (dist/mcp.js), então fechar a janela não o afeta.
 */
const raizApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rendererDir = path.join(raizApp, 'app', 'renderer');
const origemPermitida = pathToFileURL(rendererDir).href + '/'; // barra final: "renderer-x" não casa
const versao = app.getVersion();

// Dados do aplicativo no mesmo diretório do histórico (LOCALAPPDATA\PrumoQA), nunca em roaming.
app.setPath('userData', path.join(diretorioDados(), 'app'));

const raizSchema = z.string().min(1).max(1000);
const filtroIpc = z.object({ root: raizSchema, filter: painel.filtroSchema.optional() }).strict();
const soRaiz = z.object({ root: raizSchema }).strict();

type Resposta = { ok: true; data: unknown } | { ok: false; error: string };
/** Registra um canal: recusa remetente que não seja a nossa página, valida e nunca vaza stack. */
function canal<T extends z.ZodTypeAny>(nome: string, schema: T, fn: (a: z.output<T>, janela: BrowserWindow | null) => unknown | Promise<unknown>) {
  ipcMain.handle('prumo:' + nome, async (e: IpcMainInvokeEvent, bruto: unknown): Promise<Resposta> => {
    try {
      if (!e.senderFrame?.url.startsWith(origemPermitida)) throw new Error('IPC_SENDER_REJECTED');
      return { ok: true, data: await fn(schema.parse(bruto ?? {}), BrowserWindow.fromWebContents(e.sender)) };
    } catch (err) {
      const msg = err instanceof z.ZodError ? 'INVALID_ARGUMENTS: argumentos recusados.' : mascarar((err as Error).message);
      return { ok: false, error: msg };
    }
  });
}
const vazio = z.object({}).strict();

canal('app:info', vazio, () => ({ version: versao, dataDir: diretorioDados(), platform: process.platform, packaged: app.isPackaged }));
canal('projetos:listar', vazio, () => painel.projetos());
canal('projetos:escolher', vazio, async (_a, janela) => {
  const r = await dialog.showOpenDialog(janela!, { title: 'Selecionar a pasta do projeto', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return { canceled: false, ...(await adicionarVinculo(r.filePaths[0]!)) };
});
canal('projetos:demo', vazio, async () => {
  const origem = app.isPackaged ? path.join(process.resourcesPath, 'demo') : path.join(raizApp, 'exemplos', 'projeto-demo');
  return adicionarVinculo(copiarDemonstracao(origem));
});
canal('projetos:desvincular', soRaiz, a => painel.desvincular(a.root));
canal('projeto:visao', soRaiz, a => painel.visao(a.root));
canal('projeto:logs', filtroIpc, a => painel.logs(a.root, a.filter));
canal('projeto:historico', filtroIpc, a => painel.historico(a.root, a.filter));
canal('projeto:evidencias', z.object({ root: raizSchema, jobId: z.string().uuid().optional() }).strict(), a => painel.evidencias(a.root, a.jobId));
canal('projeto:conexoes', soRaiz, a => painel.conexoes(a.root));
canal('ajuda:documentos', vazio, () => painel.ajuda(path.join(raizApp, 'app', 'ajuda'), versao));

// Alterar configuração de outro programa exige confirmação nativa, que a página não consegue simular.
canal('conexao:aplicar', z.object({ root: raizSchema, client: z.literal('codex') }).strict(), async (a, janela) => {
  const p = await projetoVinculado(a.root);
  const plano = prepararConexao(p, a.client);
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar conexão', buttons: ['Cancelar', 'Adicionar configuração'], defaultId: 0, cancelId: 0, noLink: true,
    message: `Adicionar o servidor MCP "${plano.name}" ao ${a.client}?`,
    detail: `Destino: ${plano.destination}\n\nComando:\n${plano.command}\n\nConfigurações existentes com o mesmo nome não são sobrescritas. Isto não comprova uma sessão ativa.` });
  if (r.response !== 1) return { configured: false, reason: 'Cancelado; nenhuma alteração.' };
  return aplicarConexao(plano, plano.confirmation);
});
canal('logs:exportar', soRaiz, async (a, janela) => {
  const aviso = await dialog.showMessageBox(janela!, { type: 'info', title: 'Exportar logs', buttons: ['Cancelar', 'Continuar'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Os registros podem conter informações relacionadas ao projeto (identificadores, contagens, estados).', detail: 'O arquivo será gravado onde você escolher. O Prumo não envia nada pela rede.' });
  if (aviso.response !== 1) return { exported: false };
  const conteudo = await painel.exportarLogs(a.root);
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar logs', defaultPath: 'prumo-logs.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, conteudo, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
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
    // Nada de rede: só file:// (a própria página) e devtools em desenvolvimento.
    session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !(d.url.startsWith('file:') || d.url.startsWith('devtools:')) }));
    session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
    criarJanela();
  });
  app.on('window-all-closed', () => app.quit());
}
