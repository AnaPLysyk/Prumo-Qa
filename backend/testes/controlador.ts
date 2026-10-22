/** Controlador da tela testes: concentra canais de entrada, organizados por área funcional. */
import { dialog } from "electron";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { copiarEvidenciaManual, evidenciasDoCenario } from "./integracoes/evidenciasDaRun.js";
import { importarRepositorioLocal } from "./servicoCasos.js";
import { listarExecucoes, executarRunLocal, prepararRunLocal, editarRunLocal } from "./servicoExecucoes.js";
import { listarEvidenciasDoProjeto } from "./servicoExecucoes.js";
import { mapaDeVinculos } from "./regras/mapaDeVinculos.js";
import { hash } from "../compartilhado/seguranca/hash.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { arquivoDeTeste, catalogoDeTestes, pareceArquivoDePipeline } from "./servicoClassificacao.js";
import { confirmarNoWindows } from "../aplicativo/janela/controleDaJanela.js";
import { escreverArquivoDeTeste } from "./servicoClassificacao.js";
import { listarPipelines } from "./servicoClassificacao.js";
import { propostasDeBugs } from "./regras/propostasDeBugs.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { prepararOperacao } from "../conexoes/escrita/executarOperacao.js";
import { servicosDoAplicativo } from "../conexoes/regras/nucleoServicos.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { obterRunLocal, listarRunsLocais, removerRunLocal } from "./banco/runs.js";
import { criarRunNoQase, parametrosDaRunQase } from "./integracoes/publicarRunLocal.js";
import { executarValidacao } from "./regras/executarValidacao.js";
import { criarPoliticaEscrita } from "../agendamentos/autorizacoes/autorizarRotina.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { publicarRunLocal } from "./integracoes/publicarRunLocal.js";
import { declararResultadoManual } from "./servicoExecucoes.js";
import { revogarAutorizacao } from "../agendamentos/banco/autorizacoes.js";
import { prepararPublicacao } from "./servicoExecucoes.js";
import { publicarComentarioDeResultado } from "./integracoes/publicarRunLocal.js";
import { salvarCasoLocal, listarRepositorioLocal, salvarSuiteLocal, removerCasoLocal, removerSuiteLocal } from "./servicoCasos.js";
import { conferirAcessoAoCanal } from '../login/regras/conferirAcessoAoCanal.js';
import { contaDaSessao } from '../login/regras/sessao.js';
import { iniciarAndamentoManual, listarAndamentoManual } from './banco/andamentoManual.js';

export const runsAndamento: TratadorDoCanal<'runs:andamento'> = async a => {
  // Leitura usa VER; registrar o início exige o mesmo acesso USAR de um resultado.
  if (a.casoId != null) conferirAcessoAoCanal('runs:resultado');
  const e = obterEspaco(a.espacoId);
  let vinculoId = 'local';
  if (a.runId.startsWith('qase-')) {
    const v = e.vinculos.find(v => v.servico === 'qase');
    if (!v) throw new Error('QASE_NOT_LINKED');
    vinculoId = v.id;
    if (a.casoId != null) {
      const r = await servicosDoAplicativo.consultar(e.id, 'qase', 'run', {}, a.runId.slice(5));
      const casos = (r.dados as { cases?: (number | { id?: number; case_id?: number })[] }).cases;
      if (!casos?.some(c => Number(typeof c === 'object' ? c.case_id ?? c.id : c) === a.casoId)) throw new Error('RUN_CASE_NOT_FOUND');
    }
  } else {
    const run = obterRunLocal(a.runId);
    if (run.espacoId !== e.id) throw new Error('RUN_PROJECT_MISMATCH');
    if (a.casoId != null && !run.casos.some(c => c.casoId === a.casoId)) throw new Error('RUN_CASE_NOT_FOUND');
  }
  const alvo = { espacoId: e.id, runId: a.runId, vinculoId };
  if (a.casoId == null) return listarAndamentoManual(alvo);
  const u = contaDaSessao();
  if (!u) throw new Error('SESSION_REQUIRED');
  return [iniciarAndamentoManual(alvo, a.casoId, { id: u.id, nome: u.nome, login: u.login })];
};

// controlador — operações relacionadas
export const execucoesListar: TratadorDoCanal<'execucoes:listar'> = a => listarExecucoes(a.filtro);

export const projetoEvidencias: TratadorDoCanal<'projeto:evidencias'> = a => listarEvidenciasDoProjeto(a.root, a.jobId);

