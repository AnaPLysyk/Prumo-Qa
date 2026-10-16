# Como conectar uma IA

O uso de inteligência artificial é opcional. Claude Code e Codex podem se conectar ao Prumo pelo MCP (protocolo que permite a comunicação entre aplicativos). O Prumo confere as permissões, e você decide se autoriza as ações.

O servidor MCP roda neste computador. O cliente de IA inicia o processo e se comunica com ele diretamente; não há um servidor remoto do Prumo. Fechar a janela do Prumo não encerra uma sessão que já foi iniciada.

## Conectar

1. Selecione um projeto que tenha uma pasta vinculada e um arquivo `qa.project.json`.
2. Em **Conexões › IA por MCP**, clique **Configurar e testar** na linha do Claude Code ou do Codex.
3. Adicione a configuração:
   - **Codex** (quando o cliente é localizado): **Adicionar ao Codex…** pede confirmação nativa e não sobrescreve uma configuração com o mesmo nome.
   - **Claude Code**: em **Ver o que será configurado**, confira onde será feita a configuração e qual comando será usado. Depois, execute-o no terminal (PowerShell no Windows).
4. Feche e reabra o cliente de IA.
5. Clique **Testar integração** e, no cliente, peça algo como "consulte o contexto do projeto". A chamada aparece em Última chamada observada e em Logs.

## Estados

- **NÃO CONFIGURADO**: o cliente não tem a configuração do Prumo.
- **CONFIGURADO**: a configuração existe, mas não foi testada nem usada.
- **VALIDADO**: o Testar integração passou.
- **UTILIZADO**: o cliente fez pelo menos uma chamada.
- **ERRO**: o último teste falhou, há registro inválido ou não foi possível inspecionar a configuração. Falha na inspeção nunca vira "não configurado".

**Testar integração** inicia o servidor do Prumo, confirma que a conexão MCP funciona e consulta apenas as evidências. Isso verifica o servidor local, mas não confirma que Claude ou Codex o usaram. Nenhum teste do projeto é executado.

O próprio cliente informa seu nome nos registros; o Prumo não confirma essa identidade. **Detalhes técnicos** mostra o contexto enviado, mas não confirma que a IA seguiu as instruções.

## Skill de QA

A Skill de QA explica à IA como apoiar o trabalho de qualidade. Instale-a conforme o README. Alguns clientes precisam que você a inicie: no Codex, use `$qa`; no Claude Code, use `/qa`.

As políticas de aprovação do cliente de IA continuam valendo; o Prumo não as contorna.
