# Testes, tickets e integrações

O Prumo mostra os testes do repositório junto com os casos do Qase. Criar ou atualizar itens no Jira, Qase e GitHub só acontece se você autorizar.

## Com e sem conexões

**Testes** e **Tickets** funcionam sem conectar serviços. Os testes vêm da pasta do projeto; propostas, runs e tickets locais ficam neste computador. As conexões (Jira, Qase, Manual/Prumo, GitHub e pasta local) ficam em **Projetos**, no mapa de conexões, e cada serviço conectado traz seus dados:

- **Qase**: casos e suítes em Repositório, runs em Runs, planos em Planos e defeitos em Tickets. Em Projetos, **Importar do Qase** tem três passos (abrir o Qase, colar o token, escolher os projetos); cada projeto escolhido vira um projeto Prumo já vinculado.
- **Jira**: tickets em Tickets.
- **GitHub**: repositório e pipelines em Testes, issues abertas em Tickets. Em Projetos, **Escolher repositório do GitHub…** lista os repositórios da conta. **Vincular** associa o repositório ao projeto; **Vincular e trazer para este computador** também baixa uma cópia, com confirmação.

Você pode conectar um serviço depois e publicar o que preparou localmente. Para ligar um projeto criado à mão a um que já existe, use **Listar recursos disponíveis** na linha da conta, em **Contas e permissões**.

Ao criar o token, libere as permissões que o formulário de cada serviço lista. No GitHub (token *fine-grained*): **Issues** com leitura e escrita; **Contents**, **Pull requests** e **Actions** só leitura. Sem escrita em Issues, o GitHub cria a issue mas descarta os rótulos.

## Testes

### IDE

À esquerda fica o repositório com pastas e arquivos; no centro, o editor com abas; embaixo, Problemas, Saída e Testes. Para pedir ajuda ou mandar o Orquestrador agir na IDE ("abrir app.ts", "criar arquivo src/novo.ts"), use o robô flutuante.

