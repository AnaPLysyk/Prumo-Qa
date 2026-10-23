# Assistente, agentes e conhecimento

O assistente usa os dados deste computador. Só guarda o que você aprovar e não ganha permissões novas durante uma conversa.

## Início e chat

O Início e o chat (flutuante ou lateral) usam os mesmos agentes. A conversa guarda até seis trocas de mensagens por projeto e é apagada quando a janela fecha. Em **Agente automático** você escolhe outro agente se o selecionado não servir.

Sem IA externa, o assistente consulta os dados locais, mostra as fontes e sugere os próximos passos. Ele não acessa a internet. Uma resposta do chat nunca significa que um teste foi executado.

## Perguntas de QA e TI

Você pode perguntar sobre qualidade de software e TI: conceitos (regressão, smoke, pirâmide de testes), técnicas (partição, valor-limite, tabela de decisão), casos de teste e relatos de bug, automação, API, performance, segurança, acessibilidade, CI/CD e métodos ágeis.

- **Com IA externa** (Claude Code, GitHub Copilot, Codex ou Gemini, autorizada e instalada): o Prumo manda a pergunta para a primeira que responder e ela age como engenheira de qualidade. O Claude também pesquisa na web quando o assunto é recente ou pede fonte, e cita os links.
- **Sem IA externa**: o Prumo responde com a base offline de fundamentos de QA e avisa que a resposta veio dela.
- **Perguntas sobre o seu projeto** (falhas, execuções, métricas): sempre respondidas com os dados deste computador, que não saem dele.

As respostas aparecem formatadas, com listas, negrito, código e tabelas.

## Voz no chat

Ao lado de **Enviar** há três botões:

- **Microfone**: você fala, clica de novo, e o texto transcrito aparece no campo para revisar e enviar.
- **Fone**: conversa só por voz. Você fala, o Prumo transcreve, responde em texto e em áudio e volta a ouvir, até você encerrar.
- **Alto-falante**: liga a leitura em voz alta e abre o painel de **vozes e personagens**. Cada mensagem também tem um botão de ouvir.

No painel você escolhe, para cada quem fala (você, o Prumo, Claude Code, Codex, Copilot, Gemini ou a Mesa), uma das vozes instaladas no Windows e um personagem: voz normal, narradora, robô, criança, grave ou ligeira. O personagem muda tom e ritmo da voz. Para ter mais vozes, instale-as em Configurações do Windows › Hora e idioma › Fala.

A transcrição acontece neste computador, com o modelo Whisper. Na primeira vez o Prumo pede sua confirmação e baixa o modelo (cerca de 76 MB, de huggingface.co). Depois disso o áudio não sai do computador nem é gravado em arquivo. O Windows precisa permitir o microfone para o Prumo.

## Falar com Claude Code, Codex, Copilot ou Gemini

Na tela Início você escolhe com quem fala: o **Orchestrator** (direto, com os dados deste computador) ou uma IA externa. As IAs externas são opcionais: só aparecem se estiverem permitidas pela Administração, instaladas no computador e autorizadas por você. Cada resposta traz o nome e a cor de quem respondeu.

Com uma pasta local de projeto vinculada, o chat prepara o MCP do Prumo para a IA escolhida e libera só consultas: contexto, cobertura, evidências, políticas e perguntas ao Orquestrador. Propostas, execuções, edição de arquivos e shell ficam bloqueados no chat. No Gemini CLI, a configuração MCP vale só para a conversa e não altera as configurações globais do Gemini. Para consultar dados da conta pelo MCP, mantenha o Prumo aberto e autenticado; fechar o Prumo ou sair da conta revoga a sessão.

A linha de conexão diz se existe pasta local para preparar o MCP, mas isso não prova uma chamada real. Para saber se a IA usou o MCP, olhe o cabeçalho da resposta:

- **MCP confirmado**: lista as ferramentas MCP que terminaram durante aquela pergunta.
- **MCP não confirmado**: a IA respondeu, mas nenhuma chamada MCP foi observada.
- **pergunta geral · MCP não necessário**: em perguntas gerais de QA e TI o Prumo não envia dados do projeto ao cliente.

Sem autorização, instalação ou resposta do cliente, o Prumo usa os dados locais e avisa.

