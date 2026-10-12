/** Resume o estado real do worker para a janela e a bandeja: ligado, pausado, trava, pendentes, em execução, próxima execução e último erro. */
import { agendaPausada } from '../banco/agendaPausada.js';
import { listarRotinas } from '../banco/listarRotinas.js';
import { listarTrabalhos } from '../banco/listarTrabalhos.js';
import { proximoHorario } from '../regras/proximoHorario.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { estadoDaTravaDoWorker } from './estadoDaTravaDoWorker.js';

export function estadoDoWorker(e: EstadoDoWorker) {
  const rot = listarRotinas(e.base); const trab = listarTrabalhos(e.base); const t = e.agora().getTime();
  const proximas = rot.filter(r => r.estado === 'ATIVA').map(r => proximoHorario(r, t)).filter((x): x is number => x !== null);
  return { executando: e.ativo, pausado: agendaPausada(e.base), trava: estadoDaTravaDoWorker(e.base, e.agora()), pendentes: trab.filter(x => x.estado === 'PENDENTE').length, emExecucao: trab.find(x => x.estado === 'EXECUTANDO')?.id ?? null,
    proximaExecucao: proximas.length ? new Date(Math.min(...proximas)).toISOString() : null, rotinasAtivas: rot.filter(r => r.estado === 'ATIVA').length, rotinasPausadas: rot.filter(r => r.estado === 'PAUSADA').length, ultimoErro: e.ultimoErro };
}
