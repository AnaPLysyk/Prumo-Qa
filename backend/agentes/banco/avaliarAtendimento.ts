/** Guarda se a resposta foi útil ou não; só a pessoa que foi atendida avalia. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './falharConhecimento.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';

export function avaliarAtendimento(id: number, avaliacao: 'UTIL' | 'NAO_UTIL', base?: string) {
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) falharConhecimento('ATTENDANCE_NOT_FOUND');
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('UPDATE atendimentos SET avaliacao = ? WHERE id = ? AND usuario_id = ?').run(avaliacao, id, pessoa); if (!r.changes) falharConhecimento('ATTENDANCE_NOT_FOUND'); return { avaliado: true }; });
}
