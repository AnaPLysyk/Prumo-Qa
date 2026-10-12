# terminal — backend

Terminal: o comando prumo (CLI).

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## Nesta pasta

| Arquivo | O que faz |
| --- | --- |
| `avisarFalhaDeRegistroNoTerminal.ts` | Avisa no terminal quando o diário não pôde ser gravado (código de saída 3). |
| `avisarHistoricoIncompleto.ts` | Avisa que o histórico está incompleto e usa o código de saída 3. |
| `chamadaRegistrada.ts` | Executa uma ação do terminal registrando-a no diário com origem CLI. |
| `comandoAtividade.ts` | Comando "prumo atividade": mostra as 20 últimas operações. |
| `comandoConectar.ts` | Comando "prumo conectar": mostra a proposta e, com a confirmação digitada, configura o Codex. |
| `comandoEvidencias.ts` | Comando "prumo evidencias": lista as evidências ou uma pelo id. |
| `comandoLogs.ts` | Comando "prumo logs": mostra o diário ou acompanha ao vivo com --follow. |
| `comandoMetricas.ts` | Comando "prumo metricas": mostra os indicadores do diário. |
| `executarComandoPrumo.ts` | Lê os argumentos do comando prumo e executa a ação pedida. |
| `imprimirJson.ts` | Mostra um valor como JSON formatado no terminal. |
| `linhaDaOperacao.ts` | Escreve uma operação do diário numa linha legível. |
| `menuDoTerminal.ts` | Menu interativo do terminal com o painel do projeto. |
| `perguntarNoTerminal.ts` | Faz uma pergunta no terminal e devolve a resposta digitada. |
| `textoSeguroNoTerminal.ts` | Prepara um texto para o terminal: segredos mascarados e sem caracteres de controle. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `terminal.ts` | Texto de ajuda do comando prumo (uso, automação, aprovação e roteiros). |
