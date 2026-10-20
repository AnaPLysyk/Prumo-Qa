'use strict';
/** Projetos: explica por que uma pasta com contrato local não pôde ser vinculada. */
function montarDiagnosticoPasta(situacao) {
  return h(
    'div',
    { class: 'nota' },
    h('strong', {}, 'Não vinculado: '),
    selo(situacao.state),
    ' ',
    situacao.message,
    h('div', { class: 'suave' }, h('code', {}, situacao.root)),
    situacao.instructions ? h('p', {}, situacao.instructions) : null
  );
}
