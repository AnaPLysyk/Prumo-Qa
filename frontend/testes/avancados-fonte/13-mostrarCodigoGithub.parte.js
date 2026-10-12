/** Apresenta referências de código vindas do GitHub. Parte de testes-v40.js; nao carregar isoladamente. */
  async function codigoGithub(e, vg, corpo) {
    const caixa = h('div', { class: 'ds-ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos do repositório') }); const editor = h('section', { class: 'ds-ide-editor' });
    corpo.append(agentesNoCodigo(e), DS.alerta(tr('Repositório {r} lido pelo GitHub vinculado. Para classificar testes e ler anotações Qase, vincule também a pasta local do repositório.', { r: vg.recurso.chave }), null, 'escudo'), caixa); caixa.append(arvoreEl, editor);
    async function listar(caminho, destino) {
      destino.replaceChildren(DS.carregando()); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho || '');
      if (!r.ok) { destino.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', r.error, [], { compacto: true })); return; }
      const itens = Array.isArray(r.data.dados) ? r.data.dados : []; destino.replaceChildren(...itens.sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo === 'dir' ? -1 : 1)).map((x) => {
        if (x.tipo === 'dir') { const det = h('details', { class: 'ds-ide-pasta' }, h('summary', {}, DS.icone('pasta'), h('span', {}, x.nome))); const filhos = h('div'); det.append(filhos); det.addEventListener('toggle', () => { if (det.open && !filhos.childNodes.length) listar(x.caminho, filhos); }); return det; }
        return h('button', { type: 'button', class: 'ds-ide-arquivo', onclick: () => abrir(x.caminho) }, DS.icone('codigo'), h('span', {}, x.nome));
      }));
    }
    async function abrir(caminho) {
      editor.replaceChildren(DS.carregando('Lendo arquivo…')); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho);
      if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const d = r.data.dados; editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, d.caminho), h('span', { class: 'ds-sub' }, tr('GitHub · somente leitura'))), d.conteudo === null ? DS.estadoTela('vazio', d.conteudoOmitido || 'Conteúdo indisponível') : h('ol', { class: 'ds-ide-linhas' }, d.conteudo.split(/\r?\n/).map((txt, i) => h('li', { 'data-linha': i + 1 }, h('code', {}, txt || ' ')))));
    }
    editor.append(DS.estadoTela('vazio', 'Selecione um arquivo', null, [], { compacto: true })); await listar('', arvoreEl);
  }
  /** Quem pode agir neste código: políticas reais do projeto (o agente lê pelo MCP; escrever no repositório é só da pessoa). */
