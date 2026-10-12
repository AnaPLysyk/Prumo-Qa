/** Fecha a tentativa em andamento de um trabalho com o estado final. */
import { Trabalho } from '../tipos/fila.js';

export const fecharTentativa = (t: Trabalho, estado: 'CONCLUIDA' | 'ERRO' | 'INTERROMPIDA', iso: string, codigo?: string) => { const a = t.log.at(-1); if (a && a.fim === null) { a.fim = iso; a.estado = estado; if (codigo) a.codigo = codigo; } };
