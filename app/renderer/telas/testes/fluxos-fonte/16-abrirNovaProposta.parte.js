/** Abre uma nova proposta de caso. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function novaProposta(e) { DS.modal('Nova proposta de caso', formularioProposta(e, null, () => { DS.fecharModal(); mostrar('testes'); }), { tamanho: 'md' }); }
