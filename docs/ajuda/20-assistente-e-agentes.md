# Assistente, agentes e conhecimento

Eu quis um assistente que responda com os dados deste computador, aprenda só o que você aprova e não ganhe permissão nova por conversar.

## Início e chat

O Início e o chat (flutuante ou lateral) usam o mesmo orquestrador e as oito especializações da tela Agentes. A conversa guarda até seis turnos por projeto e some quando a janela fecha. Em **Agente automático** você escolhe outro agente se a rota não for a certa.

Sem IA externa, o assistente consulta os dados, mostra as fontes e sugere próximos passos, sem rede. Uma resposta do chat nunca vira teste executado.

## Claude Code e Codex no chat

São opcionais e só respondem se você autorizar em **Configurações**. O chat chama o programa instalado aqui, só para pedir uma resposta: sem ferramentas, sem MCP e sem hooks. A resposta diz de onde veio. Sem autorização ou sem o programa, o chat responde com os dados locais e avisa.

O MCP é o caminho inverso: Claude e Codex chamando o Prumo.

## Perfil e conhecimento

Na primeira conversa o Prumo pergunta como chamar você e qual o seu papel. Perfil e conhecimentos ficam em conhecimento.db, na pasta de dados do Prumo. Do chat fica só o atendimento (agente, modo e fontes), nunca perguntas nem respostas.

Todo aprendizado vindo de conversa ou de IA nasce rascunho. Você aprova ou descarta no chat ou no **Cérebro** do agente. **Útil** e **Não ajudou** registram a sua avaliação.

## Agentes

A tela mostra o **Prumo Orchestrator**, os clientes Codex e Claude Code conectados por MCP e as oito especializações. Cada agente tem:

- **Configuração**: liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills**: trechos de instrução. Só os aprovados vão para o Claude Code ou o Codex, escolhidos pela pergunta (até 8 KB). Importar uma pasta de Skill aceita só licença aberta; cada trecho entra como rascunho e nenhum script da pasta roda.
- **Cérebro**: tudo o que o agente consulta, agrupado por cor. **Testar uma pergunta** mostra que agente responderia e por quê, sem chamar IA e sem gravar nada.

**Nova prévia** cria um agente personalizado só como prévia local (até 50 por projeto); não cria especialização nem processo.

## Painel de atividades

Em **Agentes › Painel de atividades**, um canvas mostra clientes MCP, Orchestrator, worker, ferramentas e operações. Cada linha vem de um registro gravado; nada é inferido. Um início sem término não prova que o processo está ativo.

Arraste para mover; Ctrl + roda ou pinça para aproximar; no teclado, setas, `+`, `-` e `0`. **Ao vivo** atualiza a cada 3 segundos com a aba visível.

## Orquestração

Quando a pergunta toca duas ou mais especialidades e você não escolheu agente, o orquestrador consulta cada uma e junta as respostas. Em **Orquestrações**, no painel, aparecem quem participou, a ordem, o tempo e o que falhou. Pergunta e respostas não são gravadas.

## Pelo MCP

O servidor MCP oferece prompts das especializações e a ferramenta propor_aprendizado, que só cria rascunho, com limite por hora. O conhecimento aprovado só vai à IA externa com a permissão de compartilhamento do projeto. Documentos e conhecimentos são dados, nunca ordens.

## Limites

Claude e Codex dependem da sua conta, do programa instalado e da sua autorização. O assistente local não interpreta requisitos como uma IA: ele busca e mostra o que está registrado.
