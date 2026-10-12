/** Texto de ajuda do comando prumo (uso, automação, aprovação e roteiros). */

export const ajuda={usage:'prumo [--root <raiz-absoluta>] | atividade | logs [--follow] | metricas | evidencias | conectar codex | doctor | prompts [nome]',
  automation:'--json em consultas. Mantidos context, review <plano.json>, run <capability>, approve <capability>, evidence [jobId].',
  approval:'approve exige autenticação humana Windows; conectar exige confirmação no terminal antes de alterar a configuração do cliente.',
  prompts:'prompts lista os roteiros do Prumo (os mesmos prompts do servidor MCP); prompts <nome> imprime o texto, sem executar nada.'};
