'use strict';
/** Projetos: escolhe uma conexão GitHub e permite vincular ou trazer o repositório para uma pasta local. */
function abrirRepositoriosGithub(painel, espaco) {
  const fechar = () => painel.replaceChildren();

  /** Pagina os repositórios da conexão selecionada, sem carregar outros projetos. */
  async function mostrarPagina(conta, pagina) {
    const resposta = await chamar(() => api.servicoRecursos(conta.id, pagina));
    if (!resposta) return;

    const recursos = resposta.recursos.length
      ? h(
          'ul',
          { class: 'ds-lista' },
          resposta.recursos.map(recurso => h(
            'li',
            { class: 'proj-vinculo' },
            h('strong', {}, recurso.chave),
            botao('Vincular', async () => {
              const vinculo = await chamar(
                () => api.servicoVincular(espaco.id, conta.id, recurso)
              );
              if (vinculo && !vinculo.canceled) mostrar('projetos');
            }, 'repo-vincular-' + recurso.chave),
            botao('Vincular e trazer para este computador', async () => {
              const vinculo = await chamar(
                () => api.servicoVincular(espaco.id, conta.id, recurso)
              );
              if (!vinculo || vinculo.canceled) return;
              await chamar(() => api.espacoTrazer(espaco.id));
              mostrar('projetos');
            }, 'repo-trazer-' + recurso.chave)
          ))
        )
      : h('p', { class: 'suave' }, 'A API retornou uma lista vazia para esta credencial.');

    painel.replaceChildren(
      h('h2', {}, tr('Repositórios de {n}', { n: conta.nome })),
      recursos,
      h(
        'div',
        { class: 'barra-acoes' },
        resposta.proxima !== null
          ? botao('Próxima página de recursos', () => mostrarPagina(conta, {
              offset: resposta.proxima, limite: 50
            }))
          : null,
        botao('Cancelar', fechar)
      )
    );
  }

  return (async () => {
    const contas = await chamar(api.servicos);
    if (!contas) return;

    const github = contas.filter(conta => conta.ativa && conta.servico === 'github');
    if (!github.length) {
      painel.replaceChildren(
        h('p', { class: 'nota' }, 'Nenhuma conexão do GitHub ativa. Configure uma em Conexões.'),
        botao('Abrir Conexões', () => mostrar('conexoes')),
        botao('Cancelar', fechar)
      );
      return;
    }

    if (github.length === 1) {
      await mostrarPagina(github[0], { offset: 0, limite: 50 });
      return;
    }

    painel.replaceChildren(
      h('h2', {}, 'Escolha a conexão GitHub'),
      ...github.map(conta => botao(
        conta.nome,
        () => mostrarPagina(conta, { offset: 0, limite: 50 })
      )),
      botao('Cancelar', fechar)
    );
  })();
}
