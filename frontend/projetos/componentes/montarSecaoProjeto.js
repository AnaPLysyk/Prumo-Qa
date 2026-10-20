'use strict';
/** Projetos: apresenta um projeto e suas ações, mantendo conexões e dados dentro da tela Projetos. */
function montarSecaoProjeto(espaco, editar) {
  const painelGithub = h('div', { class: 'repos-github' });
  const podeVerTestes = !window.PrumoConta || window.PrumoConta.pode('testes');
  const selecionado = estado.espaco?.id === espaco.id;

  const acoes = h(
    'div',
    { class: 'barra-acoes' },
    botao(
      selecionado ? 'Projeto selecionado' : 'Selecionar projeto',
      () => escolherEspaco(espaco)
    ),
    podeVerTestes
      ? botao(
          'Abrir casos de teste',
          () => escolherEspaco(espaco, 'testes'),
          'espaco-testes-' + espaco.id
        )
      : null,
    botao('Editar projeto', () => editar(espaco)),
    botao(
      'Escolher repositório do GitHub…',
      () => abrirRepositoriosGithub(painelGithub, espaco),
      'espaco-github-' + espaco.id
    ),
    botao('Vincular repositório local…', async () => {
      const resultado = await chamar(() => api.espacoPasta(espaco.id));
      if (resultado && !resultado.canceled) mostrar('projetos');
    })
  );

  return h(
    'section',
    { class: 'nota', 'data-espaco': espaco.id },
    h('h2', {}, espaco.nome),
    espaco.descricao ? h('p', { class: 'suave' }, espaco.descricao) : null,
    montarVinculosProjeto(espaco),
    acoes,
    painelGithub,
    h('p', { class: 'suave' }, 'ID Prumo: ', h('code', {}, espaco.id))
  );
}
