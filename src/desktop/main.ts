import { app, BrowserWindow, Menu, Tray, Notification, nativeImage, dialog, ipcMain, session, shell, safeStorage, type IpcMainInvokeEvent } from 'electron';
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
import { Worker, type EventoWorker } from '../worker.js';
import { tm, resumoEstado, modeloMenuBandeja, dicaBandeja, type Idioma, type ItemMenu } from '../textosDesktop.js';
import * as agendaCore from '../agenda.js';
import * as agendaOp from '../agendaOperacoes.js';
import * as autorizacoesCore from '../autorizacoes.js';
import { solicitarAprovacao } from '../aprovacao.js';
import { localizarK6 } from '../k6.js';
import { listarExecucoes, metricas } from '../historicoCentral.js';
import { prepararPublicacao, publicar as publicarComentario } from '../jiraComentario.js';

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
  catch { r = { status: 'INDISPONIVEL' as const, installed: versao, conclusivo: false, motivo: 'REDE' as const, message: mensagemOffline }; }
  ultimaRelease = r.status === 'ATUALIZACAO_DISPONIVEL' ? r.url : undefined;
  // Só respostas válidas alteram o aviso persistente; falha de rede mantém o que já se sabia (o sino continua offline).
  const valido = r.status === 'ATUALIZACAO_DISPONIVEL' || r.status === 'ATUALIZADO' || r.status === 'INSTALADA_MAIS_NOVA';
  const notificacao = valido ? registrarConsulta(r.status === 'ATUALIZACAO_DISPONIVEL' ? { versao: r.latest!, notas: r.notes ?? '' } : null) : { indicador: avisoPendente(versao).indicador, tocarSom: false, versao: null, notas: '' };
  return { ...r, notificacao };
});
canal('preferencias:obter', () => ({ preferencias: lerPreferencias(), aviso: avisoPendente(versao), instalada: versao }));
canal('preferencias:salvar', a => {
  const preferencias = alterarPreferencias(a);
  // Iniciar com o Windows só existe se a pessoa ligar explicitamente; desligar remove o registro.
  if (a.iniciarComWindows !== undefined && app.isPackaged) app.setLoginItemSettings({ openAtLogin: preferencias.iniciarComWindows, args: preferencias.iniciarComWindows ? ['--oculto'] : [] });
  return { preferencias };
});
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
canal('espacos:automacoes',async a=>{const e=espacos.obterEspaco(a.id);const k6=(await localizarK6())!==null;if(!e.pastaLocal)return {pastaLocal:null,estado:'SEM_PASTA',frameworks:[],capacidades:[],k6Disponivel:k6};const p=await carregarProjeto(e.pastaLocal);const c=await contextoCompleto(p);return {pastaLocal:p.raiz,estado:'INTEGRADO',frameworks:c.frameworks,capacidades:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,k6Disponivel:k6};});
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

