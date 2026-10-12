/** Confere a relação declarada entre um caso e seu código. Parte de testes-v40.js; nao carregar isoladamente. */
  const casaQase = (vq, ids, casoId) => ids.some((x) => x === String(casoId) || (vq && x === vq.recurso.chave + '-' + casoId));
  /** Modelo unificado: cada linha é um caso do Qase, um teste do código, ou os dois quando ligados explicitamente. */