- O editor é o **Monaco**, o mesmo do VS Code: realce de sintaxe, sugestões, erros sublinhados, minimapa, dobrar blocos, vários cursores, localizar e substituir (Ctrl+F e Ctrl+H), formatar (Shift+Alt+F), renomear (F2) e paleta do editor (F1). Quebra de linha, minimapa e tamanho da fonte ficam salvos neste computador.
- **Botão direito** (ou a tecla Menu) numa pasta ou arquivo: criar arquivo ou pasta ali, ver os testes e as alterações do Git do arquivo, copiar o caminho e pedir ajuda ao Orquestrador.
- **Ctrl+P** abre um arquivo pelo nome; **Ctrl+Shift+P** mostra os comandos da IDE.
- **Terminal** (aba embaixo ou **Ctrl+`**), só com pasta local. Digite o comando e aperte Enter. **Cada comando pede a sua confirmação** do sistema, com a pasta e o texto exato, e roda na pasta do projeto, um por vez, sem entrada de teclado. Ctrl+C interrompe. O comando tem as permissões da sua conta do Windows: confira antes de confirmar. Pelo robô, "executar npm test no terminal" abre o terminal e pede a mesma confirmação.
- **Salvar** (Ctrl+S) pede a confirmação do sistema e só grava se o arquivo não mudou fora do Prumo. Salvar não executa o teste.
- **Novo arquivo** cria uma automação. Com o caso do Qase informado, grava a anotação `Qase: CHAVE-ID` que liga os dois.
- O Prumo só grava arquivos de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) dentro da pasta vinculada, sem atalhos para outras pastas e com até 300 KB. Arquivos que parecem conter segredos não podem ser editados.
- **Pipelines CI/CD** lista, edita e cria (**Novo pipeline**) os workflows do GitHub Actions (`.github/workflows`) do repositório vinculado. Salvar altera só o arquivo local; o pipeline passa a valer no GitHub quando você enviar o repositório. **Execuções no GitHub** mostra as execuções do Actions. O Prumo só escreve em branches `prumo/...`, nunca na principal, e abre o Pull Request como rascunho.

Se só o GitHub estiver vinculado, a IDE lê os arquivos e oferece **Trazer o repositório do GitHub**: o Prumo usa o Git e as credenciais já configuradas no computador para baixar uma cópia para a pasta de dados dele. **Atualizar do GitHub** só incorpora mudanças que não apagam seu trabalho. Scripts de Git e links simbólicos ficam desativados. Mais detalhes em **IDE vinculada ao repositório do projeto**, no fim desta página.

### Repositório

A lista reúne os casos do Qase e os testes manuais e automatizados do código. Um caso só se liga a um teste quando o próprio teste tem uma anotação, como `qase(31, …)`, `@qase-31` ou `Qase: SFQ-31`. Nomes parecidos não criam vínculo.

Cada linha mostra tipo, nível, tags e último resultado. Os cenários criados no Prumo têm número próprio (**P-1**, **P-2**…). Abaixo ficam as propostas que aguardam revisão e as suítes do Qase. Uma proposta é um rascunho criado por você, pelo Prumo ou por uma IA; revise antes de enviá-la ao Qase. No detalhe de um caso você vê passos, resultados locais e código, ou escolhe **Criar automação na IDE**.

**Criar › Novo cenário** abre o editor em tela cheia. As suítes do Qase e do Prumo aparecem juntas na árvore à esquerda: a seta mostra os casos, e **⊞** e **⊟** expandem ou recolhem tudo. Sem busca nem suíte escolhida, a lista da direita também mostra as suítes recolhidas.

- O **⋯** da suíte cria cenário ou suíte dentro dela, edita e remove. Na suíte do Qase, **Editar suíte** muda título e descrição (operação **Editar suíte no Qase**, com escrita habilitada e confirmação do Windows). Remover só vale para suíte do Prumo; as suítes filhas e os cenários sobem para a suíte pai, sem apagar nada junto.
- O **⋯** do caso abre, edita, publica no Qase ou remove.
- **Exportar casos** salva um JSON versionado com casos, passos, tags, requisitos, riscos e suítes do projeto atual.
- **Importar casos** lê um JSON, valida o formato, cria cópias com novos IDs e pede confirmação nativa antes de gravar; casos existentes não são sobrescritos. Antes de escolher o arquivo você define o destino: **Só no Prumo** (precisa do Manual/Prumo ligado) ou **No Prumo e publicar no Qase** (precisa também do Qase com escrita habilitada). No segundo caso, o diálogo de publicação abre logo depois, só com os casos importados, e o Qase continua pedindo confirmação.

Agentes consultam o Repositório e propõem casos como rascunhos, sempre para revisão humana. O limite é de **1.000 cenários por projeto**. Na criação de planos, a seleção usa busca e páginas de 100 casos, e os casos marcados continuam selecionados ao trocar de página ou pesquisar.

### Manutenção da tela Testes

O código da tela fica em `frontend/testes/`; regras, contratos IPC e gravação ficam em `backend/testes/`. Não edite os arquivos gerados de `dist/renderer/`.

- `tela-testes.parte.js`: visão geral, editor, pipelines CI/CD, IDE e navegação pelos arquivos.
- `fluxos-casos-qase.parte.js`: casos e suítes do Qase, detalhes e propostas.
- `fluxos-repositorio-local.parte.js`: suítes e casos exclusivos do projeto local, sem copiar casos do Qase.
- `fluxos-planos-e-runs.parte.js`: planos e resultados das execuções.
- `fluxos-vinculos.parte.js`: relações entre tickets, casos e automações.
- `propostas.js`: formulário e cartão das propostas de automação.
- `execucoes-e-evidencias.js`: execução e apresentação das evidências.

O manifesto `frontend/construcao/telas-modulares.json` define a ordem de carregamento, e o build gera `dist/renderer/fluxos.js` e `dist/renderer/tela-testes.js`. A Documentação viva localiza cada fonte pela tela Testes. Os estilos da IDE ficam em `frontend/design-system/ds.css` e `estilos-das-telas.parte.css`.

Os testes unitários e as jornadas de regressão usam perfis temporários e mocks, sem escrever em serviços reais. Para confirmar o fluxo de ponta a ponta com Qase e Jira, ainda é preciso homologação manual com integrações autorizadas.

### Runs

A lista reúne, no mesmo formato da lista de casos, as execuções locais (manuais ou agendadas), as preparadas no Prumo (ícone **P**) e as do Qase (ícone **Q**), cada uma com a barra de resultado e o estado. **Filtros avançados** busca por título ou ID e filtra por origem, status, ambiente e período. Com um espaço selecionado, os filtros ficam limitados a ele.

**Preparar run** abre a escolha dos casos no desenho do Qase: as suítes à esquerda (com a origem de cada uma: Qase, Prumo ou código) e os casos à direita. Marque um caso, vários ou uma **suíte inteira** pela caixa da suíte. A busca filtra por título ou ID, e o resumo mostra quantos casos e suítes entram. Sem conexão com o Qase, a run usa os cenários do Prumo e os testes do código e fica só neste computador. Para publicar no Qase, crie a run lá depois de prepará-la.

**Run do Prumo.** Ela abre como página, igual à do Qase:

- No topo, o título, o estado e a composição (quantos casos, de quantas suítes, quantos manuais e quantos com automação).
- As ações **Iniciar testes manuais**, **Casos da run**, **Executar automações**, **Exportar** e o menu **⋯**: **Editar título e ambiente**, **Criar run no Qase**, **Publicar resultados no Qase**, **Apagar run**.
- Busca e **Adicionar filtro** por status; os casos agrupados por suíte, com a barra de resultado de cada uma, quem executou e o **⋯** de cada caso.
- À direita, a rosca com a taxa de conclusão e os detalhes.

Marcando vários casos (ou uma suíte inteira), **Marcar resultado** aplica o mesmo resultado a todos e **Tirar da run** os retira. Clicar num caso abre o painel lateral com **Execução**, **Enviar resultado** e **Evidências**: ali você aprova, reprova, bloqueia, pula ou invalida o caso, com comentário, e vê ou anexa evidência. **Casos da run** inclui ou tira casos enquanto a run não existe no Qase; depois de criada lá, a lista fica fixa (prepare outra run para outros casos). Tirar um caso que já tem resultado pede confirmação. **Apagar run** remove só o registro local, depois de confirmar, e não apaga a run no Qase.

**Run do Qase.** Clique na linha para abrir a página:

- No topo, título, estado e as ações **Rodar de novo** (prepara outra run com os mesmos casos), **Exportar** (CSV) e **⋯ › Encerrar run**.
- Abaixo, a descrição e as abas **Casos** e **Linha do tempo**. Em Casos há busca (por título, ID ou comentário), **Adicionar filtro** por status e a lista agrupada por suíte, com a barra de resultado e a duração.
- À direita, a taxa de conclusão e os detalhes: status, quem e quando iniciou, tempo total e decorrido, ambiente, milestone e plano.
- O painel do caso tem as abas **Execução** (descrição, resultado obtido, passos e evidências), **Enviar resultado** e **Histórico**.
- O **⋯** da linha lança **Passed**, **Failed**, **Blocked**, **Skipped** ou **Invalid**. Passed e Skipped enviam direto; os outros abrem o painel para o comentário. Marcando vários casos, **Enviar resultado** aplica o mesmo status a todos.
- Em **Enviar resultado** você marca cada passo (um passo com falha reprova o caso; todos passados aprovam), escreve o comentário e usa **Anexar arquivo…**.

O envio usa a operação **Publicar resultados na run do Qase**, exige a escrita habilitada em Projetos e pede a confirmação do Windows. A página rola com a tela, sem barras internas; **Esc** fecha o painel e devolve o foco à lista; o ícone **ⓘ** nas ações explica quando a escrita está desligada.

**Evidências do cenário.** Numa run local, **Ver evidências** (na linha do caso) mostra o resumo da rodada de automação, o log e os arquivos, com prévia de imagem e texto. Para um cenário sem automação, ou para juntar print, vídeo ou log, use **Anexar evidência…** depois de registrar o resultado. Os arquivos escolhidos são copiados para `.prumo/evidencias/runs/<run>/<caso>` do projeto, com segredos mascarados em texto.

Ao **Publicar resultados**, cada cenário leva ao Qase o que tem: JSON da evidência da rodada, log (stdout e stderr mascarados), relatório do runner, o que a automação deixou em `.prumo/artefatos/<job>/` e os anexos manuais. O limite é de 10 arquivos de 10 MB por cenário, inclusive nos que passaram, e vale também para a publicação agendada, dentro da mesma política. Só entram arquivos dessas pastas; atalhos, segredos (`.env`, chaves) e tipos desconhecidos são recusados. Anexo adicionado depois da publicação não é reenviado. Na run do Qase, o painel do caso lista os anexos do resultado atual, e **Anexar arquivo…** envia um arquivo novo junto com o resultado.

### Planos

A tabela lista os planos do Qase (título, criado, atualizado, tempo de execução e casos), com busca, ordenação pelos títulos das colunas e linhas por página. O **⋯** de cada plano tem **Abrir**, **Iniciar run** e **Copiar ID**; **Criar plano** fica no alto da lista. A página do plano tem **Iniciar run** (já com os casos e o plano) e as abas **Casos** e **Runs**; clicar numa run abre a página dela.

## Tickets

Tickets do Jira, defeitos do Qase, issues do GitHub e rascunhos locais aparecem na mesma tabela, cada linha com a origem. Para buscar por texto, aperte Enter ou clique na lupa. Origem, tipo, situação e período filtram assim que mudam. A situação (Abertos, Em andamento ou Concluídos) vale para todas as origens; cada serviço traduz o próprio status: no Jira vale a categoria do status, e do GitHub só as issues abertas são consultadas. O período vai de hoje até 90 dias atrás. O detalhe mostra descrição, critérios, relações, comentários, histórico, anexos e mudanças de estado. Para comentar, anexar, mudar o estado, editar ou criar um item, o Prumo mostra uma prévia e pede confirmação.

**Novo ticket** segue as conexões do projeto. O primeiro campo é o **Destino**: **Rascunho no Prumo** (só com Manual/Prumo ativo; fica neste computador) ou uma ferramenta integrada. Uma ferramenta em Só ver aparece indisponível, com o atalho para habilitar em Projetos. Com a ferramenta vinculada e a escrita habilitada, o ticket é criado direto nela, só com os campos dela e depois da confirmação:

- **Jira**: tipo de ticket, resumo e descrição.
- **Qase**: defeito com resumo, resultado observado, severidade, milestone e campos obrigatórios do projeto.
- **GitHub**: issue do tipo Bug ou Melhoria, que vira o rótulo `bug` ou `enhancement`. Não dispara GitHub Actions.

Em **Rastreabilidade** você escolhe a **falha de origem** (um caso em FAIL de uma run local, com as evidências dele) e adiciona **outros vínculos**: casos do Qase, cenários do Prumo, automações, evidências de run, tickets do Jira, defeitos do Qase, issues do GitHub e tickets do Prumo. Cada tipo permite buscar na lista ou **digitar o identificador** (número do caso, do defeito ou da issue, chave do Jira, capability da automação, ID da evidência). Caso, defeito e ticket do Jira digitados são conferidos no serviço antes de entrar; cenário e ticket do Prumo só vêm da lista. Os vínculos são gravados depois que o ticket é criado. As evidências entram citadas no texto do ticket; anexar o arquivo só existe no Jira.

Rascunhos locais (criados sem integração, a partir de falhas de run ou sugeridos por IA) podem ser publicados depois. **Destino da publicação** oferece só o que está vinculado ao projeto:

- **Manter rascunho local**: nada sai do computador.
- **Jira**: ticket com o tipo de bug ou melhoria do projeto.
- **Defeitos Qase** (só bugs): severidade com os nomes do Qase, milestone e campos obrigatórios.
- **GitHub Issues**: issue com o rótulo `bug` ou `enhancement`.

Depois do envio, o item aparece na lista do serviço, marcado como **publicado pelo Prumo**. Num defeito do Qase dá para mudar o status (em andamento, resolvido ou inválido); o resto é somente leitura. **Abrir ticket no Jira…** preenche um ticket novo e registra o vínculo defeito → ticket.

## Escrita externa

Por padrão, o Prumo não altera dados nos serviços. Para permitir, habilite a escrita por projeto e serviço em **Projetos › Contas e permissões**. Antes de enviar, ele mostra uma prévia e pede sua confirmação; depois, confere o resultado no serviço. Se você repetir uma operação cuja resposta se perdeu, o Prumo evita criar o mesmo item de novo. Ele não apaga dados.

## Atalhos

F5 ou Ctrl+R atualiza a tela, e o menu lateral pode ser recolhido. A engrenagem abre **Configurações**, que só tem a Aparência (tema, idioma e cor de destaque). Conta e segurança ficam em **Minha conta**, pela foto no canto superior.

## Limites

As operações de escrita foram testadas com contas reais do Qase, Jira e GitHub, mas os recursos dependem do plano e das permissões de cada conta. O plano gratuito do Qase, por exemplo, não permite vincular casos a tickets do Jira. O Prumo ainda não edita nem fecha chamados, não edita o título nem o resultado de defeitos e não exclui itens. A classificação dos testes é uma estimativa feita a partir dos arquivos. O instalador não tem assinatura digital: confira o SHA-256 antes de abri-lo.

Sobre agentes e o chat, veja **Ajuda › Assistente, agentes e conhecimento**.

## Execução manual nas runs

Em **Runs**, abra a run e clique num caso ou em **Iniciar testes manuais**. O Prumo registra o início com a identidade da sessão e mostra a foto do perfil (ou as iniciais). Esse acompanhamento fica neste computador e não atribui o caso a ninguém no Qase. Reabrir um caso iniciado preserva a pessoa e o horário originais. Iniciar não registra aprovação nem executa automação.

No painel do caso (aba **Enviar resultado**), leia os passos e escolha **Aprovado**, **Reprovado**, **Bloqueado**, **Pulado** ou **Inválido**. Falha, bloqueio e invalidação exigem uma observação. Ao salvar, o fluxo avança para o próximo caso manual pendente; na run local você pode desmarcar essa opção. Os filtros distinguem casos não testados, em andamento e com resultado. Resultados de automação não podem ser substituídos manualmente.

Os casos manuais do repositório local entram na preparação da run. Na página do Qase, **Automações desta run** abre o registro local ligado à mesma run, para executar as automações declaradas e publicar os resultados com confirmação. O Prumo lê todas as páginas de resultados antes de mostrar os casos pendentes.

## IDE vinculada ao repositório do projeto

A aba **Testes › IDE › Código** abre o repositório do **projeto selecionado**: a pasta local escolhida em Projetos ou o clone do GitHub vinculado. O explorador mostra pastas, código, documentação e configurações, não só arquivos de teste, e o editor (Monaco) grava arquivos de texto com confirmação nativa.

Por segurança e desempenho, o explorador não percorre pastas geradas (`.git`, `node_modules`, `dist`, `build`, caches), atalhos simbólicos nem arquivos reconhecidos como credenciais. A listagem local vai até 8.000 itens e 24 níveis, com aviso de truncamento. Arquivos binários e arquivos de texto acima de 300 KB não são editáveis; segredos detectados são mascarados e protegidos. Cada salvamento confere o hash original, para não sobrescrever uma alteração feita por outra ferramenta. As permissões seguem o papel: Testes VER lê, USAR grava. Nenhum arquivo é executado.

**Só com o GitHub vinculado**, o explorador consulta pastas e arquivos pelo vínculo autenticado, em modo de leitura. Em diretórios muito grandes, o limite da API GitHub Contents pode exigir um clone. Para editar, use **Trazer o repositório do GitHub**, que cria a cópia local depois de confirmação. Nada é enviado automaticamente.

Em **IDE › Pipelines CI/CD**, a fonte **Local** lista e edita só `.github/workflows/*.yml` e `*.yaml` da pasta vinculada. Com o GitHub vinculado, **Ver no GitHub** abre os workflows remotos na mesma IDE, somente leitura; **Pipelines locais** volta ao projeto editável. Salvar não executa pipeline nem publica; as mudanças só chegam ao GitHub com commit e push feitos por você. Sem pasta local, a tela mostra primeiro a estrutura remota e a opção de trazer uma cópia.

A IDE segue o desenho de um editor de código: barra de atividades (Explorador, Buscar, Controle de código-fonte, Executar e testes), abas com marca de alteração não salva, painel inferior (Problemas, Saída, Testes) e barra de status. Atalhos: Ctrl+G vai para a linha, Ctrl+S salva, Ctrl+B e Ctrl+J recolhem as barras. Buscar e Controle de código-fonte só leem: mostram resultados, ramo, arquivos alterados e diferenças. Commit, envio e PR não acontecem aqui; os botões levam a Agentes e Projetos.

O backend mantém os canais `ide:arvore`, `ide:arquivo` e `ide:gravar`, mais os somente leitura `ide:buscar`, `ide:gitestado` e `ide:gitdiff`, implementados em `backend/projetos/ideRepositorio.ts` e `backend/projetos/ideGit.ts` e registrados em `backend/projetos/controlador.ts`. A tela usa só `frontend/testes/tela-testes.parte.js`; a aparência fica em `frontend/design-system/`.
