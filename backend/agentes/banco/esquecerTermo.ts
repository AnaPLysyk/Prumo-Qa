/** Faz um agente esquecer um termo. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { validarAgenteDoConhecimento } from './validarAgenteDoConhecimento.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export function esquecerTermo(agente: string, termo: string, base?: string) { validarAgenteDoConhecimento(agente); return comBancoDeConhecimento(base, (db) => ({ apagado: db.prepare('DELETE FROM vocabulario WHERE agente_id = ? AND termo = ?').run(agente, semAcentos(termo).slice(0, 60)).changes > 0 })); }
