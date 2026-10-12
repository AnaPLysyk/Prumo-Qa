/** Pega o próximo trabalho pendente para executar, um de cada vez. */
import { gravarFila } from './gravarFila.js';
import { lerFila } from './lerFila.js';
import { Trabalho } from '../tipos/fila.js';

/** Pega o próximo trabalho elegível. No máximo UM em execução por projeto e UM no total (concorrência 1). */
export function pegarProximoTrabalho(base?: string, agora = new Date(), bloquear: (t: Trabalho) => boolean = () => false): Trabalho | null {
  const r = lerFila(base); if (r.trabalhos.some(t => t.estado === 'EXECUTANDO')) return null;
  const t = r.trabalhos.filter(x => x.estado === 'PENDENTE' && Date.parse(x.disponivelEm) <= agora.getTime() && !bloquear(x)).sort((a, b) => a.disponivelEm.localeCompare(b.disponivelEm))[0];
  if (!t) return null;
  const iso = agora.toISOString(); t.estado = 'EXECUTANDO'; t.tentativas += 1; t.iniciadoEm = iso; t.heartbeat = iso; t.terminadoEm = null; t.erro = null;
  t.log.push({ n: t.tentativas, inicio: iso, fim: null, estado: 'EXECUTANDO' }); t.log = t.log.slice(-10); gravarFila(r, base); return t;
}