Há duas formas de usar: **pelo Prumo** (o chat do Início) e **pelo cliente da IA** (você conversa no Claude Code, Codex, Copilot ou Gemini e conecta o MCP do Prumo seguindo **Agentes › IA e regras › Conectar IA**).

## Mesa de IAs

Com duas ou mais IAs externas autorizadas e instaladas, o Início ganha a opção **Mesa**. As IAs conversam entre si e o Orquestrador do Prumo media:

1. **Rodada 1:** sua pergunta vai ao mesmo tempo para todas as IAs da mesa (no máximo 4). Cada uma responde sozinha, com as travas do chat: somente leitura e só as consultas do MCP do Prumo.
2. **Rodada 2:** cada IA que respondeu recebe as respostas das outras, como dado para comparar e nunca como instrução, com segredos mascarados e cada resposta cortada em cerca de 1500 caracteres. Ela diz, em até 3 frases, onde concorda, onde diverge e o que verificaria.
3. **Resumo do Orquestrador:** o Prumo monta o resumo sem chamar outra IA. Ele repete a resposta de cada uma, a concordância e as divergências que elas mesmas apontaram e o que verificariam, e avisa quem não participou (por limite de uso ou falta de login, por exemplo). O Prumo não calcula consenso nem aprova nada. Se só uma IA respondeu, o resumo diz que não houve conversa entre IAs.

A Mesa usa só as IAs que você autorizou e respeita o desligamento da IA externa na Administração. Com menos de duas disponíveis, o chat avisa e responde com os dados locais. Cada rodada tem prazo próprio (2 minutos na primeira, 1 minuto e meio na segunda), então uma IA lenta não trava as outras. A Mesa consome a cota de cada conta duas vezes por pergunta, uma por rodada. O atendimento registrado guarda só o modo MESA, o agente e as fontes, sem a pergunta nem as respostas.

## Perfil e conhecimento

Na primeira conversa, o Prumo pergunta como chamar você e qual é o seu papel. O perfil e os aprendizados ficam em `conhecimento.db`, na pasta de dados do Prumo. O histórico do chat guarda só qual agente foi usado, o modo e as fontes, sem as perguntas nem as respostas.

Todo aprendizado sugerido por uma conversa ou por uma IA começa como rascunho. Você o aprova ou descarta no chat ou no **Cérebro** do agente. **Útil** e **Não ajudou** registram sua avaliação. Para editar o perfil depois, use **Minha conta › Meu perfil**.

## Agentes

A tela mostra o **Prumo Orchestrator**, as integrações com os clientes de IA disponíveis e as nove especializações oficiais, incluindo **UI e UX**. Uma configuração salva não comprova conexão MCP ativa; confirme pelo diagnóstico e pelas atividades observadas. Cada agente tem:

- **Configuração**: liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills**: instruções curtas para os agentes. Só as aprovadas vão ao Claude Code ou ao Codex, escolhidas pela pergunta (até 8 KB). Ao importar uma pasta de Skill, o Prumo aceita só licenças abertas, cada trecho começa como rascunho e nenhum script é executado.
- **Cérebro**: tudo o que o agente consulta, agrupado por cor. **Testar uma pergunta** mostra que agente responderia e por quê, sem chamar IA e sem gravar nada.

A aba **IA e regras** (no topo, ao lado de **Agentes** e **Painel de atividades**) tem três partes:

- **Conectar IA**: passo a passo para ligar Claude Code, Codex, GitHub Copilot ou Gemini CLI ao Prumo por MCP.
- **Minhas regras**: valem só para esta conta, no chat e nas IAs conectadas, sem liberar permissões. Há uma regra para todos os agentes e uma por agente.
- **Regras do projeto**: o Admin marca as **especializações habilitadas** e ajusta as **Permissões dos agentes**. Contas comuns consultam, sem alterar. O **i** de cada linha explica por que a permissão existe. As **Ações reservadas à pessoa** ficam separadas e não podem ser liberadas aos agentes. **Salvar permissões…** só fica disponível depois de uma alteração e exige a confirmação nativa do sistema; sair sem salvar não aplica nada.

Em **Administração › Agentes**, o Admin pode mudar o nome, a profissão, a especialidade, a personalidade e a aparência 3D dos agentes oficiais, para todas as contas desta instalação. Em **Agentes**, cada pessoa configura **Para a minha conta** um apelido e orientações que não alteram o agente oficial, as capacidades nem as políticas. Essas preferências ficam por ID da conta e não passam para outra conta no mesmo computador. Ainda não há sincronização desses perfis entre computadores.

