/** Calcula o próximo horário em que a rotina vai rodar. */
import { horariosEntre } from './horariosEntre.js';
import { Rotina } from '../tipos/rotina.js';

export function proximoHorario(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora' | 'ultimoSlot'>, agora: number): number | null {
  const base = Math.max(r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora), Date.parse(r.ancora));
  const tentativa = (janela: number) => horariosEntre(r, Math.max(base, agora - 1), agora + janela, 1)[0] ?? null;
  const f = r.frequencia;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); return r.ultimoSlot && Date.parse(r.ultimoSlot) >= t ? null : t; }
  // Se existe slot vencido e ainda não tratado, ele é o "próximo" (será tratado pela política de perdidos).
  const vencido = horariosEntre(r, base, agora, 1)[0];
  if (vencido !== undefined) return vencido;
  return tentativa(f.tipo === 'intervalo' ? f.minutos * 60000 + 1000 : 8 * 86400000);
}
