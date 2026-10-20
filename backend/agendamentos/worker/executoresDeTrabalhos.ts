/** Execução de rotinas e resultados de evidência — arquivos relacionados agrupados para manutenção. */
import { Evidencia } from "../../testes/tipos/evidencia.js";
import { ResultadoTrabalho, Trabalho } from "../tipos/fila.js";
import { autorizacaoDelegada } from "../autorizacoes/autorizarRotina.js";
import { executarK6, localizarK6 } from "../servicoK6.js";
import { Rotina } from "../tipos/rotina.js";
import { EstadoDoWorker, prioridade } from "../tipos/worker.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { projetoDaRotina } from "./apoioDoWorker.js";
import { ErroServico } from "../../conexoes/integracoes/ErroServico.js";
import { Executor } from "../../conexoes/tipos/operacoesExternas.js";
import { executarValidacao } from "../../testes/regras/executarValidacao.js";
import { obterRunLocal } from "../../testes/banco/runs.js";
import { publicarRunLocal } from "../../testes/integracoes/publicarRunLocal.js";
import { executarRunLocal } from "../../testes/servicoExecucoes.js";
import { gravarEstadoDasRotinas, lerEstadoDasRotinas } from "../banco/agenda.js";

// ── resultadosDasEvidencias ──
export const contarCasosDaEvidencia = (e: Pick<Evidencia, 'cases'>) => ({ pass: e.cases.filter(c => c.status === 'PASS').length, fail: e.cases.filter(c => c.status === 'FAIL').length, blocked: e.cases.filter(c => c.status === 'BLOCKED').length, notRun: e.cases.filter(c => c.status === 'NOT_RUN').length });

export function resultadoDaEvidencia(e: Evidencia & { evidencePath?: string }): ResultadoTrabalho {
  const c = contarCasosDaEvidencia(e); const f = resumoDasFalhas(e.cases);
  return { status: e.status, motivo: e.reason.slice(0, 600), contagem: c, evidenciaId: e.jobId, ...(f ? { detalhes: f } : {}) };
}

export const resumoDasFalhas = (cases: Evidencia['cases']) => cases.filter(c => c.status === 'FAIL').slice(0, 5).map(c => `${c.id}: ${c.evidence}`.slice(0, 300)).join('\n');

// ── executoresDeTrabalhos ──
export async function executarK6Agendado(e: EstadoDoWorker, r: Rotina, manual: boolean): Promise<ResultadoTrabalho> {
  const p = await projetoDaRotina(e, r.espacoId);
  const exe = e.d.localizarK6 ? await e.d.localizarK6() : await localizarK6().then(c => c ? { executable: c } : null);
  const ev = await (e.d.executarK6 ?? executarK6)(p, r.k6!, r.ambiente, exe, manual, manual ? undefined : autorizacaoDelegada(r.espacoId, r.ambiente, e.base, e.agora), undefined, e.abort.signal);
  return resultadoDaEvidencia(ev);
}

export async function executarRunQaseAgendada(e: EstadoDoWorker, t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
  const runLocal = obterRunLocal(r.runLocalId!, e.base); if (!runLocal.runIdRemoto) return { status: 'BLOCKED', motivo: 'RUN_NOT_CREATED: a run ainda não foi criada no Qase.' };
  const manual = t.origem === 'MANUAL'; const executor = e.d.servicos as unknown as Executor | null | undefined;
  const dep = { executor: executor ?? { comContexto: async () => { throw new ErroServico('SERVICE_UNAVAILABLE'); } }, base: e.base, agora: e.agora };
  await executarRunLocal(dep, runLocal.id, { executar: e.d.executar ?? executarValidacao, modo: manual ? 'MANUAL' : 'AGENDADO', delegada: (espacoId, ambiente) => autorizacaoDelegada(espacoId, ambiente, e.base, e.agora), signal: e.abort.signal });
  let pub = 'não houve resultado para publicar';
  if (executor) { const p = await publicarRunLocal(dep, runLocal.id, { confirmado: false, origem: 'AGENDADO' }); pub = p.operacao?.estado === 'BLOQUEADA' ? 'publicação no Qase BLOQUEADA (sem política vigente para esta run); resultados mantidos localmente' : p.publicados ? `${p.publicados} resultado(s) publicado(s) no Qase` : pub; }
  const f = obterRunLocal(runLocal.id, e.base); const rs = f.casos.map(c => c.resultado?.status ?? 'NOT_RUN');
  const conta = { pass: rs.filter(x => x === 'PASS').length, fail: rs.filter(x => x === 'FAIL').length, blocked: rs.filter(x => x === 'BLOCKED').length, notRun: rs.filter(x => x === 'NOT_RUN').length };
  const status = conta.fail ? 'FAIL' : conta.blocked ? 'BLOCKED' : conta.pass ? 'PASS' : 'NOT_RUN';
  const detalhes = f.casos.filter(c => c.resultado?.status === 'FAIL').slice(0, 5).map(c => `${c.casoId}: ${c.resultado!.comentario}`.slice(0, 300)).join('\n');
  return { status, motivo: `Run "${f.titulo}" (Qase #${f.runIdRemoto}): ${conta.pass} PASS, ${conta.fail} FAIL, ${conta.blocked} BLOCKED, ${conta.notRun} NOT_RUN; ${pub}.`.slice(0, 600), contagem: conta, ...(detalhes ? { detalhes } : {}) };
}

