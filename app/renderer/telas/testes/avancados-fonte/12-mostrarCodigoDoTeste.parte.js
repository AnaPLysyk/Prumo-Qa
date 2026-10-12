/** Apresenta código de automação declarado no projeto. Parte de testes-v40.js; nao carregar isoladamente. */
  async function telaCodigo(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal && !vg) { corpo.append(DS.estadoTela('vazio', 'Nenhum repositório vinculado', 'Vincule a pasta local do repositório ou um repositório do GitHub em Projetos para ver o código de teste.', [DS.acao('Abrir Projetos', () => mostrar('projetos'))])); return; }
    if (!e.pastaLocal) return codigoGithub(e, vg, corpo);
    const src = await fontes(e); const cat = src.cat?.catalogo; if (!cat) { corpo.append(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat?.erro || '')); return; }
    const porArquivo = cat.features.map((f) => ({ arquivo: f.arquivo, feature: f.nome, testes: f.testes, tipos: f.tipos }));
    const casosPorId = new Map((src.casos?.itens || []).map((c) => [String(c.id), c]));
    const caixa = h('div', { class: 'ds-ide', id: 'ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos de teste') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(agentesNoCodigo(e), caixa);
    const pasta = (nome, n, nivel) => { const det = h('details', { class: 'ds-ide-pasta', open: nivel < 3 }, h('summary', {}, DS.icone('pasta'), h('span', {}, nome))); for (const [k, sub] of [...n.pastas.entries()].sort()) det.append(pasta(k, sub, nivel + 1)); for (const a of n.arquivos.sort((x, y) => x.arquivo.localeCompare(y.arquivo))) det.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, title: a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo.split('/').at(-1)), h('span', { class: 'ds-n' }, String(a.testes.length)))); return det; };
    const raiz = arvore(porArquivo); arvoreEl.append(h('p', { class: 'ds-doc-grupo' }, tr('{n} arquivo(s) · {t} teste(s)', { n: porArquivo.length, t: cat.testes })));
    for (const [k, sub] of [...raiz.pastas.entries()].sort()) arvoreEl.append(pasta(k, sub, 0)); for (const a of raiz.arquivos) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo)));
    if (!porArquivo.length) { editor.append(DS.estadoTela('vazio', 'Nenhum arquivo de teste encontrado na pasta vinculada.', 'O Prumo reconhece *.spec/*.test (JS/TS), *.feature e test_*.py.')); return; }
    painel.append(DS.estadoTela('vazio', 'Selecione um teste', 'As conexões do teste com casos, tickets, execuções e agentes aparecem aqui.', [], { compacto: true }));
    async function abrir(arquivo, linha) {
      mem.ide = { arquivo, linha }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const info = porArquivo.find((x) => x.arquivo === arquivo); const porLinha = new Map((info?.testes || []).map((t) => [t.linha, t]));
      const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => { const t = porLinha.get(i + 1); const li = h('li', { 'data-linha': i + 1, class: t ? 'ds-ide-teste' : null }, h('code', {}, txt || ' '));
        if (t) li.prepend(h('button', { type: 'button', class: 'ds-ide-marca', 'aria-label': tr('Ver conexões do teste {t}', { t: t.titulo }), onclick: () => selecionar(t, li) }, chipNivel(t.tipo), ...(t.qase || []).map((q) => h('span', { class: 'ds-chip', 'data-tom': 'info' }, 'Qase ' + q)), ...t.tags.slice(0, 3).map(chipTag)));
        linhasEl.append(li); });
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · {t} teste(s) · somente leitura', { n: r.data.linhas, t: info?.testes.length || 0 }))), linhasEl);
      const alvo = linha && linhasEl.querySelector(`[data-linha="${linha}"]`); if (alvo) { alvo.scrollIntoView({ block: 'center' }); const t = porLinha.get(linha); if (t) selecionar(t, alvo); }
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
  }
