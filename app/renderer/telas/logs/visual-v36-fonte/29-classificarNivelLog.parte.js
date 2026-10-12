/** Define o indicador visual do nivel dos logs. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const nivelDe = (s) => (s === 'ERROR' || s === 'FAIL' ? 'ERROR' : s === 'BLOCKED' ? 'WARN' : 'INFO');