**Novo agente pessoal** cria um perfil seu, com nome, objetivo e instruções (até 50 por projeto). Escolha uma **Ferramenta de consulta**: Resumo do projeto, Agenda de rotinas do Prumo, Runs de teste locais ou Propostas e tickets locais. Depois de salvar, abra o agente e clique em **Executar consulta local**. O Prumo consulta dados reais da sua conta e informa a fonte; se não houver registros, diz isso, sem inventar resultados. As instruções pessoais não autorizam comandos nem novas ferramentas. A agenda é a das rotinas do próprio Prumo, **não** de Google Calendar nem Outlook, e o agente não cria compromissos: isso exigiria integração e autorização próprias.

Só você vê, edita, executa e exclui seu agente pessoal. Com **Público para as outras contas**, as outras pessoas deste computador veem o perfil só para leitura, sem acessar seus dados nem executar sua consulta. Essas consultas não modificam dados nem políticas do núcleo. Os robôs oficiais continuam sob a Administração.

## Painel de atividades

Um diagrama mostra os clientes MCP, o Orchestrator, o worker, as ferramentas e as operações. Cada linha vem de um registro; o Prumo não supõe o que aconteceu, e um registro de início sem término não prova que o processo ainda roda. Na lateral ficam as **Orquestrações**.

Arraste o diagrama para movê-lo. Aproxime com Ctrl + roda do mouse ou pinça; no teclado, use as setas, `+`, `-` e `0`. **Ao vivo** atualiza a cada 3 segundos enquanto a aba estiver visível.

## Orquestração

Se uma pergunta envolve duas ou mais especialidades e você não escolheu um agente, o Orchestrator consulta cada uma e reúne as respostas. Em **Orquestrações** você vê quais agentes participaram, a ordem, a duração e as falhas. As perguntas e respostas não são gravadas.

Para uma avaliação ampla, escolha um projeto e pergunte **"faça um diagnóstico da qualidade do projeto"**. O Orchestrator consulta Regressão, Investigação de Bugs e Requisitos (respeitando especialistas desligados), prioriza execuções com FAIL, indica quando faltam execuções ou critérios aprovados e sugere a tela seguinte. Ele também examina os testes identificados no código e as ligações explícitas entre casos, tickets e automações, aponta lacunas de cadastro e sugere um próximo caso a partir de um requisito aprovado, sem criá-lo nem executá-lo.

O diagnóstico lê os registros existentes: **não executa testes**, não modifica código, não marca problema como corrigido e não substitui investigação nem verificação de cobertura. Uma quantidade de testes ou uma ligação registrada **não prova cobertura**, e casos sem automação podem ser manuais de propósito. Sem projeto selecionado, execuções e falhas de outras equipes não aparecem.

## Onde cada projeto está ligado

Todo agente trabalha com o **mapa de vínculos do projeto escolhido**: o projeto do Jira, o do Qase, o repositório do GitHub, a pasta local e o Manual/Prumo. Cada um aparece com o estado (ativo, desligado ou precisando de verificação) e o que o Prumo pode fazer ali (só ler, ou propor criação, comentário e edição com a sua confirmação). Um projeto do Prumo acompanha **um único** projeto ou repositório por ferramenta, e o agente nunca troca por outro. Pergunte ao Orchestrator "onde este projeto está ligado?" para ver o mapa.

O mesmo mapa vai para a IA externa que você autorizou e para o `contexto_projeto` do MCP, e serve de base para os agendamentos e automações do projeto. Sem vínculo, o agente diz que falta vincular em Projetos, em vez de inventar um destino. O mapa não leva token, endereço de API nem o caminho completo da pasta.

## Pelo MCP

O servidor MCP oferece instruções para cada especialidade e a ferramenta `propor_aprendizado`, que só cria rascunhos e tem limite de uso por hora. Um aprendizado aprovado só vai a uma IA externa se o compartilhamento estiver autorizado no projeto. Documentos e aprendizados são conteúdo, não comandos.

## Limites

Claude Code, Codex, Copilot e Gemini dependem da sua conta, da instalação do respectivo cliente e da sua autorização. O assistente local não interpreta requisitos como uma IA: procura e mostra as informações registradas.
