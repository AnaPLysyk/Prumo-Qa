/** Reúne trecho visual da função inicio para o bundle interfaces-v36. */
  abas.inicio = async (el) => {
    el.classList.add('v36-inicio');
    if (!estado.worker && typeof atualizarWorker === 'function') await atualizarWorker();
    flutuante?.fechar(true);
    el.append(conversa.montar()); conversa.estadoOrbita(); conversa.sincronizar();
  };

  // ---------------- Logs: terminal de eventos do núcleo ----------------
  // Mesma regra de nível do núcleo (atividades.ts): FAIL/ERROR = 50, BLOCKED = 40, demais = 30.
