/** Mostra as runs e seus resultados. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function telaRuns(e, mem, corpo, esc) {
    const vq = vinc(e, 'qase'); if (!vq) { corpo.append(DS.estadoTela('vazio', 'Qase não vinculado', 'Vincule o Qase em Conexões para preparar e acompanhar runs.', [DS.acao('Abrir Conexões', () => mostrar('conexoes'))], { id: 'runs-vazio' })); return; }
    const area = h('div', { id: 'runs-area' }, DS.esqueleto(5)); const fonte = h('div');
    corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.runsQase; await carregar(); }, { id: 'runs-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5));
      const [locais, remotas] = await Promise.all([api.runs(e.id), mem.runsQase || carregarQase(e, mem, 'runs', { limite: 50 })]); mem.runsQase = remotas;
      const rl = locais.ok ? locais.data : []; const ligadas = new Set(rl.map((r) => String(r.runIdRemoto)).filter((x) => x !== 'null' && x !== 'undefined'));
      fonte.replaceChildren(h('div', { class: 'ds-fontes' }, h('span', { role: 'status' }, DS.origem('prumo', 'Prumo'), tr('{n} run(s) preparada(s) neste computador', { n: rl.length })), remotas.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(remotas.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} run(s) · consultado {q}', { n: remotas.itens.length, q: quando(remotas.em) }))));
      const linhas = [...rl.map((r) => { const c = contar(r); return { attrs: { 'data-run': r.id }, abrir: () => abrirRunLocal(e, r.id, esc), rotuloAcessivel: tr('Abrir run {t}', { t: r.titulo }), celulas: [h('div', {}, h('strong', {}, r.titulo), h('span', { class: 'ds-sub' }, r.runIdRemoto ? tr('Qase #{id}{c}', { id: r.runIdRemoto, c: r.confirmadaNoQase ? ' · ' + tr('confirmada') : '' }) : tr('ainda não criada no Qase'))), DS.origem('prumo', 'Prumo'), r.ambiente, String(c.total), barraResultado(c), selo(r.estado)] }; }),
        ...remotas.itens.filter((x) => !ligadas.has(String(x.id))).map((x) => ({ attrs: { 'data-run-qase': String(x.id) }, abrir: () => abrirRunQase(e, x), rotuloAcessivel: tr('Abrir run do Qase {id}', { id: x.id }), celulas: [h('div', {}, h('strong', {}, x.title || tr('Run {id}', { id: x.id })), h('span', { class: 'ds-sub' }, tr('Qase #{id}', { id: x.id, c: '' }))), DS.origem('qase', 'Qase'), x.environment?.title || '—', x.cases_count != null ? String(x.cases_count) : '—', x.stats ? barraResultado({ total: x.stats.total || 0, pass: x.stats.passed || 0, fail: x.stats.failed || 0, blocked: x.stats.blocked || 0, notRun: x.stats.untested || 0 }) : '—', x.status != null ? estadoRunQase(x) : '—'] }))];
      area.replaceChildren(linhas.length ? DS.tabela({ id: 'runs-tabela', colunas: ['Run', 'Origem', { t: 'Ambiente', classe: 'ds-opcional' }, { t: 'Casos', classe: 'ds-opcional' }, 'Resultados', 'Estado'], linhas }) : DS.estadoTela('vazio', 'Nenhuma run preparada', 'Use "Preparar run" para escolher os casos e o ambiente.', [], { id: 'runs-vazio' }));
    }
    await carregar();
  }
