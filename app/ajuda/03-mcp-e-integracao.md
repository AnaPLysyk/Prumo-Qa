# MCP e conexão com IAs

MCP (Model Context Protocol) é o protocolo pelo qual um agente de IA chama ferramentas locais. O Prumo fornece um servidor MCP local por stdio: o próprio cliente de IA inicia o processo, que fala apenas com ele. Não existe servidor remoto.

Fechar esta janela não encerra sessões MCP iniciadas por Codex ou Claude Code.

## Conectar

Abra **Conexões**. Para cada cliente você vê o destino da configuração e o comando exato.

- Codex: se o cliente for localizado, o botão pede confirmação nativa e adiciona a configuração sem sobrescrever uma existente.
- Claude Code: copie o comando mostrado e execute no PowerShell depois de revisá-lo.

Depois de configurar, reabra o cliente. A configuração não comprova sessão ativa: o Prumo só sabe que houve chamadas quando elas aparecem nos logs. O nome do cliente nos registros é declarado pelo próprio cliente e não é autenticado.

As políticas de aprovação do cliente de IA continuam valendo; o Prumo não as contorna.