export const vinculosMapa: TratadorDoCanal<'vinculos:mapa'> = a => mapaDeVinculos(a.espacoId);

// controladorArquivos — operações relacionadas
export const testesArquivo: TratadorDoCanal<'testes:arquivo'> = a => { const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE'); const r = arquivoDeTeste(e.pastaLocal, a.arquivo); const conteudo = mascarar(r.conteudo); return { ...r, conteudo, hash: hash(r.conteudo), editavel: conteudo === r.conteudo }; };

export const testesCatalogo: TratadorDoCanal<'testes:catalogo'> = a => { const e = obterEspaco(a.espacoId); return e.pastaLocal ? { semPasta: false, catalogo: catalogoDeTestes(e.pastaLocal) } : { semPasta: true, catalogo: null }; };

export const testesGravar: TratadorDoCanal<'testes:gravar'> = async (a, j) => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE');
  const linhas = a.conteudo.split(/\r?\n/).length;
  const pipeline = pareceArquivoDePipeline(a.arquivo.replaceAll('\\', '/'));
  const detalhe = `Pasta: ${e.pastaLocal}\nArquivo: ${a.arquivo}\n${a.hashBase === null ? `Arquivo novo com ${linhas} linha(s).` : `O conteúdo atual será substituído por ${linhas} linha(s).`}\n${pipeline ? 'Este arquivo define um pipeline de CI/CD: só passa a valer no GitHub depois que você enviar o repositório.' : 'O Prumo só grava arquivos de teste dentro desta pasta.'} Nada é executado nem enviado.`;
  if (!await confirmarNoWindows(j, pipeline ? (a.hashBase === null ? 'Criar pipeline' : 'Salvar pipeline') : a.hashBase === null ? 'Criar arquivo de teste' : 'Salvar arquivo de teste', `Gravar ${a.arquivo} na pasta do projeto ${e.nome}?`, detalhe, 'Salvar')) return { canceled: true };
  return escreverArquivoDeTeste(e.pastaLocal, a.arquivo, a.conteudo, a.hashBase);
};

export const testesPipelines: TratadorDoCanal<'testes:pipelines'> = (a) => { const e = obterEspaco(a.espacoId); return { pastaVinculada: !!e.pastaLocal, pipelines: e.pastaLocal ? listarPipelines(e.pastaLocal) : [] }; };

// controladorExecucoes — operações relacionadas
export const runsBugs: TratadorDoCanal<'runs:bugs'> = a => propostasDeBugs(a.id, undefined, a.classificacao);

export const runsCriar: TratadorDoCanal<'runs:criar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const prev = prepararOperacao(run.espacoId, 'qase.criar_run', parametrosDaRunQase(run));
  if (!(await confirmarNoWindows(j, textoNoIdioma('opTitulo', i), textoNoIdioma('opMsg', i, { s: 'Qase', r: prev.rotulo }), textoNoIdioma('opDet', i, { x: prev.resumo + '\n\n' + prev.efeito, p: obterEspaco(run.espacoId).nome }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await criarRunNoQase({ executor: servicosDoAplicativo }, a.id, { confirmado: true })) };
};

export const runsExecutar: TratadorDoCanal<'runs:executar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const n = new Set(run.casos.filter(c => c.capability).map(c => c.capability)).size;
  if (!(await confirmarNoWindows(j, textoNoIdioma('execRunTitulo', i), textoNoIdioma('execRunMsg', i, { n }), textoNoIdioma('execRunDet', i), textoNoIdioma('execRunBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await executarRunLocal({ executor: servicosDoAplicativo }, a.id, { executar: executarValidacao, modo: 'MANUAL' })), run: obterRunLocal(a.id) };
};

export const runsListar: TratadorDoCanal<'runs:listar'> = a => listarRunsLocais(a.espacoId);

export const runsPolitica: TratadorDoCanal<'runs:politica'> = async (a, j) => {
  const i = idiomaAtual(); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('polQaseTitulo', i), textoNoIdioma('polQaseMsg', i, { r: a.runId }), textoNoIdioma('polQaseDet', i, { p: e.nome, d: a.dias, m: a.maxUsos }), textoNoIdioma('polQaseBtn', i)))) return { canceled: true };
  return { canceled: false, politica: criarPoliticaEscrita(a.espacoId, { operacao: 'qase.publicar_resultados', runs: [a.runId], dias: a.dias, maxUsos: a.maxUsos }, usuarioDoWindows()) };
};

export const runsPreparar: TratadorDoCanal<'runs:preparar'> = async a => {
  if (a.runIdRemoto) {
    const r = await servicosDoAplicativo.consultar(a.espacoId, 'qase', 'run', {}, String(a.runIdRemoto));
    const dados = r.dados as { cases?: (number | { id?: number; case_id?: number })[] };
    const ids = new Set(dados.cases?.map(c => Number(typeof c === 'object' ? c.case_id ?? c.id : c)));
    if (a.casos.some(c => c.casoLocalId || !ids.has(c.casoId))) throw new Error('RUN_CASE_NOT_FOUND');
  }
  return prepararRunLocal(a.espacoId, { titulo: a.titulo, ambiente: a.ambiente, casos: a.casos, runIdRemoto: a.runIdRemoto, planoId: a.planoId, marcoId: a.marcoId, ambienteQaseId: a.ambienteQaseId });
};

export const runsEditar: TratadorDoCanal<'runs:editar'> = a => editarRunLocal(a.id, { titulo: a.titulo, ambiente: a.ambiente });

export const runsApagar: TratadorDoCanal<'runs:apagar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id);
  if (!(await confirmarNoWindows(j, textoNoIdioma('excluirRunTitulo', i), textoNoIdioma('excluirRunMsg', i, { r: run.titulo }), textoNoIdioma('excluirRunDet', i), textoNoIdioma('excluirRunBtn', i)))) return { canceled: true };
  removerRunLocal(a.id);
  return { canceled: false };
};

