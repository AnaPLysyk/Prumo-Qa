/** Mostra os planos do Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function telaPlanos(e, mem, corpo) {
    const area = h('div', { id: 'planos-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.planos; await carregar(); }, { id: 'planos-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const p = (mem.planos = mem.planos || await carregarQase(e, mem, 'planos')); fonte.replaceChildren(fonteQase(p, 'plano(s)'));
      if (p.erro && !p.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os planos', p.erro)); return; }
      if (!p.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhum plano retornado pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'planos-tabela', colunas: ['ID', 'Plano', 'Casos', 'Atualizado'], linhas: p.itens.map((x) => ({ attrs: { 'data-plano': String(x.id) }, abrir: () => abrirPlano(e, x), rotuloAcessivel: tr('Abrir plano {id}', { id: x.id }), celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', quando(x.updated_at || x.updated)] })) }));
    }
    await carregar();
  }
