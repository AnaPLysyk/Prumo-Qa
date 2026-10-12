'use strict';
// Grupo B (v40): Suporte (relato revisado + diagnóstico local) e Ajuda (documentação pesquisável). Mesmos canais IPC:
// suportePreparar/Abrir/Exportar/Consultar e ajuda/versões/integrações/dados. Nada é enviado sem revisão e confirmação.
(() => {
  // ======================= Suporte =======================
  abas.suporte = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Suporte', descricao: 'Relate um bug, peça uma melhoria ou envie uma sugestão pelo GitHub Issues. O texto é revisado aqui antes de qualquer envio.' }));
    const categoria = h('select', { id: 'sup-categoria' }, [['bug', 'Bug'], ['melhoria', 'Melhoria'], ['sugestao', 'Sugestão']].map(([v, t]) => h('option', { value: v }, tr(t))));
    const titulo = h('input', { id: 'sup-titulo', type: 'text', maxlength: '120', placeholder: tr('Resumo do problema ou da ideia') });
    const descricao = h('textarea', { id: 'sup-descricao', rows: '5', maxlength: '4000', placeholder: tr('O que aconteceu? Em qual tela?') });
    const passos = h('textarea', { id: 'sup-passos', rows: '4', maxlength: '2000', placeholder: tr('1. Abrir… 2. Clicar em…') }); const esperado = h('textarea', { id: 'sup-esperado', rows: '3', maxlength: '2000' });
    const marca = (id, rotulo, ligado) => h('label', { for: id }, h('input', { type: 'checkbox', id, checked: ligado }), tr(rotulo));
    const incVersao = marca('sup-versao', 'Incluir a versão do Prumo QA', true), incSistema = marca('sup-sistema', 'Incluir o sistema operacional (somente se você autorizar)', false), incDiag = marca('sup-diagnostico', 'Incluir os últimos eventos do diagnóstico da interface (somente metadados)', false), consente = marca('sup-consentimento', 'Entendo que o texto abaixo será exibido a qualquer pessoa se eu enviar a issue', false);
    const ck = (l) => l.querySelector('input');
    const gPassos = DS.campo('Passos para reproduzir (obrigatório em bug)', passos, { inteiro: true }); const gEsperado = DS.campo('Resultado ou benefício esperado', esperado, { inteiro: true });
    categoria.addEventListener('change', () => { gPassos.hidden = categoria.value !== 'bug'; });
    const etapas = h('div', { class: 'ds-passos-form', 'aria-label': tr('Etapas do relato') }, h('span', { 'aria-current': 'step' }, tr('Descrever')), h('span', {}, tr('Revisar')), h('span', {}, tr('Enviar pelo GitHub')));
    const marcarEtapa = (i) => [...etapas.children].forEach((s, k) => (k === i ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current')));
    const saida = h('div', { id: 'sup-saida', 'aria-live': 'polite' });
    const relato = () => ({ categoria: categoria.value, titulo: titulo.value, descricao: descricao.value, passos: passos.value || undefined, esperado: esperado.value || undefined, incluirVersao: ck(incVersao).checked, incluirSistema: ck(incSistema).checked, incluirDiagnostico: ck(incDiag).checked, consentimento: ck(consente).checked });
    const revisar = async () => {
      if (!ck(consente).checked) { avisar(tr('Marque o entendimento sobre issues públicas para revisar.'), true); return; }
      const p = await chamar(() => api.suportePreparar(relato())); if (!p) return; marcarEtapa(1);
      const nos = [h('h2', {}, tr('Revisão antes de enviar')), h('p', { class: 'suave' }, p.aviso)];
      if (p.bloqueios.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'falha', id: 'sup-bloqueios', role: 'alert' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Envio bloqueado: ')), p.bloqueios.map((b) => b.tipo + (b.trecho ? ' (' + b.trecho + ')' : '')).join('; '), tr('. Remova ou substitua antes de continuar.'))));
      if (p.avisos.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'aviso', id: 'sup-avisos' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Revise: ')), p.avisos.map((b) => b.tipo + ' (' + b.trecho + ')').join('; '), tr('. Você decide se mantém.'))));
      const abrirBtn = h('button', { class: 'acao primaria', id: 'sup-abrir', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteAbrir(relato())); if (x && x.opened) { marcarEtapa(2); avisar(tr('Formulário aberto no navegador. Revise e envie por lá.')); } } }, DS.icone('externo'), tr('Abrir formulário no GitHub…'));
      const expBtn = h('button', { class: 'acao', id: 'sup-exportar', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteExportar(relato())); if (x && x.exported) avisar(tr('Relato exportado.')); } }, DS.icone('baixar'), tr('Exportar para arquivo…'));
      if (p.markdown) nos.push(h('p', { class: 'suave' }, tr('Este é exatamente o texto que será usado:')), h('pre', { id: 'sup-previa', class: 'ds-codigo' }, p.markdown), p.truncado ? h('p', { class: 'suave' }, tr('O texto é longo e será encurtado no formulário; use Exportar para guardar a versão completa.')) : null);
      nos.push(h('div', { class: 'ds-form-acoes' }, expBtn, abrirBtn));
      saida.replaceChildren(...nos.filter(Boolean)); saida.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    const form = h('form', { class: 'ds-form', onsubmit: (ev) => { ev.preventDefault(); revisar(); } }, DS.campo('Tipo', categoria), h('span'), DS.campo('Título', titulo, { inteiro: true }), DS.campo('Descrição', descricao, { inteiro: true }), gPassos, gEsperado,
      DS.grupo('O que incluir', h('div', { class: 'ds-opcoes inteiro coluna' }, incVersao, incSistema, incDiag), h('p', { class: 'suave inteiro' }, tr('Logs, evidências, caminhos, contextos e código do seu projeto nunca são anexados.'))),
      h('div', { class: 'ds-alerta inteiro', 'data-tom': 'aviso', id: 'aviso-publico' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Atenção: ')), tr('issues do repositório oficial são públicas. Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais. Nenhum e-mail de suporte é oferecido; o canal oficial é o GitHub Issues.'))),
      h('div', { class: 'ds-opcoes inteiro' }, consente), h('div', { class: 'ds-form-acoes' }, h('button', { class: 'acao primaria', id: 'sup-revisar', type: 'submit' }, tr('Revisar'))));
    // Lateral: acesso rápido, diagnóstico local e acompanhamento de chamado.
    const numero = h('input', { type: 'number', min: '1', max: '999999999', id: 'sup-numero', 'aria-label': tr('Número do chamado'), placeholder: '123', class: 'ds-w-sm' }); const chamado = h('div', { 'aria-live': 'polite', id: 'sup-chamado' });
    const consultar = async () => {
      const r = await chamar(() => api.suporteConsultar(Number(numero.value))); if (!r) return;
      chamado.replaceChildren(r.ok ? h('div', { class: 'ds-bloco' }, h('p', {}, h('strong', {}, `#${r.numero} · ${r.title}`)), h('p', {}, tr('Status: '), r.status ? h('span', { class: `estado status-${r.status.id}` }, r.status.nome) : tr(r.ambiguous ? 'rótulos conflitantes' : 'sem status informado')), r.status?.explicacao ? h('p', { class: 'suave' }, r.status.explicacao) : null,
        DS.meta([['Status aplicado em', r.statusAt ? hora(r.statusAt) : tr('indisponível')], ['Atualização da issue', hora(r.updatedAt)], ['Responsáveis', r.responsible.join(', ') || tr('não informados')]]),
        r.history.length ? DS.tempo(r.history.map((e) => ({ titulo: `${e.event === 'labeled' ? tr('Aplicado') : tr('Removido')} ${e.status}`, sub: `${hora(e.at)} · ${e.actor || tr('responsável indisponível')}` }))) : null, !r.historyComplete ? h('p', { class: 'nota' }, tr('Histórico parcial ou indisponível.')) : null, h('p', { class: 'suave' }, r.notice), DS.acao('Abrir chamado no GitHub…', () => chamar(() => api.suporteChamado(r.numero)), { icone: 'externo', compacto: true }))
        : DS.alerta(r.code, 'falha'));
    };
    numero.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') consultar(); });
    const diag = h('div', { class: 'ds-diag', id: 'sup-diagnostico-local' }, h('div', {}, h('span', {}, tr('Consultando…'))));
    const aside = h('aside', {},
      h('div', {}, h('h2', {}, tr('Antes de solicitar')), h('ul', { class: 'ds-links' }, [['Consultar documentação', () => mostrar('ajuda')], ['Verificar logs', () => mostrar('logs')], ['Conferir conexões', () => mostrar('conexoes')], ['Problemas comuns', () => { estado.ajudaAlvo = '09-problemas'; mostrar('ajuda'); }]].map(([t, fn]) => h('li', {}, h('button', { type: 'button', onclick: fn }, tr(t)))))),
      h('div', {}, h('h2', {}, tr('Diagnóstico local')), diag, h('p', { class: 'suave ds-mt' }, tr('Lido deste computador. Não é anexado ao relato sem a sua escolha.'))),
      h('div', {}, h('h2', {}, tr('Acompanhar chamado')), h('div', { class: 'ds-cab-acoes' }, numero, DS.acao('Consultar chamado', consultar, { compacto: true })), chamado));
    el.append(h('div', { class: 'ds-atendimento' }, h('div', {}, etapas, form, saida), aside));
    gPassos.hidden = categoria.value !== 'bug';
    const [info, servicos] = await Promise.all([api.info(), api.servicos()]); const w = estado.worker;
    const linha = (k, v) => h('div', {}, h('span', {}, tr(k)), h('span', {}, v));
    diag.replaceChildren(linha('Versão', info.ok ? 'v' + info.data.version : '—'), linha('Worker', w ? h('span', { class: 'chip', 'data-nivel': nivelWorker(w) }, h('i'), textoWorker(w)) : '—'), linha('Projeto', estado.espaco?.nome || estado.projetoNome || tr('nenhum selecionado')),
      linha('Conexões ativas', servicos.ok ? String(servicos.data.filter((c) => c.ativa).length) : '—'), linha('Idioma', PrumoI18n.idioma === 'en' ? 'English' : 'Português (Brasil)'));
  };

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
    el.append(DS.cabecalho({ titulo: 'Ajuda', descricao: 'Documentação, versões, integrações técnicas e dados deste computador.' }),
      h('div', { class: 'ds-doc ajuda' }, h('div', { class: 'ds-min0' }, h('div', { class: 'ds-barra ds-barra-solta' }, busca.no), trilhaNav, resultados, corpo), h('aside', {}, indice)));
    const alvo = itens.get(estado.ajudaAlvo); estado.ajudaAlvo = null;
    if (alvo) await abrir(alvo); else inicio();
  };
})();

// ======================= Contextos dentro de Agentes =======================
// Como Evidências: sem item próprio no menu. Os contextos são o que os agentes podem ler (Cérebro mostra os
// aprovados); a gestão completa (cadastro, aprovação, conflito, histórico) abre em modal a partir de Agentes.
(() => {
  const menu = document.querySelector('#nav [data-aba="contextos"]'); if (menu) menu.hidden = true;
  let corpoCtx = null;
  async function abrirContextos() {
    const caixa = corpoCtx?.isConnected ? corpoCtx : null; const alvo = h('div', { class: 'ds-contextos' }, DS.carregando());
    if (caixa) caixa.replaceChildren(alvo); else { corpoCtx = DS.modal('Contextos do projeto', alvo, { tamanho: 'lg', subtitulo: [h('span', {}, tr('Requisitos, regras e decisões que os agentes podem ler quando aprovados e disponibilizados ao MCP.'))] }); }
    const el = h('div', {}); try { await abas.contextos(el); } catch { el.replaceChildren(DS.estadoTela('erro', 'Não foi possível carregar esta seção.')); }
    el.querySelector('h1')?.remove(); alvo.replaceChildren(...el.childNodes);
  }
  const base = mostrar;
  mostrar = async function (aba) { if (aba === 'contextos') { if (estado.aba !== 'agentes') await base('agentes'); return abrirContextos(); } return base(aba); };
  const agentes = abas.agentes;
  abas.agentes = async (el) => {
    await agentes(el);
    const novo = el.querySelector('#v36-agent-new');
    const contagem = h('span', { class: 'ds-n' });
    const b = h('button', { type: 'button', class: 'acao', id: 'agentes-contextos', title: tr('Requisitos, regras e decisões do projeto que os agentes podem ler'), onclick: () => mostrar('contextos') }, DS.icone('livro'), tr('Contextos'), contagem);
    // Projeto Prumo: ao lado de "Nova prévia". Pasta vinculada (visão legada de clientes MCP): no topo da tela.
    if (novo) novo.before(b); else el.prepend(h('div', { class: 'ds-barra ds-barra-solta' }, b));
    // A contagem chega depois, sem atrasar a renderização da tela.
    if (estado.root) api.contextosListar(estado.root, {}).then((n) => { const l = n?.ok ? n.data.contextos : []; if (l.length) contagem.textContent = tr('{a} de {t} aprovados', { a: l.filter((c) => c.estado === 'APROVADO').length, t: l.length }); }).catch(() => {});
  };
})();
