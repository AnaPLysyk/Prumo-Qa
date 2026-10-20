/** Lógica e contratos de agendamentos: operações relacionadas no mesmo módulo. */
import { Rotina, SlotVencido } from "./tipos/rotina.js";

/** Diz a data e o dia da semana de um instante num fuso horário. */

function dataNoFusoHorario(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), semana: dias.indexOf(String(p.weekday)) };
}

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

/**
 * Decide o que fazer com os slots vencidos desde o último tratado. Política:
 * - dentro da tolerância: executa;
 * - fora da tolerância e PULAR: registra PERDIDO (nunca executa "atrasado" sem decisão);
 * - EXECUTAR_UMA_VEZ: executa só o mais recente; os demais ficam SUBSTITUIDO.
 */
export function horariosVencidos(r: Rotina, agora: number): SlotVencido[] {
  if (r.estado !== 'ATIVA') return [];
  const base = r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora);
  const slots = horariosEntre(r, base, agora, 500); if (!slots.length) return [];
  const tolerancia = r.toleranciaMinutos * 60000; const ultimo = slots[slots.length - 1]!;
  return slots.map(slot => {
    const atrasado = agora - slot > tolerancia;
    if (r.politicaPerdido === 'EXECUTAR_UMA_VEZ') return slot === ultimo ? { slot, executar: true } : { slot, executar: false, motivo: 'SUBSTITUIDO' as const };
    return atrasado ? { slot, executar: false, motivo: 'PERDIDO' as const } : { slot, executar: true };
  });
}

/** Converte data e hora de parede num fuso (ex.: 08:00 em São Paulo) no instante exato, tratando horário de verão. */

/** Calcula quantos minutos um fuso horário está adiantado ou atrasado num instante (considera horário de verão). */

function desvioDoFuso(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!) - Math.floor(instante / 1000) * 1000;
}

/** Converte data+hora de parede no fuso para o instante UTC. Horário repetido (fim do verão): primeira ocorrência. Horário inexistente (salto): avança para depois do salto. */
export function instanteLocal(ano: number, mes: number, dia: number, hhmm: string, zona: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const parede = Date.UTC(ano, mes - 1, dia, h, m, 0);
  const candidatos = [...new Set([desvioDoFuso(parede - 86400000, zona), desvioDoFuso(parede + 86400000, zona)])].map(o => parede - o);
  const validos = candidatos.filter(c => c + desvioDoFuso(c, zona) === parede);
  return validos.length ? Math.min(...validos) : Math.max(...candidatos);
}

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
