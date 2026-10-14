# Testes, tickets e integrações (2.13)

O Prumo lê os testes do seu repositório, mostra-os ao lado dos casos do Qase e, quando você autoriza, cria e atualiza itens no Jira, no Qase e no GitHub. Tudo é feito por ações suas, uma de cada vez.

## Testes

Testes tem quatro seções, na ordem do fluxo: caso de teste → automação → execução com evidências.

**IDE** usa a tela inteira, sem títulos, como um editor de código. À esquerda, a árvore dos arquivos de teste da pasta vinculada; no meio, o código com numeração e marcadores por teste (nível, tags, caso do Qase); à direita, o caso, os tickets, os resultados e as permissões reais dos agentes neste código. **Editar** abre o arquivo num editor com realce de sintaxe (TypeScript, JavaScript, Python, Gherkin); **Salvar** (ou Ctrl+S) pede a confirmação nativa do Windows e só grava se o arquivo não mudou fora do Prumo. **Novo arquivo** cria uma automação e, se você informar o caso do Qase, grava no arquivo a anotação `Qase: CHAVE-ID` que liga a automação ao caso. O Prumo só grava arquivos de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`) dentro da pasta vinculada, sem link simbólico e até 300 KB; arquivo com o que parece um segredo não é aberto para edição. Nada é executado. O modo **Pipelines CI/CD** lista os workflows do GitHub Actions (`.github/workflows`) do **mesmo repositório** vinculado ao projeto, com nome, eventos e jobs, e permite editá-los e criar novos (**Novo pipeline**). Salvar altera só o arquivo deste computador: o pipeline passa a valer no GitHub depois que você enviar o repositório. **Execuções no GitHub** mostra as execuções do GitHub Actions; o Prumo só escreve em branches `prumo/...`, nunca no principal, e abre o Pull Request como rascunho.

Se o projeto só tem o repositório do **GitHub** vinculado (sem pasta local), a IDE mostra o código somente leitura e oferece **Trazer o repositório do GitHub**: o Prumo baixa uma cópia para `%LOCALAPPDATA%\PrumoQAepositorios`, com o git instalado neste computador e as credenciais dele (o Prumo não entrega a sua credencial ao git), e vincula a pasta ao projeto. Depois, **Atualizar do GitHub** só avança a cópia, sem sobrescrever mudanças suas. Hooks e links simbólicos ficam desligados e nada é executado.

**Repositório** junta, numa lista única, os casos do Qase (quando vinculado) e os testes do código, manuais e automatizados. Um caso e um teste só ficam juntos por anotação explícita no próprio teste: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` ou `Qase: SFQ-31`. Nome parecido não liga nada. Cada linha mostra a situação (caso com código, manual, automação planejada, automatizado no Qase sem código encontrado, código que anota um caso inexistente ou código sem caso), o nível, as tags e o último resultado no Prumo. Abaixo da lista ficam as **propostas em revisão** (rascunhos de caso feitos por você, pelo Prumo ou por uma IA conectada, que esperam a sua revisão antes de ir para o Qase), as **suites** do Qase e os **vínculos declarados** (ticket ↔ caso ↔ automação). O detalhe do caso mostra passos, resultados locais e o código que o implementa, e tem o botão **Criar automação na IDE**. Sem o Qase vinculado, o repositório mostra o que existe no código da pasta.

**Runs** é uma lista só com tudo o que roda ou rodou: as execuções locais (manuais e agendadas, com as evidências e o comentário no Jira), as runs preparadas no Prumo e as runs do Qase. Filtre por origem e por situação (em andamento, concluídas, com falha). Uma run local registra resultados manuais, roda as automações associadas (cada uma pede a sua autenticação do Windows) e publica no Qase conferindo a run. **Evidências CLI/MCP** abre as evidências de validação gravadas na pasta do projeto.

**Planos** lista e cria os planos de teste do Qase, quando vinculado.

## Tickets

Jira e defeitos do Qase ficam numa tabela única, com a origem em cada linha e filtros por texto, origem, tipo, status e período. O detalhe do ticket mostra descrição, critérios, relações, comentários, histórico, anexos e transições. Comentar, anexar, mudar status, editar e criar ticket pedem confirmação com prévia.

Defeitos do Qase são somente leitura. Em um defeito, **Abrir ticket no Jira…** preenche um ticket novo e registra o vínculo defeito → ticket; com vínculo existente, o botão não aparece.

## Escrita externa

Fica desligada por padrão. Em Conexões, habilite por projeto e serviço. Cada operação mostra a prévia, pede a confirmação do Windows, usa uma chave que impede duplicar e confere o resultado relendo o serviço. Se a resposta se perder, repetir a operação não cria outro item. O Prumo não apaga nada.

## Agentes

Em Agentes, escolha as especializações do projeto e o que a IA pode pedir. O bloqueio vale a cada chamada MCP. A IA só propõe rascunhos; não cria aprovações, não escreve em serviços externos e não acessa credenciais.

## Início

O painel inicial resume o que está acontecendo no projeto e responde perguntas com os dados deste computador. Veja [Assistente, agentes e conhecimento](20-assistente-e-agentes.md).

## Atalhos e ajustes

F5 ou Ctrl+R atualiza a tela com os dados mais recentes. O botão de engrenagem abre tema, idioma e cor de destaque. O menu lateral pode ser recolhido.

## Limites

As escritas foram validadas contra serviços simulados; contas reais do Jira, Qase e GitHub ainda não foram exercitadas. A classificação de testes é uma inferência. O instalador não é assinado: confira o SHA-256 antes de executar.
