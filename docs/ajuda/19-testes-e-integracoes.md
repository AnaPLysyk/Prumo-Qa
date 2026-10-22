# Testes, tickets e integrações

O Prumo mostra os testes do repositório junto com os casos do Qase. Se você autorizar, também pode criar ou atualizar itens no Jira, Qase e GitHub.

## Com e sem conexões

**Testes** e **Tickets** funcionam mesmo sem conectar serviços. Os testes vêm da pasta do projeto. Propostas, execuções e tickets locais ficam neste computador. Ao conectar um serviço, seus dados aparecem no Prumo:

- **Qase**: casos e suites em Repositório, runs em Runs, planos em Planos e defeitos em Tickets. Em Projetos, **Importar do Qase** leva três passos (abrir o Qase, colar o token, escolher os projetos) e cada projeto escolhido vira um projeto Prumo já vinculado.
- **Jira**: tickets em Tickets.
- **GitHub**: repositório e pipelines em Testes e issues abertas em Tickets. Em Projetos, **Escolher repositório do GitHub…** lista os repositórios da conta; **Vincular** associa ao projeto e **Vincular e trazer para este computador** também baixa uma cópia, com confirmação.

Você pode conectar um serviço depois e publicar o que preparou localmente. Para ligar um projeto criado à mão a um projeto que já existe, use **Listar recursos disponíveis** na linha da conta em **Conexões**.

Ao criar o token, libere as permissões listadas no formulário de cada serviço. No GitHub (token *fine-grained*): **Issues** com leitura e escrita; **Contents**, **Pull requests** e **Actions** só leitura. Sem escrita em Issues, o GitHub cria a issue mas descarta os rótulos.

## Testes

As seções acompanham o fluxo de trabalho: caso de teste, automação e execução com evidências.

### IDE

Na tela **IDE**, à esquerda fica o repositório com todas as pastas e arquivos; no centro, o editor com abas; embaixo, Problemas, Saída e Testes. Para pedir ajuda ou mandar o Orquestrador agir na IDE ("abrir app.ts", "criar arquivo src/novo.ts"), use o robô flutuante.

