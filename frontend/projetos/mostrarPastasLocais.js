'use strict';
/** Projetos: mostra pastas com qa.project.json; não gerencia conexões remotas ou cadastros de projeto. */
async function mostrarPastasLocais(elemento) {
  elemento.append(h('h2', { id: 'pastas-contrato-local' }, 'Pastas com contrato local'));
  const diagnostico = h('div', { id: 'diagnostico' });

  const vincularPasta = async () => {
    const resposta = await chamar(api.escolherProjeto);
    if (!resposta || resposta.canceled) return;
    if (resposta.linked) {
      estado.root = resposta.situation.root;
      salvarRaiz();
      avisar('Projeto vinculado.');
      mostrar('projetos');
      return;
    }
    diagnostico.replaceChildren(montarDiagnosticoPasta(resposta.situation));
  };

  const adicionarDemonstracao = async () => {
    const resposta = await chamar(api.adicionarDemo);
    if (!resposta) return;
    if (resposta.linked) {
      estado.root = resposta.situation.root;
      salvarRaiz();
      mostrar('projetos');
    } else {
      diagnostico.replaceChildren(montarDiagnosticoPasta(resposta.situation));
    }
  };

  elemento.append(
    h(
      'div',
      { class: 'barra' },
      h('button', { class: 'acao primaria', onclick: vincularPasta }, 'Vincular pasta…'),
      h('button', { class: 'acao', onclick: adicionarDemonstracao }, 'Adicionar projeto de demonstração')
    ),
    diagnostico
  );

  const todas = await chamar(api.projetos);
  if (!todas) return;
  const gerenciados = await chamar(api.espacos);
  const lista = todas.filter(pasta => !gerenciados?.some(
    espaco => espaco.raizContextos === pasta.root
  ));

  if (!lista.length) {
    elemento.append(h('div', { class: 'vazio' }, 'Nenhuma pasta vinculada ainda.'));
    return;
  }

  const linhas = lista.map(pasta => h(
    'tr',
    {},
    h(
      'td',
      {},
      h('strong', {}, pasta.name || pasta.id || '—'),
      h('div', { class: 'suave' }, pasta.id || '')
    ),
    h(
      'td',
      {},
      selo(pasta.state),
      pasta.readOnly ? h('div', { class: 'suave' }, 'somente leitura') : null,
      pasta.state !== 'INTEGRADO'
        ? h('div', { class: 'suave' }, pasta.message)
        : null
    ),
    h('td', {}, (pasta.capabilities || []).join(', ') || '—'),
    h('td', {}, h('code', {}, pasta.root)),
    h(
      'td',
      {},
      pasta.root === estado.root
        ? h('span', { class: 'suave' }, 'selecionado')
        : h('button', {
            class: 'acao',
            onclick: () => {
              estado.root = pasta.root;
              salvarRaiz();
              mostrar('projetos');
            }
          }, 'Selecionar'),
      ' ',
      h('button', {
        class: 'acao',
        title: 'Remove só o vínculo; arquivos e histórico permanecem',
        onclick: async () => {
          await chamar(() => api.desvincular(pasta.root));
          if (estado.root === pasta.root) estado.root = null;
          salvarRaiz();
          mostrar('projetos');
        }
      }, 'Desvincular')
    )
  ));

  elemento.append(
    h(
      'table',
      {},
      h(
        'thead',
        {},
        h('tr', {}, ['Projeto', 'Situação', 'Capacidades', 'Pasta', ''].map(
          titulo => h('th', {}, titulo)
        ))
      ),
      h('tbody', {}, linhas)
    )
  );
}
