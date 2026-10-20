/** Gasta um uso da política de escrita no Qase antes de publicar. */
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';

/** Consome um uso se existir política vigente que cubra a operação e a run. Sem política: null (a operação agendada fica BLOQUEADA). */
export function consumirPoliticaEscrita(espacoId: string, operacao: string, run: number, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.escritas.find(x => x.espacoId === espacoId && x.operacao === operacao && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.runs.includes(run)); if (!p) return null; p.usos += 1; gravarAutorizacoes(r, base); return p;
}
