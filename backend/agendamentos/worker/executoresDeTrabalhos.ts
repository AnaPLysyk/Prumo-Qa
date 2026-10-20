/** Executa trabalhos agendados de validação, Qase e carga K6 conforme a autorização. */
import { autorizacaoDelegada } from "../autorizacoes/autorizacaoDelegada.js";
import { executarK6, localizarK6 } from "../servicoK6.js";
import { ResultadoTrabalho, Trabalho } from "../tipos/fila.js";
import { Rotina } from "../tipos/rotina.js";
import { EstadoDoWorker } from "../tipos/worker.js";
import { projetoDaRotina } from "./apoioDoWorker.js";
import { resultadoDaEvidencia } from "./resultadosDasEvidencias.js";
import { ErroServico } from "../../conexoes/integracoes/ErroServico.js";
import { Executor } from "../../conexoes/tipos/operacoesExternas.js";
import { executarValidacao } from "../../testes/regras/executarValidacao.js";
import { obterRunLocal } from "../../testes/repositorioRuns.js";
import { publicarRunLocal } from "../../testes/integracoes/publicarRunLocal.js";
import { executarRunLocal } from "../../testes/servicoExecucoes.js";
import { validarTicketAgendado } from "./validarTicketAgendado.js";
import { gravarEstadoDasRotinas, lerEstadoDasRotinas } from "../repositorioAgenda.js";

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
