/** Inicializa os utilitarios compartilhados pelas telas. */
'use strict';
// Integração isolada das telas aprovadas. Conteúdo importado é dado, nunca código.
(() => {
  const asset = (nome) => '../../assets/agentes/' + nome;
  const button = (texto, fn, attrs = {}) => h('button', { type: 'button', class: 'acao', onclick: fn, ...attrs }, texto);
  const field = (rotulo, input) => h('label', { class: 'v36-field' }, h('span', {}, rotulo), input);
  const note = (texto) => h('p', { class: 'suave' }, texto);
  const previewNotice = 'Prévia local: não executa, não se conecta ao MCP e não altera as políticas do núcleo.';
  const palette = ['#7abaff', '#80ddda', '#bea1f8', '#ffba90', '#a7de82', '#ffa1bf', '#f2d38c', '#99b8ff'];
  const variants = [0, 2, 3, 4, 5, 1, 6, 7];
