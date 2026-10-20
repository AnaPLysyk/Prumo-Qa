/** Testes: IDE de código, navegação por arquivos, GitHub e vínculo do caso ao código. */
  async function telaCodigo(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal && !vg) { corpo.append(DS.estadoTela('vazio', 'Nenhum repositório vinculado', 'Vincule a pasta local do repositório ou um repositório do GitHub em Projetos para ver o código de teste.', [DS.acao('Abrir Projetos', () => mostrar('projetos'))])); return; }
    if (!e.pastaLocal) return codigoGithub(e, vg, corpo);
    const src = await fontes(e); const cat = src.cat?.catalogo; if (!cat) { corpo.append(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat?.erro || '')); return; }
    const porArquivo = cat.features.map((f) => ({ arquivo: f.arquivo, feature: f.nome, testes: f.testes, tipos: f.tipos }));
    const casosPorId = new Map((src.casos?.itens || []).map((c) => [String(c.id), c]));
    const caixa = h('div', { class: 'ds-ide', id: 'ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos de teste') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(caixa, agentesNoCodigo(e));
    const pasta = (nome, n, nivel) => { const det = h('details', { class: 'ds-ide-pasta', open: nivel < 3 }, h('summary', {}, DS.icone('pasta'), h('span', {}, nome))); for (const [k, sub] of [...n.pastas.entries()].sort((a, b) => a[0].localeCompare(b[0]))) det.append(pasta(k, sub, nivel + 1)); for (const a of n.arquivos.sort((x, y) => x.arquivo.localeCompare(y.arquivo))) det.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, title: a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo.split('/').at(-1)), h('span', { class: 'ds-n' }, String(a.testes.length)))); return det; };
    const raiz = arvore(porArquivo); arvoreEl.append(h('p', { class: 'ds-doc-grupo' }, tr('{n} arquivo(s) · {t} teste(s)', { n: porArquivo.length, t: cat.testes })));
    for (const [k, sub] of [...raiz.pastas.entries()].sort((a, b) => a[0].localeCompare(b[0]))) arvoreEl.append(pasta(k, sub, 0)); for (const a of raiz.arquivos) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo)));
    arvoreEl.prepend(h('div', { class: 'ds-ide-barra' }, DS.acao('Novo arquivo', () => novoArquivo(), { id: 'ide-novo', compacto: true, icone: 'mais' }), vinc(e, 'github') && pastaDoPrumo(e) ? DS.acao('Atualizar do GitHub', () => trazerDoGithub(e, true), { id: 'ide-atualizar-github', compacto: true, titulo: 'Atualiza a cópia deste computador só por avanço; suas mudanças não são sobrescritas' }) : null));
    if (!porArquivo.length) { editor.append(DS.estadoTela('vazio', 'Nenhum arquivo de teste encontrado na pasta vinculada.', 'O Prumo reconhece *.spec/*.test (JS/TS), *.feature e test_*.py. Use "Novo arquivo" para criar a primeira automação.')); if (mem.ide?.novo) novoArquivo(mem.ide.novo); return; }
    painel.append(DS.estadoTela('vazio', 'Selecione um teste', 'As conexões do teste com casos, tickets, execuções e agentes aparecem aqui.', [], { compacto: true }));
    async function abrir(arquivo, linha) {
      const quererEditar = !!mem.ide?.editar && mem.ide.arquivo === arquivo; mem.ide = { arquivo, linha }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const info = porArquivo.find((x) => x.arquivo === arquivo); const porLinha = new Map((info?.testes || []).map((t) => [t.linha, t]));
      const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => { const t = porLinha.get(i + 1); const li = h('li', { 'data-linha': i + 1, class: t ? 'ds-ide-teste' : null }, h('code', {}, txt || ' '));
        if (t) li.prepend(h('button', { type: 'button', class: 'ds-ide-marca', 'aria-label': tr('Ver conexões do teste {t}', { t: t.titulo }), onclick: () => selecionar(t, li) }, chipNivel(t.tipo), ...(t.qase || []).map((q) => h('span', { class: 'ds-chip', 'data-tom': 'info' }, 'Qase ' + q)), ...t.tags.slice(0, 3).map(chipTag)));
        linhasEl.append(li); });
      const editavel = r.data.editavel === true; const bloqueado = r.data.editavel === false;
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · {t} teste(s) · somente leitura', { n: r.data.linhas, t: info?.testes.length || 0 })),
        editavel ? DS.acao('Editar', () => editarArquivo(arquivo, r.data), { id: 'ide-editar', compacto: true }) : null,
        bloqueado ? h('span', { class: 'ds-chip', 'data-tom': 'aviso', id: 'ide-bloqueado', title: tr('O arquivo contém o que parece um segredo; o Prumo não o exibe para edição. Edite em outro editor.') }, tr('Edição bloqueada')) : null), linhasEl);
      if (editavel && quererEditar) { editarArquivo(arquivo, r.data); return; }
      const alvo = linha && linhasEl.querySelector(`[data-linha="${linha}"]`); if (alvo) { alvo.scrollIntoView({ block: 'center' }); const t = porLinha.get(linha); if (t) selecionar(t, alvo); }
    }
    const editarArquivo = (arquivo, dados) => abrirEditor({ e, mem, editor, arquivo, dados, aoDescartar: () => abrir(arquivo, mem.ide?.linha), aoSalvar: async () => { await fontes(e, { forcar: true }); } });
    const modeloDeTeste = (caminho, casoId, titulo) => {
      const chave = vinc(e, 'qase')?.recurso?.chave; const ref = casoId && chave ? `${chave}-${casoId}` : null; const nome = titulo || 'descreva o cenário';
      if (/\.feature$/i.test(caminho)) return `${ref ? `# Qase: ${ref}\n` : ''}Feature: ${nome}\n\n  Scenario: ${nome}\n    Given o sistema está pronto\n    When a pessoa executa o passo\n    Then o resultado esperado aparece\n`;
      if (/\.py$/i.test(caminho)) return `${ref ? `# Qase: ${ref}\n` : ''}def test_${(nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'cenario')}():\n    # passos do cenário\n    assert True\n`;
      return `${ref ? `// Qase: ${ref}\n` : ''}test(${JSON.stringify(nome)}, async () => {\n  // passos do cenário\n});\n`;
    };
    function novoArquivo(inicio) {
      const caminho = h('input', { id: 'ide-novo-caminho', maxlength: 300, placeholder: 'tests/e2e/login.spec.ts', value: inicio ? `tests/${String(inicio.titulo || 'caso-' + inicio.casoId).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'novo'}.spec.ts` : '' });
      const caso = h('input', { id: 'ide-novo-caso', type: 'number', min: 1, placeholder: vinc(e, 'qase') ? '31' : '', value: inicio?.casoId || '', disabled: !vinc(e, 'qase') });
      const titulo = h('input', { id: 'ide-novo-titulo', maxlength: 200, value: inicio?.titulo || '' });
      if (mem.ide) delete mem.ide.novo;
      DS.modal('Novo arquivo de teste', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() },
        DS.campo('Caminho dentro da pasta do projeto', caminho, { inteiro: true, ajuda: 'Nome de teste: *.spec.ts, *.test.js, *.feature ou test_*.py.' }), DS.campo('Título do cenário', titulo, { inteiro: true }),
        DS.campo('Caso do Qase (opcional)', caso, { inteiro: true, ajuda: 'Grava a anotação "Qase: CHAVE-ID" no arquivo, que liga a automação ao caso.' })),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar…', async () => {
        const c = caminho.value.trim(); if (!c) { avisar(tr('Informe o caminho do arquivo.'), true); return; }
        const r = await chamar(() => api.testesGravar(e.id, c, modeloDeTeste(c, caso.value ? Number(caso.value) : null, titulo.value.trim()), null)); if (!r || r.canceled) return;
        DS.fecharModal(); await fontes(e, { forcar: true }); mem.ide = { arquivo: r.arquivo, editar: true }; void mostrar('testes');
      }, { id: 'ide-novo-criar', primaria: true }))], { tamanho: 'md' });
      caminho.focus();
    }
    function selecionar(t, li) {
      for (const x of editor.querySelectorAll('.ds-ide-teste[aria-current]')) x.removeAttribute('aria-current'); li.setAttribute('aria-current', 'true');
      const casos = (t.qase || []).map((q) => ({ q, c: casaQase(vinc(e, 'qase'), [q], q.replace(/^.*-/, '')) ? casosPorId.get(q.replace(/^.*-/, '')) : null }));
      const tickets = casos.flatMap(({ c }) => (c ? [...ticketsExternos(c), ...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'jira').map((x) => x.id)] : []));
      const res = casos.flatMap(({ c }) => (c ? resultadosLocais(src.runs, c.id) : [])).sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
      painel.replaceChildren(...[h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr('Teste')), h('p', { class: 'ds-texto' }, h('strong', {}, t.titulo)), h('p', { class: 'ds-sub' }, tr('linha {l}', { l: t.linha }) + (t.fim ? '–' + t.fim : '')), h('div', { class: 'ds-chips' }, chipNivel(t.tipo), DS.chip(tr('confiança {c}', { c: t.confianca })), ...t.tags.map(chipTag)), h('p', { class: 'ds-sub' }, tr('Classificação: {m}', { m: t.motivo }))),
        t.passos.length ? DS.bloco('Passos no código', h('ol', { class: 'ds-lista' }, t.passos.map((p) => h('li', {}, p)))) : null,
        DS.bloco('Caso no Qase', casos.length ? h('div', { class: 'ds-celula-nos' }, casos.map(({ q, c }) => (c ? F.noRef(e, { tipo: 'qase', id: String(c.id), vinculoId: vinc(e, 'qase')?.id }, tr('Caso {id}', { id: c.id }) + ' · ' + rotuloTipoCaso[tipoCaso(c)]) : h('span', { class: 'ds-chip', 'data-tom': 'aviso', title: tr('O código anota este ID, mas o caso não veio na consulta ao Qase vinculado.') }, 'Qase ' + q + ' · ' + tr('não encontrado'))))) : h('p', { class: 'suave' }, tr('Nenhuma anotação Qase neste teste.'))),
        tickets.length ? DS.bloco('Tickets', h('div', { class: 'ds-celula-nos' }, [...new Set(tickets)].map((k) => F.noRef(e, { tipo: 'jira', id: k, vinculoId: vinc(e, 'jira')?.id }, k)))) : null,
        DS.bloco('Resultados no Prumo', res.length ? DS.tempo(res.slice(0, 5).map((x) => ({ tom: DS.tom(x.status), titulo: h('span', {}, selo(x.status), ' ', x.run.titulo), sub: hora(x.em) + ' · ' + (x.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução de automação')) }))) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado no Prumo para este teste.')))].filter(Boolean));
    }
    // Sem arquivo escolhido: abre o que mais liga código a casos do Qase (depois, o que tem mais testes).
    const peso = (x) => x.testes.filter((t) => (t.qase || []).length).length * 1000 + x.testes.length; const inicial = [...porArquivo].sort((x, y) => peso(y) - peso(x))[0];
    const alvo = mem.ide?.arquivo && porArquivo.some((x) => x.arquivo === mem.ide.arquivo) ? mem.ide : { arquivo: inicial.arquivo, linha: inicial.testes.find((t) => (t.qase || []).length)?.linha };
    await abrir(alvo.arquivo, alvo.linha);
    if (mem.ide?.novo) novoArquivo(mem.ide.novo);
  }
  async function codigoGithub(e, vg, corpo) {
    const caixa = h('div', { class: 'ds-ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos do repositório') }); const editor = h('section', { class: 'ds-ide-editor' });
    corpo.append(DS.barra(DS.acao('Trazer o repositório do GitHub', () => trazerDoGithub(e, false), { id: 'ide-trazer', primaria: true, titulo: 'Baixa uma cópia para este computador e a vincula ao projeto, para editar na IDE' })), DS.info(tr('Repositório {r} lido pelo GitHub vinculado, somente leitura. Traga uma cópia para este computador para editar, criar automações e classificar testes.', { r: vg.recurso.chave })), caixa, agentesNoCodigo(e)); caixa.append(arvoreEl, editor);
    async function listar(caminho, destino) {
      destino.replaceChildren(DS.carregando()); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho || '');
      if (!r.ok) { destino.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', r.error, [], { compacto: true })); return; }
      const itens = Array.isArray(r.data.dados) ? r.data.dados : []; destino.replaceChildren(...itens.sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo === 'dir' ? -1 : 1)).map((x) => {
        if (x.tipo === 'dir') { const det = h('details', { class: 'ds-ide-pasta' }, h('summary', {}, DS.icone('pasta'), h('span', {}, x.nome))); const filhos = h('div'); det.append(filhos); det.addEventListener('toggle', () => { if (det.open && !filhos.childNodes.length) void listar(x.caminho, filhos); }); return det; }
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
  function agentesNoCodigo(e) {
    const linha = h('div', { class: 'ds-fontes', id: 'ide-agentes', 'aria-live': 'polite' }, h('span', {}, DS.carregando('Consultando permissões dos agentes…')));
    api.agentesEstado(e.id).then((r) => {
      if (!r.ok) { linha.replaceChildren(h('span', { class: 'suave' }, tr('Permissões dos agentes indisponíveis.'))); return; }
      const m = new Map(r.data.matriz.map((c) => [c.id, c])); const rot = { PERMITIDO: 'permitido', EXIGE_AUTORIZACAO: 'exige autorização', BLOQUEADO: 'bloqueado', SOMENTE_PESSOA: 'somente pessoa' };
      const item = (id, texto) => { const c = m.get(id); if (!c) return null; return h('span', { title: c.motivo || '' }, DS.icone(c.estado === 'BLOQUEADO' ? 'cadeado' : 'escudo'), tr(texto), ': ', h('strong', {}, tr(rot[c.estado] || c.estado))); };
      linha.replaceChildren(h('span', {}, h('strong', {}, tr('Agentes neste código'))), item('consultar_contexto', 'ler contexto'), item('propor_casos', 'propor casos'), item('executar_testes', 'executar testes'), item('github_escrita', 'branch, commit e PR'), DS.link('Ajustar em Agentes', () => mostrar('agentes'), { seta: true }));
    });
    return linha;
  }
  /** Bloco "Código que implementa" no modal do caso (usa o catálogo já carregado ou carrega). */
  function blocoCodigoDoCaso(e, id) {
    const alvo = h('div', {}, h('p', { class: 'suave' }, tr('Procurando anotações no código…')));
    void (async () => { if (!e.pastaLocal) { alvo.replaceChildren(h('p', { class: 'suave' }, tr('Vincule a pasta do repositório para localizar o código deste caso.'))); return; }
      const src = await fontes(e); const vq = vinc(e, 'qase'); const declarados = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao').map((x) => x.id); const impl = []; for (const f of src.cat?.catalogo?.features || []) for (const t of f.testes) if (casaQase(vq, t.qase || [], id) || declarados.includes(f.arquivo + ':' + t.linha)) impl.push({ ...t, arquivo: f.arquivo });
      alvo.replaceChildren(impl.length ? h('ul', { class: 'ds-lista' }, impl.map((t) => h('li', {}, h('button', { type: 'button', class: 'ds-link seta', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo + ':' + t.linha), h('span', { class: 'ds-sub' }, t.titulo), h('span', { class: 'ds-chips' }, chipNivel(t.tipo), ...t.tags.map(chipTag)))))
        : h('p', { class: 'suave' }, tr('Nenhum teste do código anota este caso (qase({id}) ou "Qase: {id}").', { id }))); })();
    return DS.bloco('Código que implementa', alvo);
  }
  window.PrumoTestes = Object.freeze({ blocoCodigoDoCaso });
})();
