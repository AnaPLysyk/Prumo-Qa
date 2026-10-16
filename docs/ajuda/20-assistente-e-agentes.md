# Assistente, agentes e conhecimento

O assistente usa os dados deste computador. Ele só guarda aprendizados que você aprovar e não ganha permissões novas durante uma conversa.

## Início e chat

O Início e o chat (flutuante ou lateral) usam os mesmos agentes. A conversa guarda até seis trocas de mensagens por projeto e é apagada quando a janela fecha. Em **Agente automático**, você pode escolher outro agente se o selecionado não for o mais adequado.

Sem conectar uma IA externa, o assistente consulta os dados locais, mostra as fontes e sugere próximos passos. Ele não acessa a internet. Uma resposta do chat nunca significa que um teste foi executado.

## Claude Code e Codex no chat

Claude Code e Codex são opcionais. O chat só os usa se você autorizar em **Configurações** e se o programa estiver instalado. Ele pede uma resposta, sem ferramentas, MCP ou hooks. A resposta informa sua origem. Sem autorização ou sem o programa, o chat usa os dados locais e avisa.

O MCP é o caminho inverso: Claude e Codex chamando o Prumo.

## Perfil e conhecimento

Na primeira conversa, o Prumo pergunta como chamar você e qual é o seu papel. O perfil e os aprendizados ficam em `conhecimento.db`, na pasta de dados do Prumo. O histórico do chat guarda apenas qual agente foi usado, o modo e as fontes — não guarda as perguntas nem as respostas.

Todo aprendizado sugerido por uma conversa ou por uma IA começa como rascunho. Você pode aprová-lo ou descartá-lo no chat ou no **Cérebro** do agente. **Útil** e **Não ajudou** registram sua avaliação.

## Agentes

A tela mostra o **Prumo Orchestrator**, os clientes Codex e Claude Code conectados por MCP e as oito especializações. Cada agente tem:

- **Configuração**: liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills**: instruções curtas para os agentes. Só as aprovadas são enviadas ao Claude Code ou ao Codex, conforme a pergunta (até 8 KB). Ao importar uma pasta de Skill, o Prumo aceita apenas licenças abertas; cada trecho começa como rascunho e nenhum script é executado.
- **Cérebro**: tudo o que o agente consulta, agrupado por cor. **Testar uma pergunta** mostra que agente responderia e por quê, sem chamar IA e sem gravar nada.

**Nova prévia** cria uma simulação de agente personalizada neste computador (até 50 por projeto). Não cria um agente real nem inicia um processo.

## Painel de atividades

Em **Agentes › Painel de atividades**, um diagrama mostra os clientes MCP, o Orchestrator, o worker, as ferramentas e as operações. Cada linha vem de um registro; o Prumo não supõe o que aconteceu. Um registro de início sem registro de término não prova que o processo ainda está rodando.

Arraste o diagrama para movê-lo. Use Ctrl + roda do mouse ou pinça para aproximar; no teclado, use as setas, `+`, `-` e `0`. **Ao vivo** atualiza a cada 3 segundos enquanto a aba estiver visível.

## Orquestração

Se uma pergunta envolver duas ou mais especialidades e você não escolher um agente, o Orchestrator consulta cada uma e reúne as respostas. Em **Orquestrações**, você vê quais agentes participaram, a ordem, a duração e eventuais falhas. As perguntas e respostas não são gravadas.

## Pelo MCP

O servidor MCP oferece instruções para cada especialidade e a ferramenta `propor_aprendizado`, que só cria rascunhos e tem um limite de uso por hora. Um aprendizado aprovado só é enviado a uma IA externa se o compartilhamento estiver autorizado no projeto. Documentos e aprendizados são conteúdo, não comandos.

## Limites

Claude e Codex dependem da sua conta, de o programa estar instalado e da sua autorização. O assistente local não interpreta requisitos como uma IA; ele procura e mostra as informações registradas.
