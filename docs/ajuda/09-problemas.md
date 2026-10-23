# Problemas comuns

Se o problema não estiver aqui, abra **Suporte** (veja **Ajuda › Suporte e avisos de atualização**).

- **A conexão MCP não aparece.** Feche e reabra o cliente de IA. Em **Agentes › IA e regras › Conectar IA**, clique em **Testar conexão**. Se as chamadas aparecerem em **Logs**, a conexão funciona. Se você reinstalou o Prumo em outra pasta, configure a conexão de novo.
- **O projeto não tem contrato ou o contrato é inválido.** Leia a mensagem para saber o motivo. Corrija o `qa.project.json` ou remova o arquivo para o Prumo sugerir outro. Enquanto o contrato for inválido, o projeto não é vinculado.
- **Não aparecem logs.** Pode não ter havido chamadas neste projeto, ou outro projeto está selecionado. Confira o seletor **Projeto**, no topo do menu lateral.
- **As métricas estão parciais.** Há um registro inválido ou incompleto. O Prumo avisa, deixa esse registro fora dos cálculos e não o altera.
- **A execução ficou `BLOCKED`.** Pode faltar sua aprovação, um pré-requisito ou uma permissão no contrato. No Windows, o `aprovar.exe` pode ter sido bloqueado. No Linux, podem faltar polkit, zenity ou kdialog.
- **O Windows bloqueou o instalador ou o `aprovar.exe`.** O Smart App Control pode bloquear arquivos novos sem assinatura digital, e o instalador ainda não tem uma. O Prumo não desativa nem contorna essa proteção.
- **`npm run` falhou com `RUNTIME_MISSING`.** O Prumo não inclui o npm. Instale o Node.js com npm ou use uma capacidade `node`.
- **Jira, Qase ou GitHub recusou o envio.** O Prumo mostra o motivo informado pelo serviço. No GitHub, confira as permissões da conexão. Em **Projetos**, abra a bolha do serviço e clique em **Contas e permissões** para ver o que é necessário.
- **Não foi possível verificar atualizações.** Pode não haver internet ou o GitHub pode estar fora do ar. O Prumo continua funcionando.
