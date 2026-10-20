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