// ---- 2.8: agenda, worker residente, execuções e comentário Jira. A página nunca informa comando, caminho nem aprovação. ----
const idiomaAtual = (): Idioma => lerPreferencias().idioma;
const worker = new Worker({ servicos: servicos as never, aoEvento: e => publicarEvento(e) });
type Aviso = { n: number; tipo: string; titulo: string; detalhe: string; rotinaId?: string; destino?: string; at: string };
const avisos: Aviso[] = []; let contadorAviso = 0;
function empilhar(a: Omit<Aviso, 'n' | 'at'>) { avisos.push({ ...a, n: ++contadorAviso, at: new Date().toISOString() }); if (avisos.length > 100) avisos.shift(); }
function publicarEvento(e: EventoWorker) {
  empilhar({ tipo: e.tipo, titulo: e.titulo, detalhe: e.detalhe, rotinaId: e.rotinaId || undefined });
  const p = lerPreferencias();
  if (p.notificarAgenda && !p.silenciar && Notification.isSupported() && e.tipo !== 'AGENDAMENTO_INICIADO') {
    const n = new Notification({ title: `Prumo QA — ${e.titulo}`, body: e.detalhe.slice(0, 200), silent: !p.som });
    n.on('click', () => navegar('execucoes')); n.show();
  }
  atualizarBandeja();
}
function navegar(destino: string) { empilhar({ tipo: 'NAVEGAR', titulo: destino, detalhe: '', destino }); mostrarJanela(); }
canal('worker:eventos', a => ({ eventos: avisos.filter(x => x.n > a.desde), ultimo: contadorAviso }));
canal('worker:estado', () => ({ ...worker.estado(), bandeja: bandeja !== null }));
canal('worker:pausa', a => { agendaCore.definirPausaGlobal(a.pausado); atualizarBandeja(); return worker.estado(); });
canal('agenda:listar', a => agendaOp.listarAgenda(a.espacoId));
canal('agenda:salvar', async a => { await agendaOp.validarRotina(a.dados); return a.id ? agendaCore.editarRotina(a.id, a.dados) : agendaCore.criarRotina(a.dados); });
canal('agenda:estado', a => (a.acao === 'pausar' ? agendaCore.pausarRotina(a.id) : a.acao === 'retomar' ? agendaCore.retomarRotina(a.id) : agendaCore.desativarRotina(a.id)));
canal('agenda:excluir', async (a, j) => {
  const i = idiomaAtual(); const r = agendaCore.obterRotina(a.id);
  if (!(await confirmar(j, tm('excluirTitulo', i), tm('excluirMsg', i, { n: r.nome }), tm('excluirDet', i), tm('excluirBtn', i)))) return { canceled: true };
  return { canceled: false, ...agendaCore.excluirRotina(a.id) };
});
canal('agenda:executar', async a => { const t = worker.executarAgora(a.id); void worker.tick(); return { trabalho: t.id, estado: t.estado }; });
canal('agenda:autorizar', async (a, j) => {
  const i = idiomaAtual(); const r = agendaCore.obterRotina(a.id);
  if (!(await confirmar(j, tm('autTitulo', i), tm('autMsg', i, { n: r.nome, d: a.dias, u: a.maxUsos }), tm('autDet', i, { r: agendaOp.permissoesDaRotina(r).join('\n'), a: r.ambiente }), tm('continuar', i)))) return { canceled: true };
  return { canceled: false, autorizacoes: await agendaOp.autorizarRotina(a.id, { dias: a.dias, maxUsos: a.maxUsos }, solicitarAprovacao) };
});
canal('agenda:revogar', a => ({ autorizacao: autorizacoesCore.revogarExecucao(a.id) }));
canal('agenda:permissoes', a => agendaOp.listarPermissoes(a.espacoId));
canal('agenda:politica', async (a, j) => {
  const i = idiomaAtual(); const e = espacos.obterEspaco(a.espacoId);
  if (!(await confirmar(j, tm('polTitulo', i), tm('polMsg', i, { t: a.tickets.join(', ') }), tm('polDet', i, { p: e.nome, i: a.tipos.join(', '), d: a.dias, m: a.maxPublicacoes }), tm('polBtn', i)))) return { canceled: true };
  return { canceled: false, politica: autorizacoesCore.criarPoliticaPublicacao(a.espacoId, { tickets: a.tickets, tipos: a.tipos, dias: a.dias, maxPublicacoes: a.maxPublicacoes }, usuarioWindows()) };
});
canal('agenda:revogarpolitica', a => ({ politica: autorizacoesCore.revogarPublicacao(a.id) }));
canal('execucoes:listar', a => listarExecucoes(a.filtro));
canal('execucoes:metricas', a => metricas(a.espacoId));
canal('jira:previa', a => prepararPublicacao(a.trabalhoId));
canal('jira:publicar', async (a, j) => {
  const i = idiomaAtual(); const prev = prepararPublicacao(a.trabalhoId);
  if (!(await confirmar(j, tm('pubTitulo', i), tm('pubMsg', i, { t: prev.ticket }), tm('pubDet', i, { x: prev.texto.slice(0, 1500) }), tm('pubBtn', i)))) return { canceled: true };
  const r = await publicarComentario(a.trabalhoId, 'MANUAL', servicos, undefined, true);
  return { canceled: false, estado: r.estado, comentarioId: r.comentarioId ?? null, erro: r.erro ?? null };
});

// ---- Janela, bandeja do Windows e ciclo de vida residente (2.8) ----
let janelaPrincipal: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let saindo = false;
let avisouBandeja = false;
const iniciouOculto = process.argv.includes('--oculto');

