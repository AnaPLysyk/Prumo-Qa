/** Lista os termos que um agente aprendeu. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { validarAgenteDoConhecimento } from './validarAgenteDoConhecimento.js';
import { Linha } from '../tipos/conhecimento.js';

export function vocabularioDoAgente(agente: string, base?: string) { validarAgenteDoConhecimento(agente); return comBancoDeConhecimento(base, (db) => (db.prepare('SELECT termo, peso, ultima_em FROM vocabulario WHERE agente_id = ? ORDER BY peso DESC, ultima_em DESC LIMIT 60').all(agente) as Linha[]).map((x) => ({ termo: String(x.termo), peso: Number(x.peso), ultimaEm: String(x.ultima_em) }))); }
