/** Mostra os detalhes de uma atividade registrada. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
  async function copiar(texto) { try { await navigator.clipboard.writeText(texto); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar.'), true); } }
