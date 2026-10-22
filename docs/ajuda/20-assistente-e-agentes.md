# Assistente, agentes e conhecimento

O assistente usa os dados deste computador. Ele só guarda aprendizados que você aprovar e não ganha permissões novas durante uma conversa.

## Início e chat

O Início e o chat (flutuante ou lateral) usam os mesmos agentes. A conversa guarda até seis trocas de mensagens por projeto e é apagada quando a janela fecha. Em **Agente automático**, você pode escolher outro agente se o selecionado não for o mais adequado.

Sem conectar uma IA externa, o assistente consulta os dados locais, mostra as fontes e sugere próximos passos. Ele não acessa a internet. Uma resposta do chat nunca significa que um teste foi executado.

## Perguntas de QA e TI

Pergunte qualquer coisa de qualidade de software e de TI: conceitos (regressão, smoke, pirâmide de testes), técnicas (partição, valor-limite, tabela de decisão), como escrever casos e relatos de bug, automação, API, performance, segurança, acessibilidade, CI/CD e métodos ágeis. Se você conectou e autorizou uma IA (Claude Code, GitHub Copilot, Codex ou Gemini), o Prumo manda a pergunta para a primeira que responder e ela age como engenheiro de qualidade; o Claude também pesquisa na web quando o assunto é recente ou pede fonte, e cita os links. Sem nenhuma IA disponível, o Prumo responde com a base offline de fundamentos de QA e avisa que a resposta é dela. Perguntas sobre o seu projeto (falhas, execuções, métricas) continuam sendo respondidas com os dados deste computador, sem sair dele. As respostas aparecem formatadas, com listas, negrito, código e tabelas.

## Voz no chat

Ao lado de **Enviar**, o campo de conversa tem três botões. **Microfone**: você fala, clica de novo, e o texto transcrito aparece no campo para você revisar e enviar. **Fone**: conversa só por voz — você fala, o Prumo transcreve no chat, responde em texto e em áudio e volta a ouvir, até você encerrar. **Alto-falante**: liga a leitura em voz alta das mensagens e abre o painel de **vozes e personagens**. Cada mensagem também tem um botão de ouvir, para escutar só aquela fala.

No painel você escolhe, para cada quem fala (você, o Prumo, Claude Code, Codex, Copilot, Gemini ou a Mesa), uma das vozes instaladas no Windows e um personagem: voz normal, narradora, robô, criança, grave ou ligeira. Os personagens mudam tom e ritmo da voz escolhida. Para ter mais vozes, instale-as em Configurações do Windows › Hora e idioma › Fala.

A transcrição acontece neste computador, com o modelo Whisper. Na primeira vez o Prumo pede sua confirmação e baixa o modelo (cerca de 76 MB, de huggingface.co); depois disso o áudio nunca sai do computador e não é gravado em arquivo. O Windows precisa permitir o microfone para o Prumo.

## Falar com Claude Code, Codex, Copilot ou Gemini

Na tela Início você escolhe com quem fala: o **Orchestrator** (direto, com os dados deste computador) ou uma IA externa. As IAs externas são opcionais: só aparecem se você autorizar em **Configurações > Assistente** e se o programa estiver instalado. Cada resposta traz o nome e a cor de quem respondeu. A linha de conexão informa se existe pasta local para preparar o MCP, mas não comprova uma chamada real. Para consultar dados da conta pelo MCP, mantenha o Prumo aberto e autenticado; fechar ou sair da conta revoga a sessão.

Com uma pasta local de projeto vinculada, o chat prepara o MCP do Prumo para a IA selecionada e permite apenas as consultas (contexto, cobertura, evidências, políticas e pergunta ao Orquestrador). Propostas, execuções, edição de arquivos e shell ficam bloqueados no chat. No Gemini CLI, a configuração MCP é temporária por conversa, não altera as configurações globais do Gemini. A indicação **MCP disponível** não comprova que a IA chamou uma ferramenta; isso aparece nas atividades observadas do projeto. Sem autorização, instalação ou resposta do cliente, o Prumo usa os dados locais e avisa.

Depois de uma resposta externa, o cabeçalho informa **MCP confirmado** e lista as ferramentas MCP que terminaram durante aquela pergunta. Se aparecer **MCP não confirmado**, a IA respondeu, mas não há chamada MCP observada para aquela resposta. Em perguntas gerais de QA e TI, aparece **pergunta geral · MCP não necessário**, porque esse modo não envia os dados do projeto ao cliente. Não trate a disponibilidade da conexão como prova de uso.

Há duas formas de usar: **pelo Prumo** (o chat da tela Início) e **pelo cliente da IA** (você conversa no Claude Code, Codex, Copilot ou Gemini e conecta o MCP do Prumo em Conexões).

## Mesa de IAs

