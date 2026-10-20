'use strict';
/** Projetos: lista vínculos externos e pasta local; cada ação atualiza somente o projeto escolhido. */
function montarVinculosProjeto(espaco) {
  const vinculos = espaco.vinculos.map(vinculo => h(
    'li',
    { class: 'proj-vinculo', 'data-servico': vinculo.servico },
    DS.origem(vinculo.servico, DS.nomesServico[vinculo.servico] + ' · ' + vinculo.recurso.chave),
    h(
      'span',
      { class: 'ds-sub' },
      'ID ' + vinculo.recurso.id + ' · ' + vinculo.recurso.instancia + ' · ' +
        tr('validado {q}', { q: hora(vinculo.validadoEm) })
    ),
    selo(vinculo.estado),
    h(
      'span',
      { class: 'proj-vinculo-acoes' },
      DS.link('Validar', async () => {
        if (await chamar(() => api.servicoConferir(espaco.id, vinculo.servico))) {
          mostrar('projetos');
        }
      }, { rotulo: 'Validar vínculo ' + vinculo.servico, seta: false }),
      DS.link('Remover', async () => {
        const resultado = await chamar(() => api.servicoDesvincular(espaco.id, vinculo.servico));
        if (resultado && !resultado.canceled) mostrar('projetos');
      }, { rotulo: 'Remover vínculo ' + vinculo.servico, seta: false })
    )
  ));

  const pastaLocal = h(
    'li',
    { class: 'proj-vinculo', 'data-servico': 'local' },
    DS.origem(
      espaco.pastaLocal ? 'local' : 'ausente',
      espaco.pastaLocal ? tr('Pasta vinculada') : tr('Sem pasta local')
    ),
    h(
      'span',
      { class: 'ds-sub' },
      espaco.pastaLocal ||
        DS.info('Opcional: necessária para catálogo, automações e evidências locais.')
    )
  );

  return h('ul', { class: 'ds-lista proj-vinculos' }, vinculos, pastaLocal);
}
