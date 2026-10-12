/** Abre o arquivo de teste selecionado no código. Parte de testes-v40.js; nao carregar isoladamente. */
  function abrirNoCodigo(e, arquivo, linha) { DS.fecharModal(); const mem = memoria('testes', e.id); mem.ide = { arquivo, linha }; (estado.sub ||= {}).testes = 'codigo'; mostrar('testes'); }
