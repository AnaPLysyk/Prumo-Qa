/** Acrescenta preferencia do assistente aos controles. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  if (typeof montarControles === 'function') { const base = montarControles; montarControles = function () { base(); ajustesAssistente(); }; }
  // mostrar() transfere os filhos do recipiente temporário para o main; a classe
  // precisa acompanhar os filhos para manter estilos restritos ao módulo.
