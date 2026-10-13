# Testes, tickets e integrações (2.10)

O Prumo lê os testes do seu repositório, mostra-os ao lado dos casos do Qase e, quando você autoriza, cria e atualiza itens no Jira, no Qase e no GitHub. Tudo é feito por ações suas, uma de cada vez.

## Testes

Testes representa o que existe no Qase **e** no código do projeto, em abas.

**Visão geral** junta casos do Qase e testes do repositório numa lista única. Um caso e um teste só ficam juntos por anotação explícita no próprio teste: `qase(31, …)`, `qase.id(31)`, `@qase(31)`, `@qase-31` ou `Qase: SFQ-31`. Nome parecido não liga nada. Cada linha mostra a situação (caso com código, manual, automação planejada, automatizado no Qase sem código encontrado, código que anota um caso inexistente ou código sem caso), o nível (unitário, API, E2E…), as tags e o último resultado no Prumo. Filtre por fonte, nível, execução e tag; agrupe por tag, feature ou nível.

**Código** é uma visão somente leitura dos arquivos de teste: árvore de pastas, leitor com numeração e marcadores por teste (nível, tags, caso do Qase) e um painel com o caso, os tickets, os resultados e as permissões reais dos agentes neste código. Só arquivos de teste dentro da pasta vinculada, sem link simbólico, até 300 KB e com segredos mascarados. A classificação vem de tag (`@smoke`, `@regression`), caminho e conteúdo, com motivo e confiança. Nada é executado.

**Casos Qase**, **Suites** e **Planos** aparecem quando o Qase está vinculado. O detalhe do caso mostra passos, resultados locais, associação a ticket, declaração de automação e o código que o implementa. Rascunhos feitos por você, pelo Prumo ou por uma IA conectada esperam a sua revisão (duplicidade, requisito, risco e cobertura) antes de publicar.

**Runs** reúne as runs preparadas no Prumo e as do Qase. Uma run local registra resultados manuais, roda as automações associadas (cada uma pede a sua autenticação do Windows) e publica no Qase conferindo a run.

**CI e GitHub** mostra o contrato da pasta e as execuções do GitHub Actions. O Prumo só escreve em branches `prumo/...`, nunca no principal, e abre o Pull Request como rascunho.

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
