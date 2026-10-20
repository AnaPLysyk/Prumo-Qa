/** Detalhes de uma atividade do Orchestrator e das IAs (usado por Agentes e Logs). */
  const ROTULO_FERRAMENTA = { contexto_projeto: 'Contexto do projeto consultado', revisar_cobertura: 'Revisão de cobertura', executar_validacao: 'Validação solicitada', consultar_evidencias: 'Evidências consultadas', desconhecida: 'Ferramenta não reconhecida' };
  const ICONE_FERRAMENTA = { contexto_projeto: 'projeto', revisar_cobertura: 'revisao', executar_validacao: 'execucao', consultar_evidencias: 'evidencia', desconhecida: 'agente' };
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
