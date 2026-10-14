'use strict';
/** Mostra a tela Ajuda e pesquisa a documentação do aplicativo. */
(() => {
  // ======================= Ajuda =======================
  const GRUPOS = [
    ['Primeiros passos', ['01-o-que-e', '02-como-funciona', '03-instalar', '04-vincular', '17-plataforma']],
    ['Fluxos de qualidade', ['15-contextos', '19-testes-e-integracoes', '18-agendamentos', '07-resultados', '08-metricas-e-logs']],
    ['IA e agentes', ['20-assistente-e-agentes', '05-conectar-ia', '06-sem-ia-e-com-ia']],
    ['Suporte', ['09-problemas', '10-perguntas', '16-suporte']],
    ['Segurança e dados', ['12-seguranca', '11-privacidade', 'dados', '13-termos']],
    ['Referência técnica', ['versoes', 'atualizacoes', 'integracoes', '14-sobre']]
  ];
  const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // 2.10.2: busca por palavras e radicais ("atualizar" acha "atualizações"), com sinônimos do vocabulário do Prumo.
  // Cada palavra precisa aparecer no título ou no texto; o título pesa mais na ordem.
  const VAZIAS = new Set(['a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'por', 'com', 'como', 'que', 'meu', 'minha', 'se', 'eu', 'the', 'to', 'of', 'how', 'and', 'in', 'my']);
  const radical = (p) => (p.length > 4 ? p.slice(0, Math.max(4, p.length - 3)) : p);
  const SINONIMOS = { conec: ['vincul', 'conex'], vincul: ['conec'], reposito: ['pasta', 'projeto'], cria: ['nov', 'propo'], baix: ['instal', 'download'], instal: ['baix'], atualiz: ['versao', 'versoes'], erro: ['falha', 'problema'], falh: ['erro', 'problema'], agend: ['rotina'], ia: ['agente', 'assistente'] };
  const termos = (q) => normal(q).split(/[^a-z0-9.]+/).filter((p) => p.length > 1 && !VAZIAS.has(p)).map((p) => { const r = radical(p); const extra = Object.entries(SINONIMOS).filter(([k]) => r.startsWith(k)).flatMap(([, v]) => v); return [r, ...extra]; });
  const DESCRICAO_PAINEL = {
    atualizacoes: 'Verificar se há versão nova e atualizar com um clique: o Prumo baixa o instalador oficial, confere o SHA-256 e reabre atualizado. Aviso automático, sino e som.',
    versoes: 'Histórico de versões: novidades, segurança, compatibilidade, limitações conhecidas e migração de dados de cada versão.',
    integracoes: 'Integrações técnicas: operações IPC da janela e ferramentas MCP para agentes de IA, com permissões, erros e proteções.',
    dados: 'Privacidade e dados deste computador: pasta de dados, categorias, retenção, exportação e exclusão.'
  };
  function pontuar(it, ts) {
    const titulo = normal(it.title), corpo = normal(it.corpo); let total = 0;
    for (const alternativas of ts) {
      const noTitulo = alternativas.some((a) => titulo.includes(a)); const noCorpo = alternativas.filter((a) => corpo.includes(a));
      if (!noTitulo && !noCorpo.length) return 0;
      total += (noTitulo ? 10 : 0) + Math.min(5, noCorpo.reduce((n, a) => n + corpo.split(a).length - 1, 0));
    }
    // Título curto que a busca cobre inteiro ("atualizar" → "Atualizações") vem antes de página que só cita a palavra.
    const palavras = titulo.split(/[^a-z0-9]+/).filter((p) => p.length > 1 && !VAZIAS.has(p));
    const cobertas = palavras.filter((p) => ts.some((alt) => alt.some((a) => p.startsWith(a)))).length;
    return total + (palavras.length ? Math.round(10 * cobertas / palavras.length) : 0);
  }
  const primeiroAchado = (corpo, ts) => { const c = normal(corpo); return ts.flat().map((a) => [a, c.indexOf(a)]).filter(([, i]) => i >= 0).sort((x, y) => x[1] - y[1])[0]?.[0] || ''; };
  function trecho(corpo, q) {
    const limpo = corpo.replace(/[#`*>]/g, '').replace(/\s+/g, ' '); const i = q ? normal(limpo).indexOf(q) : -1; if (i < 0) return h('p', {}, limpo.slice(0, 160) + (limpo.length > 160 ? '…' : ''));
    const ini = Math.max(0, i - 70), fim = Math.min(limpo.length, i + q.length + 110);
    return h('p', {}, (ini ? '…' : '') + limpo.slice(ini, i), h('mark', {}, limpo.slice(i, i + q.length)), limpo.slice(i + q.length, fim) + (fim < limpo.length ? '…' : ''));
  }
  abas.ajuda = async (el) => {
    const todos = await chamar(api.ajuda); if (!todos) return;
    const en = PrumoI18n.idioma === 'en';
    const docs = todos.filter((d) => !d.id.endsWith('.en')).map((d) => { const alt = en ? todos.find((x) => x.id === d.id + '.en') : null; return alt ? { ...alt, id: d.id } : { ...d, soPt: en }; });
    const paineis = { versoes: { title: 'Versões', render: painelVersoes }, atualizacoes: { title: 'Atualizações', render: painelAtualizacoes }, integracoes: { title: 'Integrações técnicas', render: painelIntegracoes }, dados: { title: 'Privacidade e dados', render: painelDados } };
    const itens = new Map([...docs.map((d) => [d.id, { id: d.id, title: d.title, soPt: d.soPt, corpo: d.body, render: () => markdown(d.body, d.id === '10-perguntas') }]), ...Object.entries(paineis).map(([id, p]) => [id, { id, ...p, corpo: tr(DESCRICAO_PAINEL[id] || '') }])]);
    const agrupados = GRUPOS.map(([g, ids]) => [g, ids.map((i) => itens.get(i)).filter(Boolean)]); const usados = new Set(agrupados.flatMap(([, l]) => l.map((i) => i.id)));
    const outros = [...itens.values()].filter((i) => !usados.has(i.id)); if (outros.length) agrupados.push(['Outros documentos', outros]);
    const grupoDe = (id) => agrupados.find(([, l]) => l.some((i) => i.id === id))?.[0];
    const corpo = h('article', { class: 'ds-prosa' }); const trilhaNav = h('div', { class: 'ds-doc-trilha' }); const resultados = h('div', { id: 'ajuda-resultados', hidden: true });
    const indice = h('nav', { class: 'indice', 'aria-label': tr('Índice da documentação') });
    for (const [g, lista] of agrupados) indice.append(h('p', { class: 'ds-doc-grupo' }, tr(g)), h('ul', { class: 'ds-links' }, lista.map((it) => h('li', {}, h('button', { type: 'button', 'data-id': it.id, onclick: () => abrir(it) }, it.title)))));
    const busca = DS.busca({ id: 'ajuda-busca', placeholder: 'Pesquisar na documentação', rotulo: 'Pesquisar na documentação' });
    const abrir = async (it) => {
      busca.input.value = ''; resultados.hidden = true; corpo.hidden = false; trilhaNav.hidden = false;
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.id === it.id));
      trilhaNav.replaceChildren(h('button', { type: 'button', onclick: () => inicio() }, tr('Ajuda')), h('span', { 'aria-hidden': 'true' }, '›'), h('span', {}, tr(grupoDe(it.id) || '')), h('span', { 'aria-hidden': 'true' }, '›'), h('span', {}, it.title));
      corpo.replaceChildren(DS.carregando()); const nos = await it.render(); corpo.replaceChildren(...[].concat(nos).filter(Boolean));
      if (it.id === '10-perguntas') corpo.classList.add('ds-faq'); else corpo.classList.remove('ds-faq');
      if (en && (it.soPt || ['versoes', 'integracoes'].includes(it.id))) corpo.prepend(h('div', { class: 'nota', 'data-i18n-ignore': '' }, 'This help content is available in Portuguese only; the interface around it is in English.'));
      el.closest('main')?.scrollTo?.({ top: 0 }); window.scrollTo({ top: 0 });
    };
    const inicio = () => {
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', 'false');
      resultados.hidden = true; corpo.hidden = false; trilhaNav.hidden = true; corpo.classList.remove('ds-faq');
      const destaques = [['01-o-que-e', 'Visão geral do produto e do que ele não faz.'], ['04-vincular', 'Projetos, pastas e serviços vinculados.'], ['19-testes-e-integracoes', 'Tickets, casos, runs e escrita autorizada.'], ['18-agendamentos', 'Rotinas, bandeja, horários perdidos e execuções.'], ['07-resultados', 'PASS, FAIL, BLOCKED e NOT_RUN sem atalhos.'], ['09-problemas', 'Diagnóstico de conexões, MCP e execução.']].map(([id, d]) => [itens.get(id), d]).filter(([i]) => i);
      corpo.replaceChildren(h('h1', {}, tr('Documentação do Prumo QA')), h('p', {}, tr('Guias de uso, fluxos de qualidade, integrações e referência técnica. Todo o conteúdo está neste computador.')),
        h('div', { class: 'ds-doc-cartoes' }, destaques.map(([it, d]) => h('button', { type: 'button', onclick: () => abrir(it) }, h('strong', {}, it.title), h('span', {}, tr(d))))));
    };
    busca.input.addEventListener('input', () => {
      const q = normal(busca.input.value.trim()); const ts = termos(q); if (q.length < 2 || !ts.length) { resultados.hidden = true; corpo.hidden = false; return; }
      const achados = [...itens.values()].map((it) => [it, pontuar(it, ts)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([it]) => it);
      resultados.replaceChildren(h('p', { class: 'suave' }, tr('{n} resultado(s) para "{q}"', { n: achados.length, q: busca.input.value.trim() })), ...(achados.length ? achados.map((it) => h('div', { class: 'ds-doc-resultado' }, h('button', { type: 'button', onclick: () => abrir(it) }, it.title), h('span', { class: 'ds-chip ds-ml' }, tr(grupoDe(it.id) || '')), it.corpo ? trecho(it.corpo, primeiroAchado(it.corpo, ts) || null) : null)) : [DS.estadoTela('vazio', 'Nada encontrado', 'Tente outro termo ou navegue pelo índice.', [], { compacto: true })]));
      resultados.hidden = false; corpo.hidden = true; trilhaNav.hidden = true;
    });
    el.append(DS.cabecalho({ titulo: 'Ajuda', info: 'Documentação, versões, integrações técnicas e dados deste computador.' }),
      h('div', { class: 'ds-barra' }, h('button', { type: 'button', id: 'ajuda-download', onclick: () => chamar(() => api.abrirSite()) }, tr('Baixar instalador no site oficial'))),
      h('div', { class: 'ds-doc ajuda' }, h('div', { class: 'ds-min0' }, h('div', { class: 'ds-barra ds-barra-solta' }, busca.no), trilhaNav, resultados, corpo), h('aside', {}, indice)));
    const alvo = itens.get(estado.ajudaAlvo); estado.ajudaAlvo = null;
    if (alvo) await abrir(alvo); else inicio();
  };
})();
