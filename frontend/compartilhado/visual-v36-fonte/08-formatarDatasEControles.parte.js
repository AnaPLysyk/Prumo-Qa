/** Formata datas e prepara elementos comuns. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const alca = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 14 30', width: 14, height: 30, 'aria-hidden': 'true' }, sv('path', { d: 'M5 10 2 15l3 5M9 10l3 5-3 5' }));
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const local = () => (PrumoI18n.idioma === 'en' ? 'en-US' : 'pt-BR');
  const diaIso = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const hm = (iso) => new Date(iso).toLocaleTimeString(local(), { hour: '2-digit', minute: '2-digit', hour12: false });
  const hms = (iso) => new Date(iso).toLocaleTimeString(local(), { hour12: false });
  const ignorar = (texto) => h('span', { 'data-i18n-ignore': '' }, texto);
