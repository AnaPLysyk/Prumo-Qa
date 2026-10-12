'use strict';
/** Calcula horários dos formulários de agendamentos nos fusos selecionados. */
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const TIPOS = { 'consulta-jira': 'Consulta Jira', smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Validação por ticket', 'analise-mudancas': 'Análise de mudanças', k6: 'Desempenho (k6)', 'run-qase': 'Run do Qase' };
const AMBIENTES = { local: 'Local', teste: 'Teste', homologacao: 'Homologação', producao: 'Produção' };
const rotuloTipo = (t) => tr(TIPOS[t] || t);

// ---- Horário de parede <-> instante (somente para o formulário; o cálculo real de horários é do núcleo) ----
function desvioMin(ms, fuso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).filter((x) => x.type !== 'literal').map((x) => [x.type, +x.value]));
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000;
}
function paredeParaISO(valor, fuso) {
  const [d, t] = valor.split('T'); const [Y, M, D] = d.split('-').map(Number); const [hh, mm] = t.split(':').map(Number);
  const parede = Date.UTC(Y, M - 1, D, hh, mm); let ms = parede - desvioMin(parede, fuso) * 60000; ms = parede - desvioMin(ms, fuso) * 60000;
  const off = desvioMin(ms, fuso); const a = Math.abs(off);
  return `${valor}:00${off >= 0 ? '+' : '-'}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
function instanteParaParede(iso, fuso) {
  const ms = Date.parse(iso); const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms)).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const fusoLocal = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
function textoFrequencia(r) {
  const f = r.frequencia;
  if (f.tipo === 'unico') return tr('Uma vez em {quando}', { quando: hora(f.em) });
  if (f.tipo === 'intervalo') return tr('A cada {n} min', { n: f.minutos });
  if (f.tipo === 'diario') return tr('Todo dia às {hora} ({fuso})', { hora: f.hora, fuso: r.fuso });
  return tr('Semanal: {dias} às {hora} ({fuso})', { dias: f.dias.map((d) => tr(DIAS[d])).join(', '), hora: f.hora, fuso: r.fuso });
}