export const runsPublicar: TratadorDoCanal<'runs:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const pend = run.casos.filter(c => c.resultado && c.resultado.status !== 'NOT_RUN' && !c.publicado);
  if (!run.runIdRemoto) throw new Error('RUN_NOT_CREATED: crie a run no Qase antes de publicar.'); if (!pend.length) return { canceled: false, publicados: 0, operacao: null };
  const resumo = pend.slice(0, 12).map(c => `${c.casoId} · ${c.resultado!.status}${c.resultado!.origem === 'MANUAL' ? ' (manual)' : ''} · ${c.titulo}`).join('\n') + (pend.length > 12 ? `\n… +${pend.length - 12}` : '');
  if (!(await confirmarNoWindows(j, textoNoIdioma('pubRunTitulo', i), textoNoIdioma('pubRunMsg', i, { n: pend.length, r: run.runIdRemoto }), textoNoIdioma('pubRunDet', i, { x: resumo }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await publicarRunLocal({ executor: servicosDoAplicativo }, a.id, { confirmado: true, anexarEvidencia: a.anexarEvidencia })), run: obterRunLocal(a.id) };
};

export const runsResultado: TratadorDoCanal<'runs:resultado'> = async (a, j) => {
  const i = idiomaAtual(); if (!(await confirmarNoWindows(j, textoNoIdioma('manTitulo', i), textoNoIdioma('manMsg', i, { s: a.status, c: a.casoId }), textoNoIdioma('manDet', i), textoNoIdioma('manBtn', i)))) return { canceled: true };
  return { canceled: false, run: declararResultadoManual(a.id, a.casoId, { status: a.status, comentario: a.comentario }, contaDaSessao()?.nome ?? usuarioDoWindows()) };
};

const casoDaRun = (id: string, casoId: number) => { const run = obterRunLocal(id); const caso = run.casos.find(c => c.casoId === casoId); if (!caso) throw new Error('RUN_CASE_NOT_FOUND'); return { run, caso, pasta: obterEspaco(run.espacoId).pastaLocal }; };

export const runsEvidencias: TratadorDoCanal<'runs:evidencias'> = a => {
  const { run, caso, pasta } = casoDaRun(a.id, a.casoId);
  return pasta ? { pastaVinculada: true, ...evidenciasDoCenario(pasta, run, caso) } : { pastaVinculada: false, rodada: null, arquivos: [] };
};

export const runsEvidenciar: TratadorDoCanal<'runs:evidenciar'> = async (a, j) => {
  const { run, caso, pasta } = casoDaRun(a.id, a.casoId);
  if (!caso.resultado || caso.resultado.status === 'NOT_RUN') throw new Error('RESULT_REQUIRED: registre o resultado do cenário antes de anexar evidência.');
  if (!pasta) throw new Error('PROJECT_FOLDER_REQUIRED: vincule a pasta do projeto; as evidências ficam em .prumo/evidencias dela.');
  const r = await dialog.showOpenDialog(j!, { title: textoNoIdioma('evidTitulo', idiomaAtual()), properties: ['openFile', 'multiSelections'], filters: [{ name: 'Imagens, vídeos, logs e relatórios', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'txt', 'log', 'json', 'html', 'zip', 'pdf'] }] });
  if (r.canceled || !r.filePaths.length) return { canceled: true };
  return { canceled: false, ...copiarEvidenciaManual(pasta, run.id, a.casoId, r.filePaths) };
};

