/** Define rotulos e estados exibidos no historico. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const ROTULO_FERRAMENTA = { contexto_projeto: 'Contexto do projeto consultado', revisar_cobertura: 'Revisão de cobertura', executar_validacao: 'Validação solicitada', consultar_evidencias: 'Evidências consultadas', desconhecida: 'Ferramenta não reconhecida' };
  const ICONE_FERRAMENTA = { contexto_projeto: 'projeto', revisar_cobertura: 'revisao', executar_validacao: 'execucao', consultar_evidencias: 'evidencia', desconhecida: 'agente' };
  const classeEstado = (s) => (['PASS', 'OK'].includes(s) ? 'good' : ['FAIL', 'ERROR'].includes(s) ? 'bad' : ['BLOCKED', 'NOT_VERIFIED', 'NOT_RUN', 'SEM_TERMINO_OBSERVADO', 'STARTED'].includes(s) ? 'warn' : '');
