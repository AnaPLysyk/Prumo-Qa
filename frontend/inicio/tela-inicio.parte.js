/** Monta a tela inicial com conversa e estado do trabalho. */
  abas.inicio = async (el) => {
    el.classList.add('v36-inicio');
    if (!estado.worker && typeof atualizarWorker === 'function') await atualizarWorker();
    flutuante?.fechar(true);
    el.append(conversa.montar()); conversa.estadoOrbita(); conversa.sincronizar();
  };