async function analisarMudancasAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
  if (!e.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
  const res = await e.d.servicos.consultar(r.espacoId, 'github', 'commits', { limite: 30 });
  const commits = (Array.isArray(res.dados) ? res.dados : []) as { sha?: string; commit?: { message?: string } }[];
  const est = lerEstadoDasRotinas(e.base); const visto = est.itens[r.id]?.github; const shas = commits.map(c => String(c.sha ?? '')).filter(s => /^[a-f0-9]{40}$/.test(s));
  if (!shas.length) return { status: 'INFO', motivo: 'Nenhum commit retornado pelo repositório vinculado.' };
  est.itens[r.id] = { ...est.itens[r.id], github: shas[0] }; gravarEstadoDasRotinas(est, e.base);
  if (!visto) return { status: 'INFO', motivo: `Primeira análise: referência registrada em ${shas[0]!.slice(0, 7)}. Nenhuma execução foi disparada.` };
  const novos = shas.indexOf(visto) < 0 ? shas.length : shas.indexOf(visto);
  return { status: 'INFO', motivo: novos ? `${novos}${shas.indexOf(visto) < 0 ? '+' : ''} commit(s) novo(s) desde ${visto.slice(0, 7)}. Considere executar a regressão; o Prumo não a disparou automaticamente.` : 'Sem commits novos desde a última análise.',
    detalhes: commits.slice(0, novos).map(c => `${String(c.sha).slice(0, 7)} ${String(c.commit?.message ?? '').split('\n')[0]}`.slice(0, 200)).join('\n') || undefined };
}

async function consultarJiraAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
  if (!e.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
  const res = await e.d.servicos.consultar(r.espacoId, 'jira', r.operacaoJira, { limite: 50 }, r.ticket);
  const lista = (Array.isArray(res.dados) ? res.dados : [res.dados]) as Record<string, unknown>[]; const atual: Record<string, string> = {};
  for (const i of lista.slice(0, 50)) { const f = (i.fields ?? {}) as Record<string, unknown>; if (typeof i.key === 'string') atual[i.key] = String(f.updated ?? ''); }
  const est = lerEstadoDasRotinas(e.base); const antes = est.itens[r.id]?.jira;
  const alterados = antes ? Object.keys(atual).filter(k => antes[k] !== atual[k]) : [];
  est.itens[r.id] = { ...est.itens[r.id], jira: atual }; gravarEstadoDasRotinas(est, e.base);
  return { status: 'INFO', motivo: antes ? `${Object.keys(atual).length} ticket(s) consultado(s); ${alterados.length} novo(s) ou alterado(s) desde a última consulta.` : `${Object.keys(atual).length} ticket(s) consultado(s); primeira consulta serve de referência.`, detalhes: alterados.slice(0, 20).join('\n') || undefined, ticket: r.ticket };
}

export async function executarTrabalhoDaRotina(e: EstadoDoWorker, t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
  const manual = t.origem === 'MANUAL';
  switch (r.tipo) {
    case 'smoke': case 'regressao': {
      const p = await projetoDaRotina(e, r.espacoId);
      const ev = await (e.d.executar ?? executarValidacao)(p, r.capability!, manual, manual ? undefined : autorizacaoDelegada(r.espacoId, r.ambiente, e.base, e.agora), e.abort.signal);
      return resultadoDaEvidencia(ev);
    }
    case 'validacao-ticket': return validarTicketAgendado(e, r, manual);
    case 'k6': return executarK6Agendado(e, r, manual);
    case 'run-qase': return executarRunQaseAgendada(e, t, r);
    case 'consulta-jira': return consultarJiraAgendada(e, r);
    case 'analise-mudancas': return analisarMudancasAgendada(e, r);
  }
}

/** Executa validação por ticket a partir dos vínculos confirmados do projeto. */
async function validarTicketAgendado(e: EstadoDoWorker, r: Rotina, manual: boolean): Promise<ResultadoTrabalho> {
  const esp = obterEspaco(r.espacoId, e.base);
  const caps = [...new Set(esp.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5);
  if (!caps.length) return { status: 'BLOCKED', motivo: `NO_VERIFIED_LINK: não há automação associada a ${r.ticket} nas relações declaradas do projeto. Nada foi executado.`, ticket: r.ticket };
  const executar = e.d.executar ?? executarValidacao;
  const p = await projetoDaRotina(e, r.espacoId); const evs: Evidencia[] = [];
  for (const cap of caps) { if (e.abort.signal.aborted) break; evs.push(await executar(p, cap, manual, manual ? undefined : autorizacaoDelegada(r.espacoId, r.ambiente, e.base, e.agora), e.abort.signal)); }
  const pior = evs.reduce<keyof typeof prioridade>((a, ev) => prioridade[ev.status] > prioridade[a] ? ev.status : a, 'PASS');
  const soma = evs.map(contarCasosDaEvidencia).reduce((a, c) => ({ pass: a.pass + c.pass, fail: a.fail + c.fail, blocked: a.blocked + c.blocked, notRun: a.notRun + c.notRun }), { pass: 0, fail: 0, blocked: 0, notRun: 0 });
  const f = resumoDasFalhas(evs.flatMap(ev => ev.cases));
  return { status: evs.length ? pior : 'NOT_RUN', motivo: `${evs.length} automação(ões) associada(s) a ${r.ticket}: ${evs.map(ev => `${ev.capability}=${ev.status}`).join(', ')}`.slice(0, 600), contagem: soma, evidenciaId: evs.at(-1)?.jobId, ticket: r.ticket, ...(f ? { detalhes: f } : {}) };
}
