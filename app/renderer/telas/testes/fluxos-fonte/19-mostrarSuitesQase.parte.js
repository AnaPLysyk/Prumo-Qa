/** Mostra as suites do Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function telaSuites(e, mem, corpo) {
    const area = h('div', { id: 'suites-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.suites; await carregar(); }, { id: 'suites-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const s = (mem.suites = mem.suites || await carregarQase(e, mem, 'suites')); fonte.replaceChildren(fonteQase(s, 'suite(s)'));
      if (s.erro && !s.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar as suites', s.erro)); return; }
      if (!s.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma suite retornada pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'suites-tabela', colunas: ['ID', 'Suite', 'Casos', 'Suite pai'], rotuloAbrir: 'Ver casos', linhas: s.itens.map((x) => ({ attrs: { 'data-suite': String(x.id) }, abrir: () => { (mem.fCasos ||= {}).suite = String(x.id); (estado.sub ||= {}).testes = 'casos'; mostrar('testes'); }, celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', x.parent_id != null ? String(x.parent_id) : '—'] })) }));
    }
    await carregar();
  }
