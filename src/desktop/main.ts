import { app, BrowserWindow, Menu, dialog, ipcMain, session, shell, safeStorage, type IpcMainInvokeEvent } from 'electron';
import * as espacos from '../espacos.js';
import {nucleoServicos} from '../servicos.js';
import {textoRemoto} from '../adaptadoresServicos.js';
import {carregarProjeto} from '../projeto.js';
import {contextoCompleto} from '../contextoCompleto.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { mascarar } from '../projeto.js';
import { diretorioDados, excluirAtividades } from '../atividades.js';
import { excluirEvidencias } from '../evidencias.js';
import { excluirTodosContextos } from '../contextos.js';
import { prepararConexao, aplicarConexao } from '../conexoes.js';
import { adicionarVinculo, copiarDemonstracao, projetoVinculado } from '../vinculos.js';
import { esquemasIpc, canaisFrequentes, catalogo, type CanalIpc } from '../contratos.js';
import { carregarVersoes, apresentarVersoes, conferirInstalada, repositorio } from '../versoes.js';
import { verificarAtualizacao, mensagemOffline, urlConsulta } from '../atualizacao.js';
import { registrarDiagnostico, lerDiagnostico, excluirDiagnostico } from '../diagnostico.js';
import { resumirDados } from '../dados.js';
import { lerPreferencias, alterarPreferencias, marcarVisualizada, avisoPendente, registrarConsulta } from '../preferencias.js';
import { prepararSolicitacao, urlOficial } from '../suporte.js';
import { consultarChamado } from '../chamados.js';
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
canal('suporte:consultar', a => consultarChamado(a.numero));
canal('suporte:chamado', async (a,janela) => {
  const r=await dialog.showMessageBox(janela!,{type:'question',buttons:['Cancelar','Abrir chamado'],defaultId:0,cancelId:0,message:`Abrir o chamado #${a.numero} no GitHub oficial?`});
  if(r.response!==1)return {opened:false};
  await shell.openExternal(`https://github.com/${repositorio}/issues/${a.numero}`);return {opened:true};
});
canal('conexao:testar', a => painel.testarIntegracao(a.root,a.client));
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
const textoExclusao = { historico: 'Excluir o histórico operacional (logs, histórico e métricas) deste projeto?', evidencias: 'Excluir as evidências de execução deste projeto (pasta .prumo\\evidencias)?', contextos: 'Excluir TODOS os contextos (requisitos, regras e decisões) deste projeto?', diagnostico: 'Excluir o diagnóstico técnico da interface?' } as const;
canal('dados:excluir', async (a, janela) => {
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar exclusão', buttons: ['Cancelar', 'Excluir'], defaultId: 0, cancelId: 0, noLink: true,
    message: textoExclusao[a.escopo], detail: 'Esta ação não pode ser desfeita. Código-fonte e demais arquivos do projeto não são tocados e o vínculo do projeto é mantido.' });
  if (r.response !== 1) return { canceled: true, deleted: 0, failed: [] };
  if (a.escopo === 'diagnostico') return { canceled: false, ...excluirDiagnostico() };
  const p = await projetoVinculado(a.root);
  return { canceled: false, ...(a.escopo === 'historico' ? excluirAtividades(p) : a.escopo === 'contextos' ? excluirTodosContextos(p) : await excluirEvidencias(p)) };
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
  // Só respostas válidas alteram o aviso persistente; falha de rede mantém o que já se sabia (o sino continua offline).
  const valido = r.status === 'ATUALIZACAO_DISPONIVEL' || r.status === 'ATUALIZADO' || r.status === 'INSTALADA_MAIS_NOVA';
  const notificacao = valido ? registrarConsulta(r.status === 'ATUALIZACAO_DISPONIVEL' ? { versao: r.latest!, notas: r.notes ?? '' } : null) : { indicador: avisoPendente(versao).indicador, tocarSom: false, versao: null, notas: '' };
  return { ...r, notificacao };
});
canal('preferencias:obter', () => ({ preferencias: lerPreferencias(), aviso: avisoPendente(versao), instalada: versao }));
canal('preferencias:salvar', a => ({ preferencias: alterarPreferencias(a) }));
canal('preferencias:visualizada', a => ({ preferencias: marcarVisualizada(a.versao), aviso: avisoPendente(versao) }));
canal('atualizacao:abrir', async (_a, janela) => {
  if (!ultimaRelease || !new RegExp(`^https://github\\.com/${repositorio}/releases/tag/v\\d+\\.\\d+\\.\\d+$`).test(ultimaRelease)) throw new Error('NO_VERIFIED_RELEASE: verifique as atualizações antes.');
  const r = await dialog.showMessageBox(janela!, { type: 'question', title: 'Abrir página oficial', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir a página oficial da nova versão?', detail: `${ultimaRelease}\n\nO Prumo não baixa nem instala nada. Confira o SHA-256 informado na página antes de executar o instalador.` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(ultimaRelease); return { opened: true };
});


// ---- Suporte (2.5). Nada é enviado sem revisão e confirmação NATIVA; a URL é reconstruída aqui, nunca recebida da página. Logs nunca são anexados sem marcação. ----
const resumoDiagnostico = () => lerDiagnostico(undefined, 20).events.map(e => `${e.at} ${e.channel} ${e.state}${e.code ? ' ' + e.code : ''} ${e.durationMs}ms`).join('\n');
const prepararSuporte = (a: Parameters<typeof prepararSolicitacao>[0]) => prepararSolicitacao(a, { versao, diagnostico: (a as { incluirDiagnostico?: boolean }).incluirDiagnostico ? resumoDiagnostico() : undefined });
canal('suporte:preparar', a => prepararSuporte(a));
canal('suporte:abrir', async (a, janela) => {
  const p = prepararSuporte(a);
  if (!p.ok || !('url' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de enviar.');
  if (!urlOficial(p.url)) throw new Error('SUPPORT_URL_FORBIDDEN: endereço não autorizado.');
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Abrir formulário do GitHub', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir o formulário de issue já preenchido?', detail: `${p.aviso}

Issues do repositório público ${repositorio} são visíveis para qualquer pessoa. Nada é publicado até você enviar no navegador.

Título: ${p.titulo}${p.truncado ? '\nO texto foi encurtado para caber no endereço; confira no formulário.' : ''}` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(p.url); return { opened: true };
});
canal('suporte:exportar', async (a, janela) => {
  const p = prepararSuporte(a);
  if (!p.ok || !('markdown' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de exportar.');
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar relato', defaultPath: 'prumo-relato.md', filters: [{ name: 'Markdown', extensions: ['md'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, p.markdown, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
});

// ---- Contextos persistentes (2.4). Aprovar, desatualizar, excluir e habilitar o MCP exigem confirmação NATIVA
// (a página não a simula). O aprovador é o usuário do Windows, lido aqui no processo principal, nunca informado pela página. ----
const usuarioWindows = () => os.userInfo().username;
const confirmar = async (janela: BrowserWindow | null, titulo: string, mensagem: string, detalhe: string, botao: string) => (await dialog.showMessageBox(janela!, { type: 'warning', title: titulo, buttons: ['Cancelar', botao], defaultId: 0, cancelId: 0, noLink: true, message: mensagem, detail: detalhe })).response === 1;
const servicos=nucleoServicos({disponivel:()=>process.platform==='win32'&&safeStorage.isEncryptionAvailable(),proteger:s=>safeStorage.encryptString(s),abrir:b=>safeStorage.decryptString(b)});
canal('espacos:listar',()=>espacos.listarEspacos());
canal('espacos:criar',a=>espacos.criarEspaco(a));
canal('espacos:obter',a=>espacos.obterEspaco(a.id));
canal('espacos:editar',a=>espacos.editarEspaco(a.id,a.dados));
canal('espacos:pasta',async(a,j)=>{espacos.obterEspaco(a.id);const r=await dialog.showOpenDialog(j!,{title:'Pasta de automação com contrato v2',properties:['openDirectory']});if(r.canceled||!r.filePaths[0])return {canceled:true};return espacos.pastaEspaco(a.id,r.filePaths[0]);});
canal('espacos:automacoes',async a=>{const e=espacos.obterEspaco(a.id);if(!e.pastaLocal)return {pastaLocal:null,estado:'SEM_PASTA',frameworks:[],capacidades:[]};const p=await carregarProjeto(e.pastaLocal);const c=await contextoCompleto(p);return {pastaLocal:p.raiz,estado:'INTEGRADO',frameworks:c.frameworks,capacidades:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly};});
canal('espacos:associar',a=>espacos.associarEspaco(a.id,a.dados));
canal('servicos:listar',()=>servicos.contas());
canal('servicos:adicionar',async(a,j)=>{if(!await confirmar(j,'Adicionar conexão de leitura',`Configurar ${a.servico}?`,'A credencial será protegida no perfil Windows. As consultas são explícitas; o renderer e os agentes não recebem a credencial armazenada. Não há permissão de escrita externa no Prumo.','Configurar'))return {canceled:true};return servicos.adicionar(a);});
canal('servicos:validar',a=>servicos.validarConta(a.id));
canal('servicos:remover',async(a,j)=>{if(!await confirmar(j,'Remover conexão','Remover esta credencial e desativar a conexão?','Vínculos e histórico permanecem identificados; nenhum recurso externo será apagado.','Remover'))return {canceled:true};return servicos.removerConta(a.id);});
canal('servicos:recursos',a=>servicos.listar(a.id,a.pagina));
canal('servicos:vincular',async(a,j)=>{espacos.obterEspaco(a.espacoId);if(!await confirmar(j,'Confirmar vínculo',`Vincular ${a.recurso.nome}?`,`${a.recurso.instancia}\nID: ${a.recurso.id}\nConta: ${a.recurso.contaId}\nSomente este projeto Prumo. O recurso será revalidado. Nenhuma relação com outro serviço é deduzida.`,'Vincular'))return {canceled:true};return servicos.vincular(a.espacoId,a.conexaoId,a.recurso);});
canal('servicos:desvincular',async(a,j)=>{espacos.obterEspaco(a.espacoId);if(!await confirmar(j,'Remover vínculo',`Remover o vínculo ${a.servico}?`,'Relações anteriores e histórico serão preservados. Nenhum dado externo será excluído.','Remover'))return {canceled:true};return espacos.removerVinculoServico(a.espacoId,a.servico);});
canal('servicos:conferir',a=>servicos.validarVinculo(a.espacoId,a.servico));
canal('servicos:consultar',a=>servicos.consultar(a.espacoId,a.servico,a.operacao,a.pagina,a.id));
canal('servicos:aceite',a=>servicos.campoAceite(a.espacoId,a.campo));
canal('servicos:importar',async(a,j)=>{const e=espacos.obterEspaco(a.espacoId);const consulta=await servicos.consultar(e.id,'jira','ticket',{},a.ticket);const item=consulta.dados as {fields?:{summary?:unknown;description?:unknown}};const titulo=textoRemoto(item.fields?.summary,200);const texto=textoRemoto(item.fields?.description);
  if(!texto.trim())throw new Error('JIRA_DESCRIPTION_MISSING');
  if(!await confirmar(j,'Registrar contexto em rascunho',`Importar a descrição de ${a.ticket}?`,texto+'\n\nSerá RASCUNHO, sem aprovação automática. Se você habilitou contextos ao MCP, o agente poderá ler este rascunho.','Registrar rascunho'))return {canceled:true};
  const contexto=await painel.contextosSalvar(e.raizContextos,{dados:{tipo:'requisito',titulo,texto,origem:{tipo:'documento',referencia:consulta.origem+'/browse/'+a.ticket}}},usuarioWindows());return {contexto};});
canal('contextos:listar', a => painel.contextosListar(a.root, a.filter));
canal('contextos:obter', a => painel.contextosObter(a.root, a.id));
canal('contextos:salvar', a => painel.contextosSalvar(a.root, { id: a.id, substituir: a.substituir, dados: a.dados }, usuarioWindows()));
canal('contextos:aprovar', async (a, janela) => {
  const c = await painel.contextosObter(a.root, a.id);
  if (!(await confirmar(janela, 'Aprovar contexto', `Aprovar "${c.titulo}" (versão ${c.versao})?`, `Você confirma que este conteúdo é uma regra válida, na origem informada: ${c.origem.referencia || '(sem origem)'}.\nA aprovação vale só para este texto exato; qualquer edição volta o contexto a rascunho. Aprovador registrado: ${usuarioWindows()}.`, 'Aprovar'))) return { canceled: true };
  return { canceled: false, contexto: await painel.contextosAprovar(a.root, a.id, usuarioWindows()) };
});
canal('contextos:desatualizar', async (a, janela) => {
  const c = await painel.contextosObter(a.root, a.id);
  if (!(await confirmar(janela, 'Marcar como desatualizado', `Marcar "${c.titulo}" como desatualizado?`, 'Um contexto desatualizado deixa de valer, não pode mais ser editado nem aprovado e deixa de ser tratado como regra atual. O histórico é preservado.', 'Marcar desatualizado'))) return { canceled: true };
  return { canceled: false, contexto: await painel.contextosDesatualizar(a.root, a.id, usuarioWindows()) };
});
canal('contextos:conflito', async a => painel.contextosConflito(a.root, a.id, usuarioWindows(), a.outroId));
canal('contextos:excluir', async (a, janela) => {
  const c = await painel.contextosObter(a.root, a.id);
  if (!(await confirmar(janela, 'Excluir contexto', `Excluir definitivamente "${c.titulo}"?`, 'O contexto e o seu histórico serão apagados; só ficam o identificador, a data e o hash de que ele existiu. O código e os demais arquivos do projeto não são tocados.', 'Excluir'))) return { canceled: true, deleted: false };
  return { canceled: false, ...(await painel.contextosExcluir(a.root, a.id)) };
});
canal('contextos:mcp', async (a, janela) => {
  if (a.habilitar && !(await confirmar(janela, 'Disponibilizar ao agente de IA', 'Disponibilizar os contextos deste projeto ao agente de IA conectado?', 'O texto dos contextos (até 4000 caracteres cada, com segredos mascarados) passará a ser retornado pelas ferramentas MCP e poderá ser processado pelo provedor da IA conectada. Contextos adulterados nunca são enviados. Você pode desabilitar a qualquer momento.', 'Disponibilizar'))) return { canceled: true };
  return { canceled: false, ...(await painel.contextosMcp(a.root, a.habilitar)) };
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
