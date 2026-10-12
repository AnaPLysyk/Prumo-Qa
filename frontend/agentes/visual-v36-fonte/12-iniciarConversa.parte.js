/** Inicia a conversa visual e seus controles. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const conversa = (() => {
    let el = null, msgs, entrada, enviar, chips, seletorAgente, seletorProvedor, rodapeTexto, fila = Promise.resolve(), primeira = true, projeto, versao = 0, roster = null, historico = [], pendente = null;
    const nomeIa = () => estado.prefs?.ia?.nome || 'Prumo';
    const rolar = () => { msgs.scrollTop = msgs.scrollHeight; };
