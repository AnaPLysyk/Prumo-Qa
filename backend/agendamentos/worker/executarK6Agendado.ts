/** Rotina k6: procura o executável oficial e roda o teste de desempenho com a autorização prévia (ou a aprovação humana, se manual). */
import { autorizacaoDelegada } from '../autorizacoes/autorizacaoDelegada.js';
import { executarK6 } from '../servicoK6.js';
import { localizarK6 } from '../servicoK6.js';
import { ResultadoTrabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { projetoDaRotina } from './apoioDoWorker.js';
import { resultadoDaEvidencia } from './resultadosDasEvidencias.js';

export async function executarK6Agendado(e: EstadoDoWorker, r: Rotina, manual: boolean): Promise<ResultadoTrabalho> {
  const p = await projetoDaRotina(e, r.espacoId);
  const exe = e.d.localizarK6 ? await e.d.localizarK6() : await localizarK6().then(c => c ? { executable: c } : null);
  const ev = await (e.d.executarK6 ?? executarK6)(p, r.k6!, r.ambiente, exe, manual, manual ? undefined : autorizacaoDelegada(r.espacoId, r.ambiente, e.base, e.agora), undefined, e.abort.signal);
  return resultadoDaEvidencia(ev);
}
