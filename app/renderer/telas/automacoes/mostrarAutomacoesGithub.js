'use strict';
/** Mostra informações de automações vinculadas ao GitHub. */
// ---------------- Automações: GitHub ----------------
const automacoesBase = abas.automacoes;
abas.automacoes = async (el) => {
  await automacoesBase(el); const e = semProjetoServico(el, 'github'); if (!e) return; const perm = await escritaDoProjeto(e); const on = !!perm.github; const saida = h('div', { id: 'gh-saida' });
  const ciCx = h('div', { id: 'gh-ci' }); el.append(h('h2', {}, 'Execuções de CI (GitHub Actions)'), botao('Carregar execuções', async () => {
    const r = await chamar(() => api.servicoConsultar(e.id, 'github', 'workflows', { limite: 15 })); if (!r) return;
    const concl = (c) => selo(c === 'success' ? 'PASS' : c === 'failure' ? 'FAIL' : (c || 'NOT_RUN').toUpperCase());
    const jobs = async (w) => { const x = await chamar(() => api.servicoConsultar(e.id, 'github', 'jobs', {}, String(w.id))); if (!x) return; ciCx.append(h('div', { class: 'nota' }, x.dados.map(y => h('p', {}, y.nome + ' · ' + y.estado + ' · ' + (y.conclusao || '—') + ' · ' + y.etapas.filter(s2 => s2.conclusao === 'failure').map(s2 => 'falhou: ' + s2.nome).join(', '))))); };
    const linha = (w) => h('tr', {}, h('td', {}, String(w.numero ?? w.id)), h('td', {}, w.nome || ''), h('td', {}, w.branch || ''), h('td', {}, w.estado || ''), h('td', {}, concl(w.conclusao)), h('td', {}, botao('Jobs', () => jobs(w))));
    const tabela = h('div', { class: 'rolagem' }, h('table', { id: 'gh-ci-tabela' }, h('thead', {}, h('tr', {}, ['#', 'Workflow', 'Branch', 'Estado', 'Conclusão', ''].map(t => h('th', {}, t)))), h('tbody', {}, r.dados.map(linha))));
    ciCx.replaceChildren(r.dados.length ? tabela : h('div', { class: 'vazio' }, 'Nenhuma execução retornada.'),
      h('p', { class: 'suave' }, 'Logs e artefatos: use o link da execução no GitHub.'));
  }, 'gh-ci-carregar'), ciCx);
  const branch = campoPlataforma('Branch de trabalho (prumo/...)', { id: 'gh-branch', value: 'prumo/novos-testes', maxlength: 80 }); const caminho = campoPlataforma('Arquivo de teste (ex.: tests/login.spec.ts)', { id: 'gh-caminho', maxlength: 300 }); const conteudo = campoTexto('Conteúdo do arquivo', 'gh-conteudo', { rows: 8, maxlength: 262144 }); const msg = campoPlataforma('Mensagem do commit', { id: 'gh-msg', maxlength: 200, value: 'test: propor cenário' }); const pr = campoPlataforma('Título do Pull Request', { id: 'gh-pr', maxlength: 200 });
  el.append(h('h2', {}, 'Propor testes no repositório'), h('p', { class: 'suave' }, 'Escreve só em prumo/…, nunca na principal. PR nasce como rascunho.'), avisoEscrita('github', on), h('div', { class: 'formulario' }, branch.no,
    botao('Criar branch…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.criar_branch', { nome: branch.input.value })) || ''); }, 'gh-criar-branch'), caminho.no, conteudo.no, msg.no,
    botao('Gravar arquivo no branch…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.commitar_arquivo', { branch: branch.input.value, caminho: caminho.input.value, conteudo: conteudo.input.value, mensagem: msg.input.value })) || ''); }, 'gh-commit'), pr.no,
    botao('Abrir Pull Request (rascunho)…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.abrir_pr', { branch: branch.input.value, titulo: pr.input.value, corpo: 'Proposto pelo Prumo QA para revisão.' })) || ''); }, 'gh-pr-abrir'), saida));
};

