# Testes, tickets e integrações

O Prumo mostra os testes do repositório junto com os casos do Qase. Se você autorizar, também pode criar ou atualizar itens no Jira, Qase e GitHub.

## Com e sem conexões

**Testes** e **Tickets** funcionam mesmo sem conectar serviços. Os testes vêm da pasta do projeto. Propostas, execuções e tickets locais ficam neste computador. Ao conectar um serviço, seus dados aparecem no Prumo:

- **Qase**: casos e suites em Repositório, runs em Runs, planos em Planos e defeitos em Tickets. Em Conexões, **Conectar Qase** pede só o token, lista os projetos da conta e cada um escolhido vira um projeto Prumo já vinculado.
- **Jira**: tickets em Tickets.
- **GitHub**: repositório e pipelines em Testes e issues abertas em Tickets. Em Projetos, **Escolher repositório do GitHub…** lista os repositórios da conta; **Vincular** associa ao projeto e **Vincular e trazer para este computador** também baixa uma cópia, com confirmação.

Você pode conectar um serviço depois e publicar o que preparou localmente. Para ligar um projeto criado à mão a um projeto que já existe, use **Listar recursos disponíveis** na linha da conta em **Conexões**.

Ao criar o token, libere as permissões listadas no formulário de cada serviço. No GitHub (token *fine-grained*): **Issues** com leitura e escrita; **Contents**, **Pull requests** e **Actions** só leitura. Sem escrita em Issues, o GitHub cria a issue mas descarta os rótulos.

## Testes

As seções acompanham o fluxo de trabalho: caso de teste, automação e execução com evidências.

### IDE

Na tela **IDE**, à esquerda ficam os arquivos de teste. No centro, você vê e edita o código. À direita, aparecem o caso, os tickets, os resultados e as permissões dos agentes.

- **Editar** abre um editor com realce de sintaxe (TypeScript, JavaScript, Python, Gherkin). **Salvar** (Ctrl+S) pede a confirmação do sistema e só grava se o arquivo não mudou fora do Prumo.
- **Novo arquivo** cria uma automação. Com o caso do Qase informado, grava a anotação `Qase: CHAVE-ID` que liga os dois.
- O Prumo só grava arquivos de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) dentro da pasta vinculada, sem atalhos para outras pastas e com até 300 KB. Arquivos que parecem conter segredos não podem ser editados. Salvar não executa o teste.
- **Pipelines CI/CD** lista, edita e cria (**Novo pipeline**) os workflows do GitHub Actions (`.github/workflows`) do repositório vinculado. Salvar altera só o arquivo local; o pipeline vale no GitHub quando você enviar o repositório. **Execuções no GitHub** mostra as execuções do Actions. O Prumo só escreve em branches `prumo/...`, nunca na principal, e abre o Pull Request como rascunho.

Se você vinculou apenas o GitHub e ainda não tem uma cópia local, a IDE permite ler os arquivos e oferece **Trazer o repositório do GitHub**. O Prumo usa o Git e as credenciais já configuradas no computador para baixar uma cópia para a pasta de dados dele. **Atualizar do GitHub** só incorpora mudanças que não apagam seu trabalho. Scripts de Git e links simbólicos ficam desativados.

### Repositório

Esta lista reúne os casos do Qase e os testes manuais e automatizados do código. Um caso só é ligado a um teste quando o próprio teste contém uma anotação, como `qase(31, …)`, `@qase-31` ou `Qase: SFQ-31`. Nomes parecidos não criam vínculos.

Cada linha mostra o tipo de teste, o nível, as tags e o último resultado. Abaixo aparecem as propostas que aguardam revisão, as suítes do Qase e os vínculos registrados entre tickets, casos e automações. Uma proposta é um rascunho criado por você, pelo Prumo ou por uma IA; revise-a antes de enviá-la ao Qase. No detalhe de um caso, você pode ver os passos, os resultados locais e o código, ou escolher **Criar automação na IDE**.

### Runs

Esta lista reúne as execuções locais (manuais ou agendadas), as execuções preparadas no Prumo e as execuções do Qase. Use os filtros para escolher a origem ou o estado.

Uma execução local pode guardar resultados manuais, executar automações associadas (com autenticação do sistema) e publicar resultados no Qase após conferir a execução. Sem conexão ao Qase, **Preparar run** usa os testes do código e guarda a execução apenas neste computador. Para publicar no Qase, crie os casos nesse serviço e prepare uma nova execução.

**Evidências CLI/MCP** abre as evidências gravadas na pasta do projeto.

### Planos

Lista e cria os planos de teste do Qase.

## Tickets

Tickets do Jira, defeitos do Qase, chamados do GitHub e rascunhos locais aparecem na mesma tabela. Cada linha mostra a origem. Você pode filtrar por texto, origem, tipo, estado ou período. O detalhe mostra descrição, critérios, relações, comentários, histórico, anexos e mudanças de estado. Para comentar, anexar, mudar o estado, editar ou criar um item, o Prumo pede confirmação e mostra uma prévia.

**Novo rascunho local** cria um bug ou uma melhoria sem enviar nada. No rascunho, **Destino da publicação** oferece só o que está vinculado ao projeto:

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
