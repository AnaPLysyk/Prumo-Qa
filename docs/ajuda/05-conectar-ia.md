# Como conectar uma IA

Eu deixei a IA como opcional: Claude Code e Codex chamam o Prumo pelo MCP (Model Context Protocol), e quem decide o que pode ser feito continua sendo o Prumo e você.

O servidor MCP é local, por stdio: o próprio cliente de IA inicia o processo, que conversa só com ele. Não existe servidor remoto, e fechar a janela do Prumo não encerra sessões já iniciadas.

## Conectar

1. Selecione um projeto com pasta e qa.project.json.
2. Em **Conexões › IA por MCP**, clique **Configurar e testar** na linha do Claude Code ou do Codex.
3. Adicione a configuração:
   - **Codex** (quando o cliente é localizado): **Adicionar ao Codex…** pede confirmação nativa e não sobrescreve uma configuração com o mesmo nome.
   - **Claude Code**: em **Ver o que será configurado**, revise destino e comando e execute-o no terminal (PowerShell no Windows).
4. Feche e reabra o cliente de IA.
5. Clique **Testar integração** e, no cliente, peça algo como "consulte o contexto do projeto". A chamada aparece em Última chamada observada e em Logs.

## Estados

- **NÃO CONFIGURADO**: o cliente não tem a configuração do Prumo.
- **CONFIGURADO**: a configuração existe, mas não foi testada nem usada.
- **VALIDADO**: o Testar integração passou.
- **UTILIZADO**: o cliente fez pelo menos uma chamada.
- **ERRO**: o último teste falhou, há registro inválido ou não foi possível inspecionar a configuração. Falha na inspeção nunca vira "não configurado".

**Testar integração** inicia o servidor do Prumo com o SDK MCP oficial, faz o handshake, confere as ferramentas e chama só consultar_evidencias. Comprova o servidor local; não comprova uso pelo Claude ou Codex e não executa testes do projeto.

O nome do cliente nos registros é declarado por ele mesmo, não autenticado. As referências de contexto em Detalhes técnicos mostram o que foi entregue, não provam que o agente obedeceu.

## Skill de QA

A Skill de QA orienta o método de qualidade da IA. Instale conforme o README; nem todo cliente a reconhece sozinho: no Codex invoque $qa e, no Claude Code, /qa.

As políticas de aprovação do cliente de IA continuam valendo; o Prumo não as contorna.
