/** Controlador da tela testes: concentra canais de entrada, organizados por área funcional. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { listarExecucoes, executarRunLocal, prepararRunLocal } from "./servicoExecucoes.js";
import { listarEvidenciasDoProjeto } from "./servicoExecucoes.js";
import { mapaDeVinculos } from "./regras/mapaDeVinculos.js";
import { hash } from "../compartilhado/seguranca/hash.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { arquivoDeTeste, catalogoDeTestes, pareceArquivoDePipeline } from "./servicoClassificacao.js";
import { confirmarNoWindows } from "../aplicativo/janela/controleDaJanela.js";
import { escreverArquivoDeTeste } from "./regras/escreverArquivoDeTeste.js";
import { listarPipelines } from "./regras/escreverArquivoDeTeste.js";
import { propostasDeBugs } from "./regras/propostasDeBugs.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { prepararOperacao } from "../conexoes/escrita/executarOperacao.js";
import { servicosDoAplicativo } from "../conexoes/regras/nucleoServicos.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { obterRunLocal, listarRunsLocais } from "./banco/runs.js";
import { criarRunNoQase, parametrosDaRunQase } from "./integracoes/publicarRunLocal.js";
import { executarValidacao } from "./regras/executarValidacao.js";
import { criarPoliticaEscrita } from "../agendamentos/autorizacoes/politicas.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { publicarRunLocal } from "./integracoes/publicarRunLocal.js";
import { declararResultadoManual } from "./servicoExecucoes.js";
import { revogarAutorizacao } from "../agendamentos/banco/autorizacoes.js";
import { prepararPublicacao } from "./servicoExecucoes.js";
import { publicarComentarioDeResultado } from "./integracoes/publicarRunLocal.js";
import { salvarCasoLocal, listarRepositorioLocal, salvarSuiteLocal } from "./servicoCasos.js";

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

export const runsPreparar: TratadorDoCanal<'runs:preparar'> = a => prepararRunLocal(a.espacoId, { titulo: a.titulo, ambiente: a.ambiente, casos: a.casos, planoId: a.planoId, marcoId: a.marcoId, ambienteQaseId: a.ambienteQaseId });

export const runsPublicar: TratadorDoCanal<'runs:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const pend = run.casos.filter(c => c.resultado && c.resultado.status !== 'NOT_RUN' && !c.publicado);
  if (!run.runIdRemoto) throw new Error('RUN_NOT_CREATED: crie a run no Qase antes de publicar.'); if (!pend.length) return { canceled: false, publicados: 0, operacao: null };
  const resumo = pend.slice(0, 12).map(c => `${c.casoId} · ${c.resultado!.status}${c.resultado!.origem === 'MANUAL' ? ' (manual)' : ''} · ${c.titulo}`).join('\n') + (pend.length > 12 ? `\n… +${pend.length - 12}` : '');
  if (!(await confirmarNoWindows(j, textoNoIdioma('pubRunTitulo', i), textoNoIdioma('pubRunMsg', i, { n: pend.length, r: run.runIdRemoto }), textoNoIdioma('pubRunDet', i, { x: resumo }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await publicarRunLocal({ executor: servicosDoAplicativo }, a.id, { confirmado: true, anexarEvidencia: a.anexarEvidencia })), run: obterRunLocal(a.id) };
};

export const runsResultado: TratadorDoCanal<'runs:resultado'> = async (a, j) => {
  const i = idiomaAtual(); if (!(await confirmarNoWindows(j, textoNoIdioma('manTitulo', i), textoNoIdioma('manMsg', i, { s: a.status, c: a.casoId }), textoNoIdioma('manDet', i), textoNoIdioma('manBtn', i)))) return { canceled: true };
  return { canceled: false, run: declararResultadoManual(a.id, a.casoId, { status: a.status, comentario: a.comentario }, usuarioDoWindows()) };
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
export const repositorioCaso: TratadorDoCanal<'repositorio:caso'> =
  dados => salvarCasoLocal(dados);

export const repositorioListar: TratadorDoCanal<'repositorio:listar'> =
  dados => listarRepositorioLocal(dados.espacoId);

export const repositorioSuite: TratadorDoCanal<'repositorio:suite'> =
  dados => salvarSuiteLocal(dados);
