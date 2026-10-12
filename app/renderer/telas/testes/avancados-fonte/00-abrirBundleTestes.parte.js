/** Abre o escopo compartilhado de Testes avançados. Parte de testes-v40.js; nao carregar isoladamente. */
'use strict';
// Testes (v40): representação do que existe no Qase e no código do projeto, com a ligação explícita entre eles.
// Fontes: catálogo estático do repositório (testes:catalogo/testes:arquivo), Qase vinculado (servicoConsultar),
// vínculos declarados (relações do projeto) e resultados registrados no Prumo (runs). Uma ligação caso ↔ código só
// existe por anotação no código (qase(31), qase.id(31), @qase(31), "Qase: SFQ-31") ou por vínculo declarado.
(() => {
