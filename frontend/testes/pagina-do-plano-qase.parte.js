/** Planos do Qase no desenho do Qase: lista em tabela com busca, ordenação e páginas, e a página do plano com casos e runs. */
  /** "há 21 segundos", "ontem"… no idioma da janela. */
  function quandoRelativo(valor) {
    const t = Date.parse(valor); if (!Number.isFinite(t)) return '—';
    const seg = Math.round((t - Date.now()) / 1000); const abs = Math.abs(seg); const rtf = new Intl.RelativeTimeFormat(document.documentElement.lang || 'pt-BR', { numeric: 'auto' });
    return abs < 60 ? rtf.format(seg, 'second') : abs < 3600 ? rtf.format(Math.round(seg / 60), 'minute') : abs < 86400 ? rtf.format(Math.round(seg / 3600), 'hour') : rtf.format(Math.round(seg / 86400), 'day');
  }
  /** "há 3 dias" com a data completa no tooltip e em datetime. */
  const tempoRelativo = (valor) => (valor && Number.isFinite(Date.parse(valor)) ? h('time', { datetime: new Date(valor).toISOString(), title: hora(valor) }, quandoRelativo(valor)) : h('span', { class: 'suave' }, '—'));
  const dataDoPlano = (x, campo) => x[campo] || x[campo + '_at'] || null;
  /** Enter abre; setas sobem e descem entre as linhas da tabela; Esc fecha o menu ⋯ aberto e devolve o foco a ele. */
  function navegarEntreLinhas(ev, abrir) {
    if (ev.key === 'Escape') { const m = ev.target.closest('details[open]') || ev.currentTarget.querySelector('details[open]'); if (m) { m.open = false; m.querySelector('summary')?.focus(); ev.stopPropagation(); } return; }
    if (ev.target !== ev.currentTarget) return;
    if ((ev.key === 'Enter' || ev.key === ' ') && abrir) { ev.preventDefault(); void abrir(); }
    else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { const alvo = ev.key === 'ArrowDown' ? ev.currentTarget.nextElementSibling : ev.currentTarget.previousElementSibling; if (alvo) { ev.preventDefault(); alvo.focus(); } }
  }
  const copiarTexto =(texto) => { void navigator.clipboard?.writeText(String(texto)).then(() => avisar(tr('Copiado.')), () => avisar(tr('Não foi possível copiar.'), true)); };

  async function telaPlanos(e, mem, corpo) {
    const esc = !!(await escritaDoProjeto(e)).qase; const f = mem.estadoPlanos || (mem.estadoPlanos = { q: '', ordem: 'criado', desc: true, pagina: 1, porPagina: 25 });
    const destino = { corpo, voltar: async () => { const id = corpo.querySelector('#qs-plano')?.dataset.plano; corpo.replaceChildren(); await telaPlanos(e, mem, corpo); (corpo.querySelector('.qs-linha-plano[data-plano="' + id + '"]') || corpo.querySelector('#planos-busca'))?.focus(); } };
    const contagem = h('span', { class: 'qs-contagem suave', id: 'planos-contagem', 'aria-live': 'polite' }); const area = h('div', { id: 'planos-area' }, DS.esqueleto(5)); const fonte = h('div');
    const busca = h('input', { type: 'search', class: 'qs-busca', id: 'planos-busca', placeholder: tr('Buscar planos'), autocomplete: 'off', 'aria-label': tr('Buscar planos'), value: f.q, oninput: (ev) => { f.q = ev.target.value; f.pagina = 1; desenhar(); } });
    corpo.append(h('div', { class: 'qs-barra-filtros' }, DS.acao('Criar plano', () => novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' }), busca, h('span', { class: 'qs-espaco' }), contagem, DS.acao('Atualizar', async () => { delete mem.planos; await carregar(); }, { id: 'planos-atualizar', compacto: true, icone: 'atualizar' })), fonte, area);
    let dados = null;
    const valores = { titulo: (x) => String(x.title || '').toLowerCase(), criado: (x) => Date.parse(dataDoPlano(x, 'created')) || 0, atualizado: (x) => Date.parse(dataDoPlano(x, 'updated')) || 0, duracao: (x) => Number(x.average_time || 0), casos: (x) => Number(x.cases_count ?? 0) };
    function desenhar(foco) {
      if (!dados) return; const q = f.q.trim().toLowerCase(); const v = valores[f.ordem] || valores.criado;
      const itens = dados.itens.filter((x) => !q || String(x.title || '').toLowerCase().includes(q) || String(x.id).includes(q)).sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * (f.desc ? -1 : 1));
      const paginas = Math.max(1, Math.ceil(itens.length / f.porPagina)); f.pagina = Math.min(f.pagina, paginas); const pagina = itens.slice((f.pagina - 1) * f.porPagina, f.pagina * f.porPagina);
      const cabeca = (k, t, extra) => h('th', { 'aria-sort': f.ordem === k ? (f.desc ? 'descending' : 'ascending') : 'none', scope: 'col', class: extra || null }, h('button', { type: 'button', class: 'qs-ordenar', 'data-ordem': k, onclick: () => { f.desc = f.ordem === k ? !f.desc : k === 'titulo' ? false : true; f.ordem = k; desenhar('[data-ordem="' + k + '"]'); } }, tr(t), h('span', { class: 'qs-seta-ordem', 'aria-hidden': 'true' }, f.ordem === k ? (f.desc ? '↓' : '↑') : '↕')));
      const linhas = pagina.map((x) => { const abrir = () => abrirPlano(e, x, destino);
        return h('tr', { class: 'qs-linha-plano', tabindex: 0, 'data-plano': String(x.id), 'aria-label': tr('Abrir plano {id}', { id: x.id }), onclick: (ev) => { if (!ev.target.closest('details, button')) void abrir(); }, onkeydown: (ev) => { navegarEntreLinhas(ev, abrir); } },
          h('td', {}, h('div', { class: 'qs-titulo-celula' }, h('strong', { title: x.title || '' }, x.title || '—'), h('span', { class: 'qs-id' }, '#' + x.id))), h('td', {}, tempoRelativo(dataDoPlano(x, 'created'))), h('td', {}, tempoRelativo(dataDoPlano(x, 'updated'))),
          h('td', {}, h('span', { class: 'qs-duracao' }, DS.icone('relogio'), duracaoDaExecucao(Number(x.average_time || 0)))), h('td', { class: 'qs-num' }, String(x.cases_count ?? 0)),
          h('td', { class: 'qs-celula-menu' }, menuDe('Ações do plano', [['Abrir', abrir], ['Iniciar run', () => prepararRunDoPlano(e, x)], ['Copiar ID', () => copiarTexto(x.id)]])));
      });
      const de = itens.length ? (f.pagina - 1) * f.porPagina + 1 : 0; const ate = Math.min(itens.length, f.pagina * f.porPagina);
      contagem.textContent = tr('{n} plano(s)', { n: itens.length });
      area.replaceChildren(!itens.length ? (dados.itens.length ? DS.estadoTela('vazio', 'Nenhum plano combina com a busca.', '', [DS.acao('Limpar busca', () => { f.q = ''; busca.value = ''; desenhar(); busca.focus(); }, { id: 'planos-limpar-busca', compacto: true })], { compacto: true }) : DS.estadoTela('vazio', 'Nenhum plano retornado pelo Qase', 'Crie um plano para reunir casos e iniciar runs a partir dele.', [], { compacto: true }))
        : h('table', { class: 'qs-tabela qs-planos', id: 'planos-tabela' }, h('thead', {}, h('tr', {}, cabeca('titulo', 'Título'), cabeca('criado', 'Criado'), cabeca('atualizado', 'Atualizado'), cabeca('duracao', 'Tempo de execução'), cabeca('casos', 'Casos', 'qs-num'), h('th', { 'aria-label': tr('Ações') }))), h('tbody', {}, linhas)),
        itens.length ? h('div', { class: 'qs-paginacao' }, h('label', {}, tr('Linhas por página'), ' ', h('select', { 'aria-label': tr('Linhas por página'), onchange: (ev) => { f.porPagina = Number(ev.target.value); f.pagina = 1; desenhar('.qs-paginacao select'); } }, [10, 25, 50, 100].map((n) => h('option', { value: n, selected: n === f.porPagina }, String(n))))),
          h('span', { class: 'qs-espaco' }), h('span', { class: 'qs-pagina' }, tr('{a}–{b} de {c}', { a: de, b: ate, c: itens.length })),
          h('button', { type: 'button', 'data-pagina': 'anterior', 'aria-label': tr('Página anterior'), disabled: f.pagina <= 1, onclick: () => { f.pagina--; desenhar('[data-pagina="anterior"]'); } }, '‹'), h('span', { class: 'qs-pagina' }, `${f.pagina} / ${paginas}`), h('button', { type: 'button', 'data-pagina': 'proxima', 'aria-label': tr('Próxima página'), disabled: f.pagina >= paginas, onclick: () => { f.pagina++; desenhar('[data-pagina="proxima"]'); } }, '›')) : null);
      if (foco) { const alvo = area.querySelector(foco); (alvo?.disabled ? area.querySelector('.qs-paginacao button:not(:disabled)') : alvo)?.focus(); }
    }
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const p = (mem.planos = mem.planos || await carregarQase(e, mem, 'planos')); dados = p;
      fonte.replaceChildren(p.erro && p.itens.length ? DS.alerta('Consulta parcial do Qase: alguns planos podem não aparecer. Atualize para tentar novamente.', 'falha') : null);
      if (p.erro && !p.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os planos', p.erro)); return; }
      desenhar();
    }
    await carregar();
  }
  const prepararRunDoPlano = async (e, x) => {
    const r = await api.servicoConsultar(e.id, 'qase', 'plano', {}, String(x.id));
    if (!r.ok) { avisar(tr('Não foi possível abrir o plano') + ': ' + r.error, true); return; }
    const casos = Array.isArray(r.data.dados?.cases) ? r.data.dados.cases.map((c) => Number(c?.case_id ?? c?.id ?? c)).filter((id) => Number.isInteger(id) && id > 0) : [];
    if (!casos.length) { avisar(tr('Este plano não tem casos para iniciar uma run.'), true); return; }
    void prepararRun(e, { planoId: Number(x.id), casos, titulo: x.title });
  };

  /** Página do plano: casos do plano e runs criadas a partir dele; "Iniciar run" já leva os casos e o plano. */
  async function abrirPlano(e, x, destino, abaInicial = 'casos') {
    const { corpo } = destino; const voltar = () => destino.voltar(); corpo.replaceChildren(DS.carregando('Consultando o Qase…')); const mem = memoriaDaTela('testes', e.id); const vq = vinc(e, 'qase');
    const [r, casosQase, suites, runs] = await Promise.all([api.servicoConsultar(e.id, 'qase', 'plano', {}, String(x.id)), mem.casos || carregarQase(e, mem, 'casos'), mem.suitesQase || carregarQase(e, mem, 'suites'), mem.runsQase || carregarQase(e, mem, 'runs', { limite: 50 })]); if (!corpo.isConnected) return;
    if (!r.ok) { corpo.replaceChildren(DS.estadoTela('erro', 'Não foi possível abrir o plano', r.error, [DS.acao('Voltar', () => voltar())])); return; }
    if (casosQase && !casosQase.erro) mem.casos = casosQase; if (suites && !suites.erro) mem.suitesQase = suites; if (runs && !runs.erro) mem.runsQase = runs;
    const d = r.data.dados || {}; const casos = Array.isArray(d.cases) ? d.cases : []; const catalogo = new Map((casosQase?.itens || []).map((c) => [String(c.id), c])); const nomesDeSuite = new Map((suites?.itens || []).map((s) => [Number(s.id), s.title]));
    const idDoCaso = (c) => Number(c?.case_id ?? c?.id ?? c); const doPlano = (runs?.itens || []).filter((z) => String(z.plan_id) === String(x.id)); let aba = abaInicial;
    const abas = h('div', { class: 'qs-abas', role: 'tablist', 'aria-label': tr('Seções do plano') }); const conteudo = h('div', { class: 'qs-conteudo', id: 'plano-painel', role: 'tabpanel', 'aria-labelledby': 'plano-aba-casos' });
    const vazio = (texto) => DS.estadoTela('vazio', texto, '', [], { compacto: true });
    const tabelaDeCasos = () => (casos.length ? h('table', { class: 'qs-tabela qs-plano-casos', id: 'plano-casos-lista' }, h('thead', {}, h('tr', {}, h('th', {}, 'ID'), h('th', {}, tr('Título')), h('th', {}, tr('Suíte')))),
      h('tbody', {}, casos.map((c) => { const id = idDoCaso(c); const suite = catalogo.get(String(id))?.suite_id; const abrir = () => abrirCaso(e, id); return h('tr', { class: 'qs-linha-plano', tabindex: 0, 'data-caso-qase': String(id), onclick: () => void abrir(), onkeydown: (ev) => navegarEntreLinhas(ev, abrir) },
        h('td', {}, h('span', { class: 'qs-id' }, vq.recurso.chave + '-' + id)), h('td', {}, h('strong', { class: 'qs-corta', title: nomeDeCaso(catalogo, id) }, nomeDeCaso(catalogo, id))), h('td', { class: 'suave' }, suite != null ? (nomesDeSuite.get(Number(suite)) || '#' + suite) : tr('Casos sem suíte'))); }))) : vazio(tr('O Qase não retornou casos para este plano.')));
    const tabelaDeRuns = () => {
      if (runs?.erro && !doPlano.length) return DS.estadoTela('erro', tr('Não foi possível consultar as runs do plano'), runs.erro, [DS.acao('Tentar novamente', () => { delete mem.runsQase; return abrirPlano(e, x, destino, 'runs'); }, { icone: 'atualizar' })], { compacto: true });
      if (!doPlano.length) return vazio(tr('Nenhuma run criada a partir deste plano.'));
      const tabela = h('table', { class: 'qs-tabela qs-plano-runs', id: 'plano-runs-lista' },
        h('thead', {}, h('tr', {}, h('th', {}, tr('Título')), h('th', {}, tr('Estado')), h('th', { class: 'qs-num' }, tr('Resultados')), h('th', {}, tr('Criada')))),
        h('tbody', {}, doPlano.map((z) => {
          const abrir = () => abrirRunQase(e, z, { corpo, voltar: async () => { await abrirPlano(e, x, destino, 'runs'); corpo.querySelector('[data-run-qase="' + z.id + '"]')?.focus(); } });
          return h('tr', { class: 'qs-linha-plano', tabindex: 0, 'data-run-qase': String(z.id), onclick: () => void abrir(), onkeydown: (ev) => navegarEntreLinhas(ev, abrir) },
            h('td', {}, h('div', { class: 'qs-titulo-celula' }, h('strong', { title: z.title || '' }, z.title || tr('Run {id}', { id: z.id })), h('span', { class: 'qs-id' }, '#' + z.id))),
            h('td', {}, z.status != null ? estadoRunQase(z) : '—'),
            h('td', { class: 'qs-num' }, z.stats ? resultadoDaRun(barraResultado({ total: z.stats.total || 0, pass: z.stats.passed || 0, fail: z.stats.failed || 0, blocked: z.stats.blocked || 0, notRun: z.stats.untested || 0 }, { compacta: true }), null) : '—'),
            h('td', {}, tempoRelativo(dataDoPlano(z, 'start_time') || dataDoPlano(z, 'created'))));
        })));
      return h('div', {}, runs?.erro ? DS.alerta(tr('Consulta parcial do Qase: algumas runs podem não aparecer.'), 'falha') : null, tabela);
    };
    const desenhar = (foco = false) => { abas.replaceChildren(...[['casos', 'Casos', casos.length || d.cases_count || 0], ['runs', 'Runs', doPlano.length]].map(([k, t, n]) => h('button', { type: 'button', role: 'tab', id: 'plano-aba-' + k, 'data-aba': k, 'aria-controls': 'plano-painel', tabindex: aba === k ? 0 : -1, 'aria-selected': String(aba === k), onclick: () => { aba = k; desenhar(true); }, onkeydown: (ev) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)) { ev.preventDefault(); aba = ev.key === 'Home' ? 'casos' : ev.key === 'End' ? 'runs' : aba === 'casos' ? 'runs' : 'casos'; desenhar(true); } } }, tr(t), h('span', { class: 'ds-n' }, String(n))))); conteudo.setAttribute('aria-labelledby', 'plano-aba-' + aba); conteudo.replaceChildren(aba === 'casos' ? tabelaDeCasos() : tabelaDeRuns()); if (foco) abas.querySelector('[aria-selected="true"]')?.focus(); };
    desenhar();
    const curta = !d.description || String(d.description).length <= 200;
    corpo.replaceChildren(h('div', { class: 'qs-pagina-simples', id: 'qs-plano', 'data-plano': String(x.id) }, h('div', { class: 'qs-cab' }, h('button', { type: 'button', class: 'qs-voltar', 'aria-label': tr('Voltar'), title: tr('Voltar'), onclick: () => voltar() }, '←'), h('h2', { class: 'qs-titulo' }, d.title || x.title || tr('Plano {id}', { id: x.id })), DS.chip('#' + x.id),
      h('div', { class: 'qs-acoes qs-plano-acoes' }, DS.acao('Iniciar run', () => { void prepararRun(e, { planoId: Number(x.id), casos: casos.map(idDoCaso), titulo: d.title || x.title }); }, { id: 'plano-iniciar-run', primaria: true, icone: 'play', desabilitado: !casos.length, titulo: casos.length ? null : tr('Este plano não tem casos para iniciar uma run.') }), menuDe('Mais ações', [['Copiar ID', () => copiarTexto(x.id)]]))),
      d.description ? h('details', { class: 'qs-descricao', open: curta }, h('summary', {}, tr('Descrição')), h('p', { class: 'ds-texto' }, d.description)) : null,
      casosQase?.erro ? DS.alerta(tr('Casos do Qase indisponíveis: {e}', { e: textoErro(casosQase.erro) }), 'falha') : null,
      suites?.erro ? DS.alerta(tr('Suítes do Qase indisponíveis: {e}', { e: textoErro(suites.erro) }), 'falha') : null,
      DS.meta([['Casos', String(casos.length || d.cases_count || 0)], ['Runs', String(doPlano.length)], ['Criado', quandoRelativo(dataDoPlano(d, 'created') || dataDoPlano(x, 'created'))], ['Atualizado', dataDoPlano(d, 'updated') ? quandoRelativo(dataDoPlano(d, 'updated')) : '—']], { linha: true }), abas, conteudo));
    corpo.querySelector('.qs-voltar')?.focus();
  }
