/** Define quais abas de Testes devem aparecer. Parte de testes-v40.js; nao carregar isoladamente. */
  const ABAS = (vq) => [['catalogo', 'Visão geral'], ['codigo', 'Código'], ...(vq ? [['casos', 'Casos Qase'], ['suites', 'Suites'], ['planos', 'Planos']] : []), ['runs', 'Runs'], ['automacao', 'CI e GitHub']];
