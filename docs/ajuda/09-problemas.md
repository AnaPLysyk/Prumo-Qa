# Problemas comuns

Juntei aqui o que mais aparece. Se não resolver, veja **Ajuda › Suporte e avisos de atualização**.

- **Conexão MCP não detectada.** Configuração não prova sessão. Reabra o cliente de IA e use **Testar integração** em Conexões; se houver chamadas em Logs, a conexão funciona. Se instalou o Prumo em outra pasta, configure de novo.
- **Projeto sem contrato ou inválido.** A mensagem diz o motivo. Corrija o qa.project.json, ou apague-o para o Prumo propor um novo; nada é vinculado enquanto ele for inválido.
- **Não aparecem logs.** Ainda não houve chamadas nesse projeto, ou outro projeto está selecionado. Confira o seletor **Projeto** no topo do menu lateral.
- **Métricas parciais.** Há registro inválido ou truncado; ele fica fora do cálculo e é sinalizado, nunca corrigido.
- **Execução retorna BLOCKED.** Falta a sua aprovação (esperado), uma pré-condição, ou o contrato bloqueia a capacidade. No Windows, o aprovar.exe pode ter sido bloqueado; no Linux, podem faltar polkit e zenity ou kdialog.
- **O Windows bloqueou o instalador ou o aprovar.exe.** Smart App Control e Controle de Aplicativo bloqueiam arquivos novos sem assinatura digital. O Prumo não desliga nem contorna essas proteções; a solução definitiva é a assinatura de código, que ainda não existe.
- **npm run falha com RUNTIME_MISSING.** O Prumo não traz npm: instale Node.js com npm ou use uma capacidade node.
- **O serviço recusou um envio.** O Prumo mostra o motivo dado pelo Jira, Qase ou GitHub (no GitHub, a permissão que faltou no token). Gere um token com as permissões listadas em Conexões.
- **Não foi possível verificar atualizações.** Sem internet ou GitHub indisponível; o Prumo continua funcionando.
