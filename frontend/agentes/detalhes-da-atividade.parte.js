/** Detalhes de uma atividade do Orchestrator e das IAs (usado por Agentes e Logs). */
  const ROTULO_FERRAMENTA = { contexto_projeto: 'Contexto do projeto consultado', revisar_cobertura: 'Revisão de cobertura', executar_validacao: 'Validação solicitada', consultar_evidencias: 'Evidências consultadas', desconhecida: 'Ferramenta não reconhecida' };
  const ICONE_FERRAMENTA = { contexto_projeto: 'projeto', revisar_cobertura: 'revisao', executar_validacao: 'execucao', consultar_evidencias: 'evidencia', desconhecida: 'agente' };
  const classeEstado = (s) => (['PASS', 'OK'].includes(s) ? 'good' : ['FAIL', 'ERROR'].includes(s) ? 'bad' : ['BLOCKED', 'NOT_VERIFIED', 'NOT_RUN', 'SEM_TERMINO_OBSERVADO', 'STARTED'].includes(s) ? 'warn' : '');
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
  async function copiar(texto) { try { await navigator.clipboard.writeText(texto); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar.'), true); } }