function criarJanela(): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1080, height: 720, minWidth: 820, minHeight: 560, show: false, backgroundColor: '#0b1020', title: 'Prumo QA',
    icon: path.join(raizApp, 'assets', 'prumo-icon.png'),
    webPreferences: { preload: path.join(raizApp, 'app', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, devTools: !app.isPackaged }
  });
  janela.once('ready-to-show', () => janela.show());
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', e => e.preventDefault());
  janela.webContents.on('will-attach-webview', e => e.preventDefault());
  // Fechar a janela NÃO encerra o Prumo: ele continua na bandeja para que as rotinas sigam funcionando.
  janela.on('close', e => {
    if (saindo) return;
    e.preventDefault(); janela.hide();
    if (!avisouBandeja && Notification.isSupported()) { avisouBandeja = true; const i = idiomaAtual(); new Notification({ title: tm('bandejaTitulo', i), body: tm('bandejaCorpo', i), silent: true }).show(); }
  });
  janela.on('closed', () => { if (janelaPrincipal === janela) janelaPrincipal = null; });
  void janela.loadFile(path.join(rendererDir, 'index.html'));
  return janela;
}
function mostrarJanela() {
  if (!janelaPrincipal || janelaPrincipal.isDestroyed()) janelaPrincipal = criarJanela();
  const j = janelaPrincipal; if (j.isMinimized()) j.restore(); j.show(); j.focus();
}
function acaoMenu(id: ItemMenu['id']) {
  if (id === 'abrir') mostrarJanela(); else if (id === 'agenda') navegar('agenda'); else if (id === 'execucoes') navegar('execucoes');
  else if (id === 'pausar' || id === 'retomar') { agendaCore.definirPausaGlobal(id === 'pausar'); atualizarBandeja(); }
  else if (id === 'sair') app.quit();
  else if (id === 'estado') {
    const e = worker.estado(); const i = idiomaAtual(); const j = janelaPrincipal && !janelaPrincipal.isDestroyed() && janelaPrincipal.isVisible() ? janelaPrincipal : undefined;
    const opcoes = { type: 'info' as const, title: tm('tituloEstado', i), message: resumoEstado(e, i), buttons: [tm('fechar', i)], detail: tm('detalheEstado', i, { n: e.proximaExecucao ?? tm('nenhuma', i), p: e.pendentes, z: e.pausado ? tm('sim', i) : tm('nao', i), u: e.ultimoErro ?? tm('nenhum', i) }) };
    void (j ? dialog.showMessageBox(j, opcoes) : dialog.showMessageBox(opcoes));
  }
}
const menuBandeja = () => Menu.buildFromTemplate(modeloMenuBandeja(worker.estado(), idiomaAtual()).map(x => (x.id === 'separador' ? { type: 'separator' as const } : { label: x.rotulo, click: () => acaoMenu(x.id) })));
/** Vigia o worker: se ele parar sem o usuário pedir, tenta reiniciar e avisa; nunca finge que está ativo. */
function vigiarWorker() {
  if (saindo || worker.estado().executando) return;
  try { worker.iniciar(); empilhar({ tipo: 'WORKER_INTERROMPIDO', titulo: 'Worker', detalhe: idiomaAtual() === 'en' ? 'The worker had stopped and was restarted.' : 'O worker tinha parado e foi reiniciado.' }); } catch { /* outra instância detém a trava */ }
}
function atualizarBandeja() { if (bandeja) { bandeja.setContextMenu(menuBandeja()); bandeja.setToolTip(dicaBandeja(worker.estado(), idiomaAtual())); } }
function criarBandeja() {
  const icone = nativeImage.createFromPath(path.join(raizApp, 'assets', 'prumo-icon.png')).resize({ width: 16, height: 16 });
  bandeja = new Tray(icone); bandeja.on('click', () => mostrarJanela()); bandeja.on('double-click', () => mostrarJanela()); atualizarBandeja();
  setInterval(() => { vigiarWorker(); atualizarBandeja(); }, 15000).unref();
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => mostrarJanela());
  // Encerramento controlado: para o worker (mata filhos, registra interrupção, libera a trava) antes de sair de verdade.
  let encerrando = false;
  app.on('before-quit', e => {
    if (encerrando) return; e.preventDefault(); encerrando = true; saindo = true;
    void worker.parar().catch(() => undefined).finally(() => { bandeja?.destroy(); bandeja = null; app.quit(); });
  });
  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Nada de rede na janela: só file:// (a própria página) e devtools em desenvolvimento.
    session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !(d.url.startsWith('file:') || d.url.startsWith('devtools:')) }));
    session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
    criarBandeja();
    try { worker.iniciar(); } catch (err) { empilhar({ tipo: 'WORKER_INTERROMPIDO', titulo: 'Worker', detalhe: (err as Error).message }); }
    atualizarBandeja();
    if (!iniciouOculto) mostrarJanela();
  });
  // Sem `window-all-closed` => app.quit(): o Prumo fica residente até "Sair do Prumo".
  app.on('window-all-closed', () => undefined);
}
