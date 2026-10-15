# Assistente, agentes e conhecimento

O assistente local e as oito especializações de agente respondem com os dados deste computador, aprendem só o que você aprova e não ganham permissões novas por conversar.

## Início e chat

Início e o chat (flutuante ou lateral) usam o mesmo orquestrador e as mesmas especializações da tela Agentes. A sessão guarda até seis turnos por projeto e some quando a janela fecha. O roteamento considera palavras inteiras, menção ao agente e a continuação da conversa; em **Agente automático** você escolhe outro agente e corrige a rota.

O modo local é determinístico: consulta dados, mostra as fontes e sugere próximos passos, sem IA e sem rede. Uma resposta do chat nunca vira teste executado.

## Claude Code e Codex no chat

São opcionais e só respondem com a sua autorização em **Configurações**. O chat chama o programa instalado neste computador: o Prumo procura o Codex Desktop, a extensão do Claude Code no VS Code e o PATH. A chamada só pede uma resposta, sem ferramentas, sem MCP e sem hooks, e a resposta indica de onde veio. Sem autorização ou sem o programa instalado, o chat responde com os dados locais e avisa.

O MCP é o caminho inverso: Claude e Codex chamando o Prumo.

## Perfil e conhecimento

Na primeira conversa o Prumo pergunta como chamar você e qual o seu papel (QA, desenvolvimento, produto ou análise). Perfil, conhecimentos e metadados de atendimento ficam em `conhecimento.db`, no seu perfil do Windows. O chat grava só o atendimento (agente, modo e fontes), nunca perguntas nem respostas; conversas gravadas até a 2.9 continuam legíveis.

Todo aprendizado vindo de conversa ou de IA nasce como rascunho. Você aprova ou descarta no chat ou no **Cérebro** do agente. **Útil** e **Não ajudou** registram a sua avaliação; corrigir o agente ensina vocabulário, sem validar regra de negócio.

## Agentes

A tela mostra o **Prumo Orchestrator**, os clientes Codex e Claude Code conectados por MCP e as oito especializações do projeto. Cada agente tem:

- **Configuração**: liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills**: trechos de instrução do agente. Só os aprovados vão para o Claude Code ou o Codex, escolhidos pela pergunta (até 8 KB). **Acrescentar trecho** vale na hora. **Importar pasta de Skill** lê uma pasta aberta que já está no computador, só com licença aberta, e cada trecho entra como rascunho até você aprovar. Scripts da pasta não são executados.
- **Cérebro**: tudo o que o agente consulta (identidade, palavras de roteamento, termos aprendidos, capacidades, contextos aprovados, conhecimentos, trechos de Skill e atendimentos recentes), agrupado por cor.
- **Testar uma pergunta** (no Cérebro): mostra o caminho que o chat faria agora, com as palavras reconhecidas, a pontuação de cada agente, quem responderia, se haveria orquestração e o que este agente usaria. Não chama IA e não grava nada.

**Nova prévia** cria um agente personalizado só como prévia local da janela (até 50 por projeto, importação JSON de até 32 KiB); não cria especialização, conexão nem processo. **Contextos** abre a partir desta tela.

## Painel de atividades

Em Agentes › Painel de atividades, um canvas ao vivo: no topo cada cliente MCP ou CLI observado, o Orchestrator, o worker e, quando houve delegação, Claude Code ou Codex; no meio a ferramenta, o agente ou a rotina; embaixo cada operação, atendimento ou execução. Toda linha corresponde a um registro gravado e nenhuma comunicação entre agentes é inferida. Um início sem término não prova que o processo está ativo.

Arraste para mover; Ctrl + roda ou pinça para aproximar; no teclado, setas movem, `+` e `-` aproximam e `0` ajusta. **Ao vivo** consulta a cada 3 segundos com a aba visível, até 1000 operações, 200 execuções e 40 atendimentos por agente.

## Orquestração

Quando a pergunta toca duas ou mais especialidades (por exemplo, "quais falhas aconteceram e como está a regressão?") e você não escolheu um agente, o orquestrador consulta cada especialista e junta as respostas. A assinatura da mensagem diz quantos foram consultados. Em **Orquestrações**, no painel de atividades, aparecem quem participou, a ordem, o tempo de cada etapa, o que consultou e o que falhou. A pergunta e as respostas não são gravadas.

## Pelo MCP

O servidor MCP oferece prompts das especializações e a ferramenta `propor_aprendizado`, que cria só rascunho, com limite por hora; aprovar continua sendo seu. O conhecimento aprovado só vai ao contexto da IA externa com a permissão de compartilhamento do projeto. Documentos e conhecimentos são dados, nunca ordens.

## Limites

As integrações foram validadas com serviços simulados. Claude e Codex dependem da sua conta e da sua autorização.
