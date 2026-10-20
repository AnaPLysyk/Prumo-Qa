/** Testes: editor de arquivos, caminhos do projeto e pipelines CI/CD da IDE. */
  function abrirNoCodigo(e, arquivo, linha) { DS.fecharModal(); const mem = memoriaDaTela('testes', e.id); mem.ide = { arquivo, linha }; (estado.sub ||= {}).testes = 'codigo'; void mostrar('testes'); }
  function arvore(arquivos) { const raiz = { pastas: new Map(), arquivos: [] }; for (const a of arquivos) { const partes = a.arquivo.split('/'); let n = raiz; for (const p of partes.slice(0, -1)) { if (!n.pastas.has(p)) n.pastas.set(p, { pastas: new Map(), arquivos: [] }); n = n.pastas.get(p); } n.arquivos.push(a); } return raiz; }
  // Trazer (clonar) ou atualizar o repositório do GitHub vinculado: usa o git deste computador e a confirmação nativa; ao terminar, a IDE passa a editar a pasta.
  async function trazerDoGithub(e, atualizar) {
    const r = await chamar(() => api.espacoTrazer(e.id)); if (!r || r.canceled) return;
    avisar(atualizar ? tr('Repositório atualizado do GitHub.') : r.vinculada === false ? tr('Repositório trazido, mas a pasta ainda não foi vinculada ao projeto.') : tr('Repositório trazido do GitHub e vinculado ao projeto.'));
    void mostrar('testes');
  }
  const pastaDoPrumo = (e) => !!e.pastaLocal && /[\\/]repositorios[\\/]/.test(e.pastaLocal);

  // Editor de arquivo (CodeMirror embutido, sem rede) usado pela IDE e pelos pipelines. Salvar pede a confirmação nativa do Windows e
  // só grava se o arquivo não mudou fora do Prumo; o fim de linha original é preservado pelo backend.
  function abrirEditor({ e, editor, arquivo, dados, aoDescartar, aoSalvar }) {
    const modo = /\.tsx?$/i.test(arquivo) ? { name: 'javascript', typescript: true } : /\.[cm]?jsx?$/i.test(arquivo) ? 'javascript' : /\.py$/i.test(arquivo) ? 'python' : /\.feature$/i.test(arquivo) ? 'gherkin' : /\.ya?ml$/i.test(arquivo) ? 'yaml' : null;
    const host = h('div', { class: 'ds-ide-cm' }); const estadoEl = h('span', { class: 'ds-sub', id: 'ide-estado', role: 'status' }, tr('Editando'));
    let hashAtual = dados.hash; let sujo = false; let armado = false;
    const salvarBtn = DS.acao('Salvar', () => salvar(), { id: 'ide-salvar', primaria: true, compacto: true, titulo: 'Ctrl+S' });
    const descartarBtn = DS.acao('Descartar', () => { if (sujo && !armado) { armado = true; descartarBtn.lastChild.textContent = tr('Descartar alterações?'); return; } aoDescartar(); }, { id: 'ide-descartar', compacto: true });
    editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), estadoEl, salvarBtn, descartarBtn), host);
    const cm = window.CodeMirror(host, { value: String(dados.conteudo).replace(/\r\n/g, '\n'), mode: modo, lineNumbers: true, indentUnit: 2, tabSize: 2, indentWithTabs: false, theme: 'prumo', viewportMargin: 40,
      extraKeys: { 'Ctrl-S': () => salvar(), 'Cmd-S': () => salvar(), Tab: (c) => c.execCommand(c.somethingSelected() ? 'indentMore' : 'insertSoftTab'), 'Shift-Tab': (c) => c.execCommand('indentLess') } });
    cm.setSize('100%', '100%'); cm.on('change', () => { sujo = true; armado = false; descartarBtn.lastChild.textContent = tr('Descartar'); estadoEl.textContent = tr('Alterações não salvas'); });
    requestAnimationFrame(() => { cm.refresh(); cm.focus(); });
    async function salvar() {
      if (!sujo) { estadoEl.textContent = tr('Nada a salvar'); return; }
      const r = await chamar(() => api.testesGravar(e.id, arquivo, cm.getValue(), hashAtual)); if (!r || r.canceled) return;
      hashAtual = r.hash; sujo = false; estadoEl.textContent = tr('Salvo · {n} linhas', { n: r.linhas }); avisar(tr('Arquivo salvo.')); if (aoSalvar) await aoSalvar(r);
    }
  }

  // Pipelines CI/CD: os workflows do GitHub Actions do MESMO repositório vinculado ao projeto (pasta local), para ler e editar.
  // Salvar altera só o arquivo local; o pipeline passa a valer no GitHub depois que a pessoa enviar o repositório.
  const MODELO_PIPELINE = (nome) => `name: ${nome}\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  testes:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n`;
  async function telaPipelines(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal) {
      corpo.append(DS.estadoTela('vazio', 'Vincule a pasta do repositório', 'Os pipelines (.github/workflows) são lidos e editados na pasta do repositório vinculada ao projeto. Vincule a pasta em Projetos.', [...(vg ? [DS.acao('Trazer o repositório do GitHub', () => trazerDoGithub(e, false), { id: 'ide-trazer', primaria: true })] : []), DS.acao('Abrir Projetos', () => mostrar('projetos'))], { id: 'pipe-sem-pasta', compacto: true }));
      if (vg || e.vinculos.length) { const legado = h('div', { id: 'pipe-github' }); corpo.append(legado); await montarAutomacoes(legado); semTitulo(legado); }
      return;
    }
    const dados = await chamar(() => api.testesPipelines(e.id)); if (!dados) return;
    const caixa = h('div', { class: 'ds-ide', id: 'ide-pipelines' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Pipelines do repositório') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(caixa);
    arvoreEl.append(h('div', { class: 'ds-ide-barra' }, DS.acao('Novo pipeline', () => novoPipeline(), { id: 'pipe-novo', compacto: true, icone: 'mais' }), vg ? DS.acao('Execuções no GitHub', () => { const alvo = h('div', { id: 'pipe-github' }); DS.modal('Execuções no GitHub Actions', alvo, { tamanho: 'lg' }); montarAutomacoes(alvo).then(() => semTitulo(alvo)); }, { id: 'pipe-github-abrir', compacto: true }) : null),
      h('p', { class: 'ds-doc-grupo' }, tr('{n} pipeline(s)', { n: dados.pipelines.length })));
    for (const p of dados.pipelines) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': p.arquivo, onclick: () => abrir(p.arquivo) }, DS.icone('codigo'), h('span', {}, p.nome), h('span', { class: 'ds-sub' }, p.arquivo.replace('.github/workflows/', ''))));
    if (!dados.pipelines.length) { editor.append(DS.estadoTela('vazio', 'Nenhum pipeline neste repositório', 'Não há arquivos em .github/workflows. Use "Novo pipeline" para criar o primeiro.', [], { id: 'pipe-vazio' })); painel.append(h('p', { class: 'suave' }, tr('Um pipeline só roda no GitHub depois que você enviar o repositório.'))); return; }
    async function abrir(arquivo) {
      const abrirEditando = mem.pipe?.arquivo === arquivo && mem.pipe.editar === true; mem.pipe = { arquivo }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const p = dados.pipelines.find((x) => x.arquivo === arquivo); const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => linhasEl.append(h('li', { 'data-linha': i + 1 }, h('code', {}, txt || ' '))));
      const editavel = r.data.editavel === true;
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · somente leitura', { n: r.data.linhas })),
        editavel ? DS.acao('Editar', () => abrirEditor({ e, editor, arquivo, dados: r.data, aoDescartar: () => abrir(arquivo), aoSalvar: async () => { const d = await chamar(() => api.testesPipelines(e.id)); if (d) { dados.pipelines = d.pipelines; resumo(arquivo); } } }), { id: 'ide-editar', compacto: true })
          : h('span', { class: 'ds-chip', 'data-tom': 'aviso', id: 'ide-bloqueado', title: tr('O arquivo contém o que parece um segredo; o Prumo não o exibe para edição. Edite em outro editor.') }, tr('Edição bloqueada'))), linhasEl);
      resumo(arquivo); if (abrirEditando && editavel) editor.querySelector('#ide-editar')?.click();
    }
    function resumo(arquivo) {
      const p = dados.pipelines.find((x) => x.arquivo === arquivo); if (!p) return;
      painel.replaceChildren(h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr('Pipeline')), h('p', { class: 'ds-texto' }, h('strong', {}, p.nome)), h('p', { class: 'ds-sub' }, p.arquivo)),
        DS.bloco('Quando roda', p.eventos.length ? h('div', { class: 'ds-chips' }, p.eventos.map((x) => DS.chip(x))) : h('p', { class: 'suave' }, tr('Eventos não identificados no arquivo.'))),
        DS.bloco('Jobs', p.jobs.length ? h('ol', { class: 'ds-lista' }, p.jobs.map((j) => h('li', {}, j))) : h('p', { class: 'suave' }, tr('Nenhum job identificado.'))),
        DS.info('Salvar altera só o arquivo deste computador. O pipeline passa a valer no GitHub depois que você enviar o repositório.'));
    }
    function novoPipeline() {
      const nome = h('input', { id: 'pipe-novo-nome', maxlength: 60, placeholder: 'ci.yml' }); const titulo = h('input', { id: 'pipe-novo-titulo', maxlength: 80, value: 'CI' });
      DS.modal('Novo pipeline', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Nome do arquivo em .github/workflows', nome, { inteiro: true, ajuda: 'Termina em .yml ou .yaml, sem subpastas.' }), DS.campo('Nome do pipeline', titulo, { inteiro: true })),
        DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar…', async () => {
          const n = nome.value.trim(); if (!n) { avisar(tr('Informe o nome do arquivo.'), true); return; }
          const arquivo = '.github/workflows/' + n; const r = await chamar(() => api.testesGravar(e.id, arquivo, MODELO_PIPELINE(titulo.value.trim() || 'CI'), null)); if (!r || r.canceled) return;
          DS.fecharModal(); mem.pipe = { arquivo: r.arquivo, editar: true }; void mostrar('testes');
        }, { id: 'pipe-novo-criar', primaria: true }))], { tamanho: 'md' });
      nome.focus();
    }
    const alvo = mem.pipe?.arquivo && dados.pipelines.some((x) => x.arquivo === mem.pipe.arquivo) ? mem.pipe.arquivo : dados.pipelines[0].arquivo; await abrir(alvo);
  }

