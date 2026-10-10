# Como conectar uma IA

MCP (Model Context Protocol) é o protocolo pelo qual um agente de IA chama ferramentas locais. O Prumo fornece um servidor MCP local por stdio: o próprio cliente de IA inicia o processo, que conversa apenas com ele. Não existe servidor remoto, e fechar esta janela não encerra sessões MCP já iniciadas.

## Conectar

Abra **Conexões**. Para cada cliente aparecem o destino da configuração e o comando exato.

- **Codex**: se o cliente for localizado, o botão pede confirmação nativa e adiciona a configuração sem sobrescrever uma existente.
- **Claude Code**: copie o comando mostrado e execute no PowerShell depois de revisá-lo.

Depois de configurar, reabra o cliente. A configuração não comprova sessão ativa: o Prumo só sabe que houve chamadas quando elas aparecem em Logs. O nome do cliente nos registros é declarado por ele mesmo e não é autenticado.

## Confirmar a integração (2.6)

Conexões distingue NÃO CONFIGURADO, CONFIGURADO, VALIDADO, UTILIZADO e ERRO. A inspeção confere runtime, servidor, projeto e ambiente esperado sem mostrar credenciais. Quando a inspeção não é possível, informa erro; não interpreta isso como ausência de configuração.

**Testar integração** inicia o servidor do próprio produto com o SDK MCP real, faz handshake, lista as quatro ferramentas e chama somente consultar_evidencias. O teste tem UUID, horário, duração e diagnóstico próprios. Ele comprova o servidor local; não comprova uso pelo Claude ou Codex e não executa testes de projeto.

Faça uma chamada a partir do cliente de IA e atualize Conexões para observar o registro do cliente, separado do protocolo SDK. A identidade é declarada, não autenticada. Os registros antigos continuam no histórico, mas não comprovam UTILIZADO na nova tela: versões anteriores podiam classificar SDK com nome Codex como cliente real. Referências de contexto mostram id, versão, hash e estado incluídos/consultados; não provam que o agente obedeceu ao conteúdo.

## Skill de QA

A Skill (skills/qa/SKILL.md) orienta o método de qualidade da IA. Nem todo cliente a reconhece automaticamente: no Codex invoque $qa explicitamente e, no Claude Code, use /qa depois de instalá-la conforme o README.

As políticas de aprovação do cliente de IA continuam valendo; o Prumo não as contorna.