Quando duas ou mais IAs externas estão autorizadas e instaladas, a tela Início ganha a opção **Mesa**. Na Mesa as IAs conversam entre si e o Orquestrador do Prumo media:

1. **Rodada 1:** a sua pergunta vai ao mesmo tempo para todas as IAs da mesa (no máximo 4). Cada uma responde sozinha, com as mesmas travas do chat: somente leitura e só as consultas do MCP do Prumo.
2. **Rodada 2:** cada IA que respondeu recebe as respostas das outras, como dado para comparar e nunca como instrução, com segredos mascarados e cada resposta cortada em cerca de 1500 caracteres. Ela diz em até 3 frases onde concorda, onde diverge e o que verificaria.
3. **Resumo do Orquestrador:** o Prumo monta o resumo sem chamar outra IA. Ele repete a resposta de cada IA, a concordância e as divergências que elas mesmas apontaram e o que verificariam, e avisa quem não participou (por exemplo, por limite de uso ou por falta de login). O Prumo não calcula consenso nem aprova nada; se só uma IA respondeu, o resumo diz que não houve conversa entre IAs.

A Mesa usa só as IAs que você autorizou e respeita o desligamento da IA externa na Administração. Com menos de duas IAs disponíveis, o chat avisa e responde com os dados locais. Cada rodada tem prazo próprio (2 minutos na primeira e 1 minuto e meio na segunda), então uma IA lenta não trava as outras. A Mesa consome a cota de cada conta duas vezes por pergunta (uma por rodada). O atendimento registrado guarda só o modo MESA, o agente e as fontes, sem a pergunta nem as respostas.

## Perfil e conhecimento

Na primeira conversa, o Prumo pergunta como chamar você e qual é o seu papel. O perfil e os aprendizados ficam em `conhecimento.db`, na pasta de dados do Prumo. O histórico do chat guarda apenas qual agente foi usado, o modo e as fontes — não guarda as perguntas nem as respostas.

Todo aprendizado sugerido por uma conversa ou por uma IA começa como rascunho. Você pode aprová-lo ou descartá-lo no chat ou no **Cérebro** do agente. **Útil** e **Não ajudou** registram sua avaliação.

## Agentes

A tela mostra o **Prumo Orchestrator**, as integrações com os clientes de IA disponíveis e as nove especializações oficiais, incluindo **UI e UX**. Uma configuração salva não comprova conexão MCP ativa; confirme pelo diagnóstico e pelas atividades observadas. Cada agente tem:

- **Configuração**: liga ou desliga a especialização e define o que a IA pode pedir. O bloqueio vale no servidor MCP a cada chamada.
- **Skills**: instruções curtas para os agentes. Só as aprovadas são enviadas ao Claude Code ou ao Codex, conforme a pergunta (até 8 KB). Ao importar uma pasta de Skill, o Prumo aceita apenas licenças abertas; cada trecho começa como rascunho e nenhum script é executado.
- **Cérebro**: tudo o que o agente consulta, agrupado por cor. **Testar uma pergunta** mostra que agente responderia e por quê, sem chamar IA e sem gravar nada.

A aba **Agentes › IA e regras** (no topo, ao lado de **Agentes** e **Painel de atividades**) tem três partes. **Conectar IA** mostra, passo a passo, como ligar Claude Code, Codex, GitHub Copilot ou Gemini CLI ao Prumo por MCP. **Minhas regras** guarda as regras só desta conta: uma para todos os agentes e uma por agente; valem no chat e nas IAs conectadas, sem liberar permissões. Em **Regras do projeto**, o Admin marca as **especializações habilitadas** e ajusta as **Permissões dos agentes**. Contas comuns consultam essas regras, sem poder alterá-las. Se precisar saber por que uma permissão existe, abra o **i** na própria linha. As **Ações reservadas à pessoa** ficam separadas e não podem ser liberadas para os agentes. **Salvar permissões…** só fica disponível após uma alteração e exige a confirmação nativa do sistema; sair sem salvar não aplica as mudanças.

Em **Administração › Agentes**, o Admin pode mudar o nome, a profissão, a especialidade, a personalidade e a aparência 3D dos agentes oficiais; esses ajustes valem para as contas desta instalação. Em **Agentes**, cada pessoa pode configurar **Para a minha conta**: apelido e orientações que não alteram o agente oficial, as capacidades nem as políticas. As preferências são mantidas por ID da conta e não passam para outra conta no mesmo computador. Ainda não há sincronização automática desses perfis entre computadores.

