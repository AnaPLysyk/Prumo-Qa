# Como conectar uma IA

O uso de IA é opcional. Claude Code, Codex, GitHub Copilot e Gemini CLI se conectam ao Prumo pelo MCP. Depois de conectada, a IA lê o contexto do projeto, pergunta ao Prumo Orchestrator e propõe casos, bugs e aprendizados como rascunho. O Prumo confere as permissões e você decide se autoriza cada ação.

O servidor MCP roda neste computador. O cliente de IA inicia o processo e se comunica com ele diretamente; não há um servidor remoto do Prumo. O Prumo precisa estar aberto e com você conectado: ao sair da conta ou fechar o aplicativo, a IA perde o acesso aos seus dados.

## Conectar

Abra **Agentes › IA e regras › Conectar IA** (ou **Projetos › Contas e permissões › IA por MCP**). Escolha a IA. Cada uma mostra seu estado: **Não instalada**, **Pronta para conectar**, **Conectada**, **Conectada e em uso** ou **Precisa de atenção**. Siga os quatro passos; o que falta aparece em destaque.

1. **Instalar**: se a IA não estiver no computador, copie o comando do npm (`npm.cmd install -g …` no Windows), rode no terminal e entre na sua conta pelo próprio cliente.
2. **Conectar**: **Conectar ao Prumo** pede confirmação em uma caixa do aplicativo e roda o `mcp add` do próprio cliente, no escopo do seu usuário, sem sobrescrever um servidor com o mesmo nome. Se preferir, **Prefiro copiar o comando** mostra o comando para o terminal. Depois, feche e abra a IA de novo.
3. **Testar**: **Testar conexão** confere se o servidor do Prumo responde.
4. **Usar**: na sua IA, peça algo como "Use o Prumo e leia o contexto deste projeto" ou "Pergunte ao Orchestrator do Prumo como está a regressão". Clique num exemplo para copiá-lo. A chamada aparece em **Última chamada** e em **Logs**.

Se o Gemini CLI recusar o login com conta pessoal do Google, defina a variável `GEMINI_API_KEY` antes de abri-lo.

## Regras

Em **Agentes › IA e regras › Minhas regras** você escreve regras só suas: uma **para todos os agentes** e, se quiser, uma **para cada agente**. Elas valem no chat do Prumo e em qualquer IA conectada (a IA as recebe em `contexto_projeto` e `listar_politicas`), nunca passam para outra conta e nunca liberam permissões. As **Regras do projeto** (especializações e permissões) valem para todas as pessoas e IAs, e só o Admin altera.

## Estados

- **NÃO CONFIGURADO**: o cliente não tem a configuração do Prumo.
- **CONFIGURADO**: a configuração existe, mas não foi testada nem usada.
- **VALIDADO**: o Testar conexão passou.
- **UTILIZADO**: o cliente fez pelo menos uma chamada.
- **ERRO**: o último teste falhou, há registro inválido ou não foi possível inspecionar a configuração. Falha na inspeção nunca vira "não configurado".

**Testar conexão** inicia o servidor do Prumo, confirma que a conexão MCP funciona e consulta apenas as evidências. Isso verifica o servidor local, mas não confirma que a sua IA o usou. Nenhum teste do projeto é executado.

O próprio cliente informa seu nome nos registros; o Prumo não confirma essa identidade. **Detalhes técnicos** mostra o arquivo de configuração, o comando e o último teste, mas não confirma que a IA seguiu as instruções.

## Skill de QA

A Skill de QA ensina a IA a apoiar o trabalho de qualidade. Instale-a conforme o README. Alguns clientes exigem que você a inicie: no Codex, use `$qa`; no Claude Code, use `/qa`.

As políticas de aprovação do cliente de IA continuam valendo; o Prumo não as contorna.
