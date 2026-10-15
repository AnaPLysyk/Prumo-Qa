# Testes, tickets e integrações

O Prumo lê os testes do repositório, mostra-os ao lado dos casos do Qase e, com a sua autorização, cria e atualiza itens no Jira, no Qase e no GitHub.

## Com e sem conexões

Testes e Tickets funcionam sem nenhuma conexão: os testes vêm da pasta do repositório, e propostas, runs e tickets locais ficam neste computador. Cada conexão acrescenta dados:

- **Qase**: casos e suites em Repositório, runs em Runs e planos em Planos.
- **Jira**: tickets em Tickets.
- **GitHub**: repositório e pipelines em Testes. Em Projetos, **Escolher repositório do GitHub…** lista os repositórios da conta; **Vincular** associa ao projeto e **Vincular e trazer para este computador** também baixa uma cópia, com confirmação.

O que foi feito localmente pode ser publicado depois de conectar.

## Testes

Quatro seções, na ordem do fluxo: caso de teste → automação → execução com evidências.

### IDE

Tela inteira, sem títulos. À esquerda a árvore dos arquivos de teste; no meio o código, com marcadores de nível, tags e caso do Qase; à direita o caso, os tickets, os resultados e as permissões dos agentes.

- **Editar** abre um editor com realce de sintaxe (TypeScript, JavaScript, Python, Gherkin). **Salvar** (Ctrl+S) pede a confirmação do Windows e só grava se o arquivo não mudou fora do Prumo.
- **Novo arquivo** cria uma automação. Com o caso do Qase informado, grava a anotação `Qase: CHAVE-ID` que liga os dois.
- Só grava arquivos de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) dentro da pasta vinculada, sem link simbólico e até 300 KB. Arquivo com aparência de segredo não abre para edição. Nada é executado.
- **Pipelines CI/CD** lista, edita e cria (**Novo pipeline**) os workflows do GitHub Actions (`.github/workflows`) do repositório vinculado. Salvar altera só o arquivo local; o pipeline vale no GitHub quando você enviar o repositório. **Execuções no GitHub** mostra as execuções do Actions. O Prumo só escreve em branches `prumo/...`, nunca na principal, e abre o Pull Request como rascunho.

Com só o GitHub vinculado, sem pasta local, a IDE é somente leitura e oferece **Trazer o repositório do GitHub**. O Prumo baixa uma cópia para `%LOCALAPPDATA%\PrumoQA\repositorios`, com o git instalado e as credenciais dele, e a vincula ao projeto. **Atualizar do GitHub** só avança a cópia, sem sobrescrever o seu trabalho. Hooks e links simbólicos ficam desligados.

### Repositório

Lista única com os casos do Qase e os testes do código, manuais e automatizados. Um caso e um teste só se juntam por anotação explícita no teste: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` ou `Qase: SFQ-31`. Nome parecido não liga nada.

Cada linha mostra a situação (caso com código, manual, automação planejada, automatizado no Qase sem código, código que anota um caso inexistente ou código sem caso), o nível, as tags e o último resultado. Abaixo da lista ficam as propostas em revisão, as suites do Qase e os vínculos declarados (ticket ↔ caso ↔ automação). Uma proposta é um rascunho de caso, seu, do Prumo ou de uma IA, que espera revisão antes de ir ao Qase. O detalhe do caso mostra passos, resultados locais e o código, e tem **Criar automação na IDE**.

### Runs

Lista única com as execuções locais (manuais e agendadas, com evidências e comentário no Jira), as runs preparadas no Prumo e as runs do Qase, com filtro por origem e situação.

Uma run local registra resultados manuais, roda as automações associadas (cada uma pede a autenticação do Windows) e publica no Qase conferindo a run. Sem o Qase, **Preparar run** usa os testes do código: a run fica só neste computador e não pode ser criada no Qase, porque esses casos não existem lá. Para publicar, crie os casos no Qase e prepare outra run.

**Evidências CLI/MCP** abre as evidências gravadas na pasta do projeto.

### Planos

Lista e cria os planos de teste do Qase.

## Tickets

Tickets do Jira, defeitos do Qase e tickets locais ficam numa tabela única, com a origem em cada linha e filtros por texto, origem, tipo, status e período. O detalhe mostra descrição, critérios, relações, comentários, histórico, anexos e transições. Comentar, anexar, mudar status, editar e criar pedem confirmação com prévia.

Em **Locais (Prumo)** você cria e revisa bugs e melhorias sem enviar nada a um serviço, classifica a falha, vincula a um ticket existente ou publica no Jira depois da revisão.

Defeitos do Qase são somente leitura. **Abrir ticket no Jira…** preenche um ticket novo e registra o vínculo defeito → ticket; com vínculo existente, o botão não aparece.

## Escrita externa

Desligada por padrão; habilite por projeto e serviço em Conexões. Cada operação mostra a prévia, pede a confirmação do Windows, usa uma chave que impede duplicar e confere o resultado relendo o serviço. Se a resposta se perder, repetir não cria outro item. O Prumo não apaga nada.

## Atalhos

F5 ou Ctrl+R atualiza a tela. A engrenagem abre Meu perfil, Aparência (tema, idioma e cor de destaque) e Assistente. O menu lateral pode ser recolhido.

## Limites

As escritas foram validadas contra serviços simulados; contas reais do Jira, Qase e GitHub ainda não foram exercitadas. A classificação dos testes é uma inferência. O instalador não é assinado: confira o SHA-256 antes de executar.

Sobre agentes e o chat, veja [Assistente, agentes e conhecimento](20-assistente-e-agentes.md).