**Novo agente pessoal** cria um perfil seu, com nome, objetivo e instruções (até 50 por projeto). Escolha uma **Ferramenta de consulta**: Resumo do projeto, Agenda de rotinas do Prumo, Runs de teste locais ou Propostas e tickets locais. Depois de salvar, abra o agente e clique em **Executar consulta local**. O Prumo consulta dados reais da sua conta e informa a fonte; a falta de registros aparece como tal, sem inventar resultados. As instruções pessoais não autorizam comandos ou novas ferramentas. A agenda se refere às rotinas do próprio Prumo, **não** a Google Calendar, Outlook ou criação de compromissos. Para essas ações será necessária integração e autorização próprias.

Só você vê, edita, executa e exclui seu agente pessoal. Se marcar **Público para as outras contas**, outras pessoas deste computador veem o perfil apenas para leitura, mas não acessam seus dados nem executam sua consulta. Essas consultas não modificam dados nem políticas do núcleo. Os robôs oficiais continuam sob Administração.

## Painel de atividades

Em **Agentes › Painel de atividades**, um diagrama mostra os clientes MCP, o Orchestrator, o worker, as ferramentas e as operações. Cada linha vem de um registro; o Prumo não supõe o que aconteceu. Um registro de início sem registro de término não prova que o processo ainda está rodando.

Arraste o diagrama para movê-lo. Use Ctrl + roda do mouse ou pinça para aproximar; no teclado, use as setas, `+`, `-` e `0`. **Ao vivo** atualiza a cada 3 segundos enquanto a aba estiver visível.

## Orquestração

Se uma pergunta envolver duas ou mais especialidades e você não escolher um agente, o Orchestrator consulta cada uma e reúne as respostas. Em **Orquestrações**, você vê quais agentes participaram, a ordem, a duração e eventuais falhas. As perguntas e respostas não são gravadas.

Na aba **Painel de atividades**, clique em **Diagnosticar problemas** para acompanhar uma investigação real de Regressão, Investigação de Bugs e Requisitos. O Prumo registra o andamento das consultas e mostra evidências, limitações e próximos passos na própria tela. A ação **não executa testes, não modifica código e não marca problemas como corrigidos**. Para avançar, use **Ver execuções**, **Revisar testes** ou **Conversar com o Orchestrator**. O botão **Ver fluxo dos agentes** aproxima o diagrama da investigação. O gráfico também registra as conexões reais entre o Orchestrator, os especialistas consultados e as etapas observadas; ele é atualizado enquanto o Painel estiver aberto. Um estado de consulta concluída não significa problema corrigido. O gráfico de operações e conversas continua mostrando somente eventos observados.\n\nPara uma avaliação ampla, escolha um projeto e pergunte **"faça um diagnóstico da qualidade do projeto"**. O Orchestrator consulta Regressão, Investigação de Bugs e Requisitos (respeitando especialistas desligados), prioriza execuções com FAIL, indica quando faltam execuções ou critérios aprovados e sugere a tela seguinte. O diagnóstico é uma leitura dos registros existentes, **não executa novos testes** e não substitui investigação e verificação de cobertura. Agora ele também examina os testes identificados no código e as ligações explícitas entre casos, tickets e automações. Indica lacunas de cadastro e sugere um próximo caso com base em um requisito aprovado, sem criá-lo ou executá-lo automaticamente. Uma quantidade de testes ou uma ligação registrada **não significa cobertura comprovada**; casos sem automação podem ser intencionalmente manuais. Sem projeto selecionado, dados de execuções e falhas de outras equipes não são exibidos.

## Onde cada projeto está ligado

Todo agente trabalha com o **mapa de vínculos do projeto escolhido**: o projeto do Jira, o projeto do Qase, o repositório do GitHub, a pasta local e o Manual/Prumo, cada um com o estado (ativo, desligado ou precisando de verificação) e o que o Prumo pode fazer ali (só ler, ou propor criação, comentário e edição com a sua confirmação). Cada projeto do Prumo acompanha **um único** projeto ou repositório por ferramenta, e o agente nunca troca por outro. Pergunte ao Orchestrator "onde este projeto está ligado?" para ver o mapa. O mesmo mapa vai para a IA externa que você autorizou e para o `contexto_projeto` do MCP, e é a base dos agendamentos e automações do projeto. Sem vínculo, o agente diz que falta vincular em Projetos em vez de inventar um destino. O mapa não leva token, endereço de API nem o caminho completo da pasta.

## Pelo MCP

O servidor MCP oferece instruções para cada especialidade e a ferramenta `propor_aprendizado`, que só cria rascunhos e tem um limite de uso por hora. Um aprendizado aprovado só é enviado a uma IA externa se o compartilhamento estiver autorizado no projeto. Documentos e aprendizados são conteúdo, não comandos.

## Limites

Claude Code, Codex, Copilot e Gemini dependem da sua conta, da instalação do respectivo cliente e da sua autorização. O assistente local não interpreta requisitos como uma IA; ele procura e mostra as informações registradas.
