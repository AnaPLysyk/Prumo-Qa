/** Converte data e hora de parede num fuso (ex.: 08:00 em São Paulo) no instante exato, tratando horário de verão. */
import { desvioDoFuso } from './desvioDoFuso.js';

/** Converte data+hora de parede no fuso para o instante UTC. Horário repetido (fim do verão): primeira ocorrência. Horário inexistente (salto): avança para depois do salto. */
export function instanteLocal(ano: number, mes: number, dia: number, hhmm: string, zona: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const parede = Date.UTC(ano, mes - 1, dia, h, m, 0);
  const candidatos = [...new Set([desvioDoFuso(parede - 86400000, zona), desvioDoFuso(parede + 86400000, zona)])].map(o => parede - o);
  const validos = candidatos.filter(c => c + desvioDoFuso(c, zona) === parede);
  return validos.length ? Math.min(...validos) : Math.max(...candidatos);
}
