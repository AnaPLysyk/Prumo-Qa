/** Guarda se a resposta foi útil ou não. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './falharConhecimento.js';

export function avaliarAtendimento(id: number, avaliacao: 'UTIL' | 'NAO_UTIL', base?: string) {
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('UPDATE atendimentos SET avaliacao = ? WHERE id = ?').run(avaliacao, id); if (!r.changes) falharConhecimento('ATTENDANCE_NOT_FOUND'); return { avaliado: true }; });
}
