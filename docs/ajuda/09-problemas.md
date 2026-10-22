# Problemas comuns

Encontre aqui soluções para problemas comuns. Se precisar de mais ajuda, consulte **Ajuda › Suporte e avisos de atualização**.

- **A conexão MCP não aparece.** Feche e reabra o cliente de IA. Em **Agentes › IA e regras › Conectar IA**, clique em **Testar conexão**. Se as chamadas aparecerem em **Logs**, a conexão está funcionando. Se você reinstalou o Prumo em outra pasta, configure a conexão novamente.
- **O projeto não tem contrato ou o contrato é inválido.** Leia a mensagem para saber o motivo. Corrija o arquivo `qa.project.json` ou remova-o para que o Prumo possa sugerir outro. O projeto não será vinculado enquanto o contrato estiver inválido.
- **Não aparecem logs.** Talvez ainda não tenha havido chamadas neste projeto ou outro projeto esteja selecionado. Confira **Projeto**, no topo do menu lateral.
- **As métricas estão parciais.** Há um registro inválido ou incompleto. O Prumo avisa e não inclui esse registro nos cálculos nem o altera.
- **A execução ficou `BLOCKED`.** Pode estar faltando sua aprovação, um pré-requisito ou uma permissão no contrato. No Windows, o `aprovar.exe` pode ter sido bloqueado. No Linux, podem faltar polkit, zenity ou kdialog.
- **O Windows bloqueou o instalador ou o `aprovar.exe`.** O Smart App Control pode bloquear arquivos novos sem assinatura digital. O Prumo não desativa nem contorna essa proteção. O instalador ainda não tem assinatura digital.
- **`npm run` falhou com `RUNTIME_MISSING`.** O Prumo não inclui o npm. Instale o Node.js com npm ou use uma capacidade `node`.
- **Jira, Qase ou GitHub recusou o envio.** O Prumo mostra o motivo informado pelo serviço. No GitHub, confira as permissões do token. Em **Conexões**, veja quais permissões são necessárias.
- **Não foi possível verificar atualizações.** Talvez não haja internet ou o GitHub esteja indisponível. O Prumo continua funcionando.
