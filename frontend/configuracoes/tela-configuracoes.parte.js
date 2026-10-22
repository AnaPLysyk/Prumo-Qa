/** Configurações: somente aparência; conta e agentes têm seus próprios espaços. */
function montarPainelConfiguracoes() {
  const caixa = $('#controles'); if (!caixa || caixa.querySelector('.ajustes-raiz')) return;
  const painelAparencia = h('div', { class: 'ajuste-painel', 'data-painel': 'aparencia' },
    h('section', { class: 'ajuste-secao' }, h('h3', { class: 'ajuste-titulo' }, tr('Aparência')), ...caixa.children));
  caixa.replaceChildren(
    h('div', { class: 'ajustes-raiz' },
      h('div', { class: 'ajustes-cab' }, h('strong', {}, tr('Configurações'))),
      h('div', { class: 'ajustes-conteudo' }, painelAparencia)));
}

if (typeof montarControles === 'function') {
  const base = montarControles;
  montarControles = function () { base(); montarPainelConfiguracoes(); };
}