export const runsRevogar: TratadorDoCanal<'runs:revogar'> = a => ({ politica: revogarAutorizacao('escritas', a.id) });

// controladorJira — operações relacionadas
export const jiraPrevia: TratadorDoCanal<'jira:previa'> = a => prepararPublicacao(a.trabalhoId);

export const jiraPublicar: TratadorDoCanal<'jira:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const prev = prepararPublicacao(a.trabalhoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('pubTitulo', i), textoNoIdioma('pubMsg', i, { t: prev.ticket }), textoNoIdioma('pubDet', i, { x: prev.texto.slice(0, 1500) }), textoNoIdioma('pubBtn', i)))) return { canceled: true };
  const r = await publicarComentarioDeResultado(a.trabalhoId, 'MANUAL', servicosDoAplicativo, undefined, true);
  return { canceled: false, estado: r.estado, comentarioId: r.comentarioId ?? null, erro: r.erro ?? null };
};

// controladorRepositorio — operações relacionadas
export const repositorioCaso: TratadorDoCanal<'repositorio:caso'> = async (dados, j) => {
  if (!('remover' in dados)) return salvarCasoLocal(dados);
  const caso = listarRepositorioLocal(dados.espacoId).casos.find(c => c.id === dados.id);
  if (!caso) throw new Error('LOCAL_CASE_NOT_FOUND');
  if (!(await confirmarNoWindows(j, 'Remover cenário do Prumo', `Remover "${caso.titulo}" deste computador?`, 'O cenário e os vínculos declarados dele saem do Prumo. Um caso já publicado no Qase não é alterado.', 'Remover'))) return { canceled: true };
  return { canceled: false, ...removerCasoLocal(dados.espacoId, dados.id) };
};

export const repositorioListar: TratadorDoCanal<'repositorio:listar'> =
  dados => listarRepositorioLocal(dados.espacoId);

export const repositorioImportar: TratadorDoCanal<'repositorio:importar'> = async (a, j) => {
  const r = await dialog.showOpenDialog(j!, { title: 'Importar casos do repositório', properties: ['openFile'], filters: [{ name: 'Repositório Prumo (JSON)', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const fs = await import('node:fs/promises');
  const estat = await fs.stat(r.filePaths[0]);
  if (estat.size > 2 * 1024 * 1024) throw new Error('IMPORT_FORMAT_INVALID: arquivo excede 2 MiB');
  const texto = await fs.readFile(r.filePaths[0], 'utf8');
  let dados: unknown;
  try { dados = JSON.parse(texto); } catch { throw new Error('IMPORT_FORMAT_INVALID: JSON inválido'); }
  const resumo = typeof dados === 'object' && dados !== null && 'casos' in dados ? (dados as { casos?: unknown[] }).casos?.length ?? 0 : 0;
  if (!(await confirmarNoWindows(j!, 'Importar casos do repositório', `Adicionar ${resumo} caso(s) local(is) ao projeto atual? Os casos serão criados como cópias e não substituirão os existentes.`, 'A importação mantém o arquivo original e não publica no Qase.', 'Importar'))) return { canceled: true };
  return { canceled: false, ...importarRepositorioLocal(a.espacoId, dados) };
};

export const repositorioSuite: TratadorDoCanal<'repositorio:suite'> = async (dados, j) => {
  if (!('remover' in dados)) return salvarSuiteLocal(dados);
  const suite = listarRepositorioLocal(dados.espacoId).suites.find(s => s.id === dados.id);
  if (!suite) throw new Error('LOCAL_SUITE_NOT_FOUND');
  if (!(await confirmarNoWindows(j, 'Remover suíte do Prumo', `Remover a suíte "${suite.titulo}" deste computador?`, 'Os cenários e as suítes dentro dela sobem para a suíte pai; nada é apagado junto. Uma suíte já criada no Qase não é alterada.', 'Remover'))) return { canceled: true };
  return { canceled: false, ...removerSuiteLocal(dados.espacoId, dados.id) };
};
