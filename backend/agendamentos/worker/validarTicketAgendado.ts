/** Rotina "validação por ticket": executa as automações ligadas ao ticket nas relações do projeto (até 5) e junta os resultados, valendo o pior. */
import { executarValidacao } from '../../testes/regras/executarValidacao.js';
import { Evidencia } from '../../testes/tipos/evidencia.js';
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { autorizacaoDelegada } from '../autorizacoes/autorizacaoDelegada.js';
import { ResultadoTrabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker, prioridade } from '../tipos/worker.js';
import { contarCasosDaEvidencia } from './resultadosDasEvidencias.js';
import { projetoDaRotina } from './apoioDoWorker.js';
import { resumoDasFalhas } from './resultadosDasEvidencias.js';

export async function validarTicketAgendado(e: EstadoDoWorker, r: Rotina, manual: boolean): Promise<ResultadoTrabalho> {
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
