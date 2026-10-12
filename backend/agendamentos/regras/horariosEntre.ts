/** Lista os horários em que a rotina deveria rodar entre dois instantes (único, intervalo, diário ou semanal). */
import { dataNoFusoHorario } from './dataNoFusoHorario.js';
import { instanteLocal } from './instanteLocal.js';
import { Rotina } from '../tipos/rotina.js';

/** Slots (instantes UTC) estritamente depois de `depois` e até `ate`, em ordem. Limitado para nunca gerar laço longo. */
export function horariosEntre(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora'>, depois: number, ate: number, limite = 2000): number[] {
  const f = r.frequencia; const saida: number[] = [];
  if (ate <= depois) return saida;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); if (t > depois && t <= ate) saida.push(t); return saida; }
  if (f.tipo === 'intervalo') {
    const passo = f.minutos * 60000; const ancora = Date.parse(r.ancora);
    let k = Math.max(1, Math.floor((depois - ancora) / passo) + 1);
    for (; saida.length < limite; k++) { const t = ancora + k * passo; if (t > ate) break; if (t > depois) saida.push(t); }
    return saida;
  }
  // diário e semanal: percorre dias de parede no fuso (a partir de um dia antes, por causa de deslocamentos de fuso)
  const inicio = dataNoFusoHorario(depois - 86400000, r.fuso);
  let dia = Date.UTC(inicio.ano, inicio.mes - 1, inicio.dia);
  for (let i = 0; i < 4000 && saida.length < limite; i++, dia += 86400000) {
    const d = new Date(dia); const semana = d.getUTCDay();
    if (f.tipo === 'semanal' && !f.dias.includes(semana)) continue;
    const t = instanteLocal(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), f.hora, r.fuso);
    if (t > ate + 86400000 * 2) break;
    if (t > depois && t <= ate) saida.push(t);
    if (t > ate && dia > ate + 86400000 * 2) break;
  }
  return [...new Set(saida)].sort((a, b) => a - b);
}