- O editor é o **Monaco**, o mesmo do VS Code: realce para dezenas de linguagens, sugestões de código, erros de sintaxe sublinhados, minimapa, dobrar blocos, vários cursores, localizar e substituir (Ctrl+F e Ctrl+H), formatar documento (Shift+Alt+F), renomear (F2), paleta de comandos do editor (F1) e rolagem fixa do contexto. Quebra de linha, minimapa e tamanho da fonte ficam salvos neste computador.
- **Botão direito** (ou a tecla Menu) em uma pasta ou arquivo abre ações: criar arquivo ou pasta ali, ver os testes e as alterações do Git do arquivo, copiar o caminho e pedir ajuda ao Orquestrador.
- **Ctrl+P** abre um arquivo pelo nome e **Ctrl+Shift+P** mostra os comandos da IDE.
- **Terminal** (aba no painel de baixo ou **Ctrl+`**), só com pasta local: digite um comando e aperte Enter. **Cada comando pede a sua confirmação** do sistema, mostrando a pasta e o texto exato, e roda na pasta do projeto, um por vez, sem entrada de teclado. Ctrl+C para o comando em andamento. O comando tem as permissões da sua conta do Windows: confira antes de executar. Pelo robô flutuante, "executar npm test no terminal" abre o terminal e pede a mesma confirmação. **Salvar** (Ctrl+S) pede a confirmação do sistema e só grava se o arquivo não mudou fora do Prumo.
- **Novo arquivo** cria uma automação. Com o caso do Qase informado, grava a anotação `Qase: CHAVE-ID` que liga os dois.
- O Prumo só grava arquivos de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) dentro da pasta vinculada, sem atalhos para outras pastas e com até 300 KB. Arquivos que parecem conter segredos não podem ser editados. Salvar não executa o teste.
- **Pipelines CI/CD** lista, edita e cria (**Novo pipeline**) os workflows do GitHub Actions (`.github/workflows`) do repositório vinculado. Salvar altera só o arquivo local; o pipeline vale no GitHub quando você enviar o repositório. **Execuções no GitHub** mostra as execuções do Actions. O Prumo só escreve em branches `prumo/...`, nunca na principal, e abre o Pull Request como rascunho.

Se você vinculou apenas o GitHub e ainda não tem uma cópia local, a IDE permite ler os arquivos e oferece **Trazer o repositório do GitHub**. O Prumo usa o Git e as credenciais já configuradas no computador para baixar uma cópia para a pasta de dados dele. **Atualizar do GitHub** só incorpora mudanças que não apagam seu trabalho. Scripts de Git e links simbólicos ficam desativados.

### Repositório

Esta lista reúne os casos do Qase e os testes manuais e automatizados do código. Um caso só é ligado a um teste quando o próprio teste contém uma anotação, como `qase(31, …)`, `@qase-31` ou `Qase: SFQ-31`. Nomes parecidos não criam vínculos.

Cada linha mostra o tipo de teste, o nível, as tags e o último resultado. Abaixo aparecem as propostas que aguardam revisão, as suítes do Qase e os vínculos registrados entre tickets, casos e automações. Uma proposta é um rascunho criado por você, pelo Prumo ou por uma IA; revise-a antes de enviá-la ao Qase. No detalhe de um caso, você pode ver os passos, os resultados locais e o código, ou escolher **Criar automação na IDE**.

No Repositório, as suítes do Qase e do Prumo aparecem juntas na árvore à esquerda: a seta de cada suíte mostra os casos dela, e **⊞** e **⊟** expandem ou recolhem tudo. Sem busca nem suíte escolhida, a lista da direita também mostra as suítes recolhidas, e cada uma abre para os casos. O menu **⋯** de cada suíte permite criar cenário ou suíte dentro dela, editar e remover. Suíte do Qase: **Editar suíte** altera título e descrição (operação **Editar suíte no Qase**, com escrita habilitada e confirmação do Windows); remover só vale para suíte do Prumo, e as filhas e os cenários dela sobem para a suíte pai, sem apagar nada junto. O **⋯** de cada caso abre, edita, publica no Qase ou remove. No Repositório local, **Exportar casos** salva um JSON versionado com casos, passos, tags, requisitos, riscos e suítes do projeto atual. **Importar casos** abre um arquivo JSON, valida seu formato, cria cópias com novos IDs e pede confirmação nativa antes de gravar; casos existentes não são sobrescritos. Antes de escolher o arquivo você define o destino: **Só no Prumo** (precisa do Manual/Prumo ligado) ou **No Prumo e publicar no Qase** (precisa também do Qase integrado, com escrita habilitada); neste caso, logo depois de importar abre o diálogo de publicação só com os casos que entraram, e o Qase continua pedindo confirmação. Agentes podem consultar o Repositório e propor casos como rascunhos QA, sempre para revisão humana.

O Repositório comporta até **1.000 cenários por projeto**. Na criação de planos, a seleção usa busca e páginas de 100 casos: os casos marcados permanecem selecionados mesmo quando você muda de página ou pesquisa.

### Manutenção da tela Testes

O código da tela fica em `frontend/testes/` e as regras, contratos IPC e gravação ficam em `backend/testes/`. Não edite os arquivos gerados de `dist/renderer/`.

- `tela-testes.parte.js`: reúne visão geral, editor, pipelines CI/CD, IDE e navegação pelos arquivos, mantendo as funções identificadas.
- `fluxos-casos-qase.parte.js`: consulta casos e suítes do Qase, apresenta detalhes e propostas de casos.
- `fluxos-repositorio-local.parte.js`: edita suítes e lista casos exclusivos do projeto local, sem criar cópias dos casos do Qase.
- `fluxos-planos-e-runs.parte.js`: planos de teste e resultados das execuções.
- `fluxos-vinculos.parte.js`: relações entre tickets, casos e automações.
- `propostas.js`: formulário e cartão das propostas de automação.
- `execucoes-e-evidencias.js`: execução e apresentação das evidências.

O manifesto `frontend/construcao/telas-modulares.json` mantém a ordem de carregamento e o build gera `dist/renderer/fluxos.js` e `dist/renderer/tela-testes.js`. A Documentação Viva permite localizar cada fonte pela tela Testes.

A verificação unitária e as jornadas de regressão usam perfis temporários e mocks, sem escrever em serviços reais. As suítes locais continuam no armazenamento isolado do projeto/usuário. Para confirmar o fluxo de ponta a ponta com Qase e Jira, ainda é preciso fazer homologação manual com integrações autorizadas.

### Runs

Esta lista reúne, no mesmo formato da lista de casos do Repositório, as execuções locais (manuais ou agendadas), as preparadas no Prumo (ícone **P**) e as do Qase (ícone **Q**), cada uma com a barra de resultado e o estado.

**Filtros avançados** busca título ou ID e filtra por origem, status/resultado, ambiente e período. Quando há um espaço selecionado, os filtros se limitam a ele; em seguida, atuam sobre os resultados carregados.

Uma execução local pode guardar resultados manuais, executar automações associadas (com autenticação do sistema) e publicar resultados no Qase após conferir a execução. **Preparar run** permite marcar casos do Repositório por título ou ID; a lista carrega todas as páginas disponíveis. Sem conexão ao Qase, usa os testes do código e guarda a execução apenas neste computador. Para publicar no Qase, crie os casos nesse serviço e prepare uma nova execução. No detalhe da run local, **Editar run** altera o título e o ambiente; **Apagar run** remove apenas o registro local, após confirmação, sem apagar a run no Qase.

Ao abrir uma run do Qase (clique na linha), ela aparece como uma página no desenho do Qase: no topo o título, o estado e as ações **Rodar de novo** (prepara outra run com os mesmos casos), **Exportar** (CSV) e o menu **⋯** (**Encerrar run**); abaixo, a descrição e as abas **Casos** e **Linha do tempo**. Em Casos há busca (por todos os campos, título, ID ou comentário), **Adicionar filtro** por status, e a lista de casos agrupada por suíte, com a barra de resultado de cada suíte e a duração. À direita ficam a rosca com a **taxa de conclusão** e os detalhes (status, quem e quando iniciou, tempo total e decorrido, ambiente, milestone, plano). Clicar num caso abre o painel lateral, com as abas **Execução** (descrição, resultado obtido, passos com o resultado de cada um e evidências), **Enviar resultado** e **Histórico**; o menu **⋯** da linha lança **Passed**, **Failed**, **Blocked**, **Skipped** ou **Invalid** (Passed e Skipped enviam direto; os demais abrem o painel para o comentário). Marcando vários casos, **Enviar resultado** aplica o mesmo status a todos. Em **Enviar resultado** dá para marcar cada passo (um passo com falha reprova o caso; todos passados aprovam), escrever o comentário e **Anexar arquivo…**. O envio usa a operação **Publicar resultados na run do Qase**, exige a escrita habilitada em Projetos e pede a confirmação do Windows.

**Evidências do cenário.** Numa run local, **Ver evidências** (na linha do caso) mostra o resumo da rodada de automação (automação, resultado, início e fim, o cenário no runner), o log e os arquivos, com prévia de imagem e texto. Para um cenário sem automação, ou para juntar um print, vídeo ou log, use **Anexar evidência…** (depois de registrar o resultado): os arquivos escolhidos na janela do Windows são copiados para `.prumo/evidencias/runs/<run>/<caso>` do projeto, com segredos mascarados em texto. Ao **Publicar resultados**, cada cenário leva ao Qase o que tem: JSON da evidência da rodada, log (stdout e stderr mascarados), relatório do runner e o que a automação deixou em `.prumo/artefatos/<job>/`, mais os anexos manuais, até 10 arquivos de 10 MB por cenário, inclusive nos que passaram. Isso vale também para a publicação agendada, dentro da mesma política de publicação. Só entram arquivos dessas pastas; atalhos, segredos (`.env`, chaves) e tipos desconhecidos são recusados. Anexo adicionado depois de o resultado ser publicado não é reenviado. Na run do Qase, o assistente do caso lista os anexos do resultado atual e **Anexar arquivo…** envia um arquivo novo junto com o resultado.

Na página da run do Qase, o conteúdo acompanha a rolagem normal da tela, sem barras de rolagem internas. **Esc** fecha o painel e devolve o foco à lista. A contagem de selecionados e **Enviar resultado** aparecem quando há casos selecionados; o ícone **ⓘ** junto às ações explica quando a escrita está desligada.

### Planos

Lista os planos de teste do Qase numa tabela (título, criado, atualizado, tempo de execução e casos), com busca, ordenação pelos títulos das colunas, linhas por página e o menu **⋯** de cada plano (**Abrir**, **Iniciar run**, **Copiar ID**). **Criar plano** fica no alto da lista. Abrir um plano mostra a página dele: **Iniciar run** (já com os casos e o plano escolhidos) e as abas **Casos** e **Runs**, esta com as runs criadas a partir do plano; clicar numa run abre a página da run.

## Tickets

Tickets do Jira, defeitos do Qase, chamados do GitHub e rascunhos locais aparecem na mesma tabela. Cada linha mostra a origem. Para buscar por texto, aperte Enter ou clique na lupa. Origem, tipo, situação e período filtram assim que mudam. A situação (Abertos, Em andamento ou Concluídos) vale para todas as origens. Cada serviço traduz o próprio status: no Jira vale a categoria do status, e no GitHub só as issues abertas são consultadas. O período vai de hoje até 90 dias atrás. O detalhe mostra descrição, critérios, relações, comentários, histórico, anexos e mudanças de estado. Para comentar, anexar, mudar o estado, editar ou criar um item, o Prumo pede confirmação e mostra uma prévia.

**Novo ticket** segue as conexões do projeto. Com uma ferramenta integrada (vinculada e com escrita habilitada), o ticket é criado direto nela, só com os campos dela e depois da confirmação:

- **Jira**: tipo de ticket, resumo e descrição.
- **Qase**: defeito com resumo, resultado observado, severidade, milestone e campos obrigatórios do projeto.
- **GitHub**: issue com o tipo Bug ou Melhoria, que vira o rótulo `bug` ou `enhancement`. Não dispara GitHub Actions.

O primeiro campo é o **Destino**, com as opções que o projeto tem: **Rascunho no Prumo** (só com Manual/Prumo ativo, fica neste computador) e as ferramentas integradas. Uma ferramenta em Só ver aparece indisponível, com o atalho para habilitar em Projetos.

Em **Rastreabilidade** você escolhe a **falha de origem** (caso em FAIL de uma run local, de automação ou manual, com as evidências dele) e adiciona **outros vínculos**: casos do Qase, cenários do Prumo, automações, evidências de run, tickets do Jira, defeitos do Qase, issues do GitHub e tickets do Prumo. Cada tipo permite buscar na lista ou **digitar o identificador** (número do caso, do defeito ou da issue, chave do Jira, capability da automação, ID da evidência); caso, defeito e ticket do Jira digitados são conferidos no serviço antes de entrar. Cenário e ticket do Prumo só vêm da lista. Os vínculos só são gravados depois que o ticket é criado e aparecem no mapa de vínculos. As evidências entram citadas no texto do ticket; anexar o arquivo existe só no Jira.

Rascunhos locais (criados sem integração, a partir de falhas de run ou sugeridos por IA) podem ser publicados depois. No rascunho, **Destino da publicação** oferece só o que está vinculado ao projeto:

- **Manter rascunho local**: nada sai do computador.
- **Jira**: ticket com o tipo de bug ou melhoria do projeto.
- **Defeitos Qase** (só bugs): severidade com os nomes do Qase, milestone e campos obrigatórios do projeto.
- **GitHub Issues**: issue com o rótulo `bug` ou `enhancement`. Não dispara GitHub Actions.

Depois do envio, o item aparece na lista do serviço correspondente, marcado como **publicado pelo Prumo**.

No detalhe de um defeito do Qase dá para mudar o status (em andamento, resolvido ou inválido); o resto do defeito é somente leitura. **Abrir ticket no Jira…** preenche um ticket novo e registra o vínculo defeito → ticket.

## Escrita externa

Por padrão, o Prumo não altera dados nos serviços. Para permitir isso, habilite a escrita para cada projeto e serviço em **Conexões**. Antes de enviar, ele mostra uma prévia e pede sua confirmação. Depois, confere o resultado no serviço. Se você repetir uma operação cuja resposta se perdeu, o Prumo evita criar o mesmo item outra vez. Ele não apaga dados.

## Atalhos

F5 ou Ctrl+R atualiza a tela. A engrenagem abre Meu perfil, Aparência (tema, idioma e cor de destaque) e Assistente. O menu lateral pode ser recolhido.

## Limites

As operações de escrita foram testadas com contas reais do Qase, Jira e GitHub, mas os recursos disponíveis dependem do plano e das permissões de cada conta. Por exemplo, o plano gratuito do Qase não permite vincular casos a tickets do Jira. O Prumo ainda não permite editar ou fechar chamados, editar o título ou o resultado de defeitos nem excluir itens. A classificação dos testes é uma estimativa baseada nos arquivos. O instalador não tem assinatura digital: confira o SHA-256 antes de abri-lo.

Sobre agentes e o chat, veja **Ajuda › Assistente, agentes e conhecimento**.

A IDE usa toda a área de trabalho, em três painéis contíguos sem cartões empilhados. Seu layout, os componentes e as regras responsivas ficam em `frontend/design-system/ds.css`; os estilos específicos restantes em `frontend/design-system/estilos-das-telas.parte.css`. A leitura, a edição e as confirmações continuam na lógica de Testes.

## Execução manual nas runs

Em **Runs**, abra a run e clique em um caso ou em **Iniciar testes manuais**. O Prumo registra o início com a identidade da sessão e mostra a foto do perfil (ou as iniciais). Esse acompanhamento fica neste computador e não atribui o caso a alguém no Qase. Reabrir um caso iniciado preserva a pessoa e o horário originais. Iniciar não registra aprovação nem executa automação.

No painel do caso, consulte os passos e escolha **Aprovado**, **Reprovado**, **Bloqueado**, **Pulado** ou **Inválido**. Falha, bloqueio e invalidação exigem uma observação. Ao salvar, o fluxo avança para o próximo caso manual pendente; na run local essa opção pode ser desmarcada. Os filtros distinguem casos ainda não testados, em andamento e com resultado. Resultados de automação continuam protegidos contra substituição manual.

A preparação de runs inclui os casos manuais do repositório local. O título e o ambiente da run local continuam editáveis em **Editar run**. Na página do Qase, **Automações desta run** abre o registro local vinculado à mesma run para executar as automações declaradas e publicar seus resultados com confirmação. O Prumo consulta todas as páginas de resultados antes de mostrar os casos pendentes. Publicações e anexos externos continuam sujeitos às permissões e confirmações do projeto.

## IDE vinculada ao repositório do projeto

A aba **Testes > IDE > Código** abre a árvore do repositório associado ao **projeto selecionado**. A origem é a pasta local escolhida em Projetos ou o clone do GitHub vinculado. A IDE mostra diretórios, subdiretórios, arquivos de código, documentação e configurações, sem restringir o explorador a arquivos de teste. O CodeMirror permite editar os arquivos de texto, criar um arquivo por caminho relativo e salvar com confirmação nativa.

Para segurança e desempenho, o explorador não percorre pastas geradas (`.git`, `node_modules`, `dist`, `build`, caches), atalhos simbólicos nem arquivos reconhecidos como credenciais. A listagem local é limitada a 8.000 itens e 24 níveis, com aviso de truncamento. Arquivos binários e arquivos de texto acima de 300 KB não são editáveis; segredos detectados são mascarados e protegidos. Salvamentos usam o hash original para impedir que a IDE sobrescreva uma alteração feita por outra ferramenta. As permissões seguem o papel da pessoa: Testes VER para leitura e USAR para gravação. Nenhum arquivo é executado.

**Quando apenas o GitHub está vinculado**, o explorador remoto consulta pastas e arquivos pelo vínculo autenticado e funciona em modo de leitura. Para editar, use **Trazer o repositório do GitHub**: a operação cria uma cópia local vinculada após confirmação e usa o Git instalado. A leitura remota respeita os limites da API GitHub Contents; em diretórios muito grandes pode ser necessário um clone. Nenhuma alteração local é automaticamente enviada.

Na aba **IDE > Pipelines CI/CD**, a fonte **Local** lista e edita apenas arquivos `.github/workflows/*.yml` e `*.yaml` da pasta vinculada. Se o GitHub estiver vinculado, **Ver no GitHub** abre os workflows remotos na mesma IDE, em modo somente leitura; **Pipelines locais** retorna ao projeto editável. O projeto só recebe as alterações depois dos procedimentos Git de commit e push; salvar não executa um pipeline nem faz publicação no GitHub. Se não existe pasta local, a tela apresenta primeiro a estrutura remota e a opção para trazer uma cópia.

A IDE segue o desenho de um editor de código: barra de atividades (Explorador, Buscar, Controle de código-fonte, Executar e testes), abas com marca de alteração não salva, localizar e substituir (Ctrl+F e Ctrl+H), painel inferior (Problemas, Saída, Testes) e barra de status. Atalhos: Ctrl+P abre arquivo, Ctrl+Shift+P a paleta de comandos, Ctrl+G vai para a linha, Ctrl+S salva, Ctrl+B e Ctrl+J recolhem as barras. Buscar e Controle de código-fonte só leem: mostram resultados, ramo, arquivos alterados e diferenças. Commit, envio e PR não acontecem aqui; os botões levam a Agentes e Projetos.

O backend mantém os canais próprios `ide:arvore`, `ide:arquivo` e `ide:gravar`, mais os somente leitura `ide:buscar`, `ide:gitestado` e `ide:gitdiff`, implementados em `backend/projetos/ideRepositorio.ts` e `backend/projetos/ideGit.ts` e registrados em `backend/projetos/controlador.ts`, com contratos IPC e confirmação nativa para gravar. A tela usa exclusivamente `frontend/testes/tela-testes.parte.js`; a aparência de explorador, editor e painéis permanece em `frontend/design-system/`.
