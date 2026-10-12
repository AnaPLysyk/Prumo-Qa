/** Define os topicos do assistente e suas sugestoes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const TOPICOS = {
    tests: { rot: 'Meus testes', icone: 'testes', pergunta: 'execuções e falhas recentes', aba: 'execucoes', rota: 'Execuções' },
    agents: { rot: 'Agentes', icone: 'agentes', texto: 'Os agentes são as especializações do núcleo. Em Agentes você consulta cada uma e ajusta as permissões do projeto.', aba: 'agentes', rota: 'Agentes' },
    logs: { rot: 'Investigar logs', icone: 'logs', pergunta: 'erros e falhas', aba: 'logs', rota: 'Logs' },
    metrics: { rot: 'Métricas', icone: 'metricas', situacao: true, aba: 'metricas', rota: 'Métricas' },
    history: { rot: 'Histórico', icone: 'historico', texto: 'O histórico reúne as atividades observadas pelo núcleo, em linha do tempo ou em tabela.', aba: 'historico', rota: 'Histórico' }
  };
  const INICIAIS = ['tests', 'agents', 'logs', 'metrics'];
  const PROXIMOS = { tests: ['metrics', 'logs', 'agents'], agents: ['tests', 'logs', 'metrics'], logs: ['history', 'tests', 'metrics'], history: ['logs', 'metrics', 'tests'], metrics: ['tests', 'history', 'logs'] };
  const TOPICO_DA_TELA = { logs: 'logs', historico: 'history', metricas: 'metrics', agentes: 'agents', execucoes: 'tests', testes: 'tests' };
  function topicoDe(q) {
    const x = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/log|erro|falh|failure|trace/.test(x)) return 'logs'; if (/hist|aconteceu|atividade|timeline/.test(x)) return 'history';
    if (/metric|graf|chart|dashboard/.test(x)) return 'metrics'; if (/agente|agent|orquest|mcp/.test(x)) return 'agents';
    if (/teste|test|execu|run|pass|fail|block/.test(x)) return 'tests'; return null;
  }
