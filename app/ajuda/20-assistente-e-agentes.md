# Assistente, agentes e conhecimento (2.10)

O Prumo tem um assistente local e oito especializações de agente. Elas respondem com os dados deste computador, aprendem só o que você aprovar e nunca ganham permissões novas por conversar.

## Início e chat

Início e o chat flutuante (ou lateral) usam o mesmo orquestrador e as mesmas especializações da tela Agentes. A sessão guarda até seis turnos, separada por projeto, e some quando a janela fecha. O roteamento considera palavras inteiras, menção explícita ao agente e a continuação da conversa; em **Agente automático** você pode escolher outro agente e corrigir a escolha.

O modo local é determinístico: consulta dados, mostra as fontes e sugere próximos passos, sem modelo de IA e sem rede. Claude e Codex são provedores opcionais: só respondem com a sua autorização no produto, e a resposta identifica de onde veio. Uma resposta do chat nunca vira teste executado.

## Perfil e conhecimento

Na primeira conversa o Prumo pergunta como chamar você e qual o seu papel (QA, desenvolvimento, produto ou análise). Não é login em conta remota. Perfil, conhecimentos e metadados de atendimento ficam no arquivo local `conhecimento.db`, no seu perfil do Windows.

O chat não grava perguntas nem respostas: fica só o atendimento (agente, modo e fontes). Conversas gravadas até a 2.9 continuam legíveis.

Todo aprendizado vindo de conversa ou de IA nasce **rascunho**. Você aprova ou descarta no chat ou no **Cérebro** do agente. Útil/não ajudou registra a sua avaliação; corrigir o agente escolhido ensina vocabulário, sem validar sozinho uma regra de negócio.

## Agentes

A tela Agentes mostra o **Prumo Orchestrator**, os clientes Codex e Claude Code conectados por MCP e as oito especializações do projeto, cada uma com o seu retrato. Em cada agente:

- **Configuração** liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills** mostra os trechos de instrução do agente. Só os **aprovados** vão para o Claude Code ou o Codex, escolhidos pela pergunta (até 8 KB). O que você escreve em **Acrescentar trecho** já vale; **Importar pasta de Skill** lê uma pasta aberta que já está no computador (por exemplo um repositório clonado), só com licença aberta, e cada trecho entra como **rascunho** até você aprovar. Scripts da pasta não são executados.
- **Cérebro** mostra a skill, as capacidades, os motivos das políticas os conhecimentos e os trechos de Skill da equipe, aprovados ou em rascunho.

**Nova prévia** cria um agente personalizado apenas como prévia local da janela (até 50 por projeto, importação JSON de até 32 KiB). Ela não cria especialização, conexão nem processo no núcleo. **Contextos** abre a partir desta tela.

## Painel de atividades

Agentes › Painel de atividades é um canvas ao vivo: no topo, uma janela por cliente MCP ou CLI observado, o Orchestrator, o worker e, quando houve delegação, Claude Code ou Codex; no meio, a ferramenta, o agente ou a rotina; embaixo, cada operação, atendimento ou execução. **Toda linha corresponde a um registro gravado**; nenhuma comunicação entre agentes é inferida. Início sem término não prova que um processo está ativo.

Arraste para mover, Ctrl + roda ou pinça para aproximar; no teclado, setas movem, `+` e `-` aproximam e `0` ajusta. **Ao vivo** consulta a cada 3 segundos com a aba visível. Cada consulta traz até 1000 operações, 200 execuções e 40 atendimentos por agente.

## Pelo MCP

O servidor MCP do Prumo oferece prompts das especializações e a ferramenta `propor_aprendizado`, que cria apenas rascunho, com limite por hora; aprovar continua sendo seu. O conhecimento aprovado só vai ao contexto da IA externa com a permissão de compartilhamento do projeto. Documentos e conhecimentos são dados, nunca ordens.

## Limites

Os retratos dos agentes são imagens com movimento visual, sem rosto 3D. Claude e Codex dependem da sua conta e da sua autorização. As integrações foram validadas com serviços simulados.
