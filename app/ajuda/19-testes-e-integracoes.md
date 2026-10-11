# Testes, tickets e integrações (2.9)

O Prumo lê os testes do seu repositório, ajuda a refiná-los e, quando você autoriza, cria e atualiza itens no Jira, no Qase e no GitHub. Tudo é feito por ações suas, uma de cada vez.

## Testes

Em Testes há quatro seções.

**Catálogo** lê os arquivos de teste da pasta vinculada ao projeto (Playwright, Cypress, Jest/Vitest, Gherkin `.feature` e `test_*.py`), agrupa por feature e mostra cenários e passos. Cada teste recebe um tipo: unitário, integração, funcional, regressão, smoke, desempenho ou acessibilidade. A classificação é inferida por tag (`@smoke`, `@regression`), caminho e conteúdo; passe o mouse no tipo para ver o motivo e a confiança. Nada é executado: é leitura do repositório. Sem pasta vinculada, o catálogo pede para vincular uma.

**Casos e propostas** aparece quando o Qase está vinculado. Rascunhos feitos por você, pelo Prumo ou por uma IA conectada ficam aqui até você revisar (duplicidade, requisito, risco e cobertura) e publicar. Nada vai ao Qase sem a sua confirmação.

**Planos e execuções** monta a execução com os casos escolhidos, roda as automações associadas (cada uma pede a sua autenticação do Windows), registra os resultados e publica no Qase conferindo a run. Feature é o plano, cenário é o caso e execução é o relatório.

**Automação** mostra o contrato da pasta e as execuções do GitHub Actions. O Prumo só escreve em branches `prumo/...`, nunca no principal, e abre o Pull Request como rascunho.

## Tickets

Busque no Jira por texto, tipo, status e data. O detalhe mostra descrição, critérios de aceite, histórico, anexos e transições. Comentar, anexar arquivo, mudar status e criar ticket pedem confirmação com prévia.

## Escrita externa

Fica desligada por padrão. Em Conexões, habilite por projeto e serviço. Cada operação mostra a prévia, pede a confirmação do Windows, usa uma chave que impede duplicar e confere o resultado relendo o serviço. Se a resposta se perder, repetir a operação não cria outro item. O Prumo não apaga nada.

## Agentes

Em Agentes, escolha as especializações do projeto e o que a IA pode pedir. O bloqueio vale a cada chamada MCP. A IA só propõe rascunhos; não cria aprovações, não escreve em serviços externos e não acessa credenciais.

## Início

O painel inicial resume o que está acontecendo no projeto e responde perguntas com os dados deste computador (contextos aprovados, propostas, execuções e agenda). Não usa modelo de IA nem rede.

## Atalhos e ajustes

F5 ou Ctrl+R atualiza a tela com os dados mais recentes. O botão de engrenagem abre tema, idioma e cor de destaque. O menu lateral pode ser recolhido.

## Limites

As escritas foram validadas contra serviços simulados; contas reais do Jira, Qase e GitHub ainda não foram exercitadas. A classificação de testes é uma inferência. O instalador não é assinado: confira o SHA-256 antes de executar.
