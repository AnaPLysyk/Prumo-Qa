/** Controlador da funcionalidade testes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { propostasDeBugs } from "./regras/propostasDeBugs.js";
import { textoNoIdioma } from "../aplicativo/bandeja/textoNoIdioma.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { prepararOperacao } from "../conexoes/escrita/prepararOperacao.js";
import { servicosDoAplicativo } from "../conexoes/regras/servicosDoAplicativo.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { obterEspaco } from "../projetos/repositorio.js";
import { obterRunLocal } from "./repositorioRuns.js";
import { criarRunNoQase, parametrosDaRunQase } from "./integracoes/criarRunNoQase.js";
import { executarValidacao } from "./regras/executarValidacao.js";
import { executarRunLocal } from "./servicoExecucoes.js";
import { listarRunsLocais } from "./repositorioRuns.js";
import { criarPoliticaEscrita } from "../agendamentos/autorizacoes/politicas.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { prepararRunLocal } from "./servicoExecucoes.js";
import { publicarRunLocal } from "./integracoes/publicarRunLocal.js";
import { declararResultadoManual } from "./regras/declararResultadoManual.js";
import { revogarAutorizacao } from "../agendamentos/autorizacoes/revogarAutorizacao.js";

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
