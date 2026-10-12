/** Marca o trabalho como concluído com o resultado. */
import { fecharTentativa } from './fecharTentativa.js';
import { mudarTrabalho } from './mudarTrabalho.js';
import { ResultadoTrabalho, resultadoSchema } from '../tipos/fila.js';

export const concluirTrabalho = (id: string, resultado: ResultadoTrabalho, base?: string, agora = new Date()) => mudarTrabalho(id, t => { const iso = agora.toISOString(); t.estado = 'CONCLUIDO'; t.resultado = resultadoSchema.parse(resultado); t.terminadoEm = iso; t.heartbeat = null; fecharTentativa(t, 'CONCLUIDA', iso); }, base);
