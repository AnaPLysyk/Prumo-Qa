/** Verifica se um registro pertence ao periodo. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function noPeriodo(at) { const d = diaIso(at); if (intervalo) return d >= intervalo[0] && d <= intervalo[1]; return Date.parse(at) >= Date.now() - dias * 86400000; }
