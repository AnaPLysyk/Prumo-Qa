/** Diz a data e o dia da semana de um instante num fuso horário. */

export function dataNoFusoHorario(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), semana: dias.indexOf(String(p.weekday)) };
}
