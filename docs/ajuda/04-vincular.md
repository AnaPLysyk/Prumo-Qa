# Como vincular um projeto

**Projetos** é o cadastro central do Prumo QA. A tela mostra um projeto por vez, com **Novo projeto**, **Importar** e **Editar**. Cada projeto tem seu próprio ID, pasta de contexto, histórico, relações, repositório local opcional e no máximo um vínculo por serviço. Vínculos de outros projetos nunca são reaproveitados nem associados por semelhança de nome.

## Criar, importar e vincular

- **Novo projeto:** cria um projeto do Prumo sem conexões externas.
- **Importar:** escolha Jira, Qase ou GitHub, depois uma conta conectada e os recursos. Jira e Qase criam um projeto por recurso escolhido; o GitHub importa um repositório remoto, sem clonar. No Qase, você também pode informar um token e consultar os projetos antes de importar.
- **Vincular a um projeto existente:** o painel do serviço acrescenta só o serviço escolhido. O repositório do GitHub e a pasta local também se vinculam por aí.

Criar e importar pedem confirmação em uma caixa do próprio aplicativo, e o backend revalida os recursos externos antes de gravar. Importar de novo o mesmo recurso devolve o projeto que já existe. Projetos do Qase ambíguos entre contas diferentes são recusados. A importação não cria vínculos cruzados entre Jira, Qase e GitHub, não executa código e não publica nem altera nada no serviço remoto.

**Permissões:** ver projetos e seus recursos exige Projetos VER; importar, criar e vincular exigem Projetos USAR. A IDE só trabalha com o repositório local ou do GitHub do projeto selecionado, e as telas usam o ID do projeto selecionado em consultas, execuções, casos, tickets e evidências.

## Conexões do projeto

As conexões ficam no mapa de conexões de **Projetos**, não no menu. Clique em **Jira**, **Qase**, **GitHub** ou **Pasta local** para abrir o painel do serviço; **Fechar** volta ao mapa. **Contas e permissões** mostra a visão geral.

A conta autorizada fica no cofre e pode ser reaproveitada. O recurso escolhido, o vínculo, a pasta e a permissão de escrita valem **por projeto**. Remover uma credencial compartilhada pode afetar outros projetos. Remover um vínculo não apaga a credencial nem altera o serviço externo.

Sem projetos, a tela começa vazia: crie um projeto ou importe do Qase, do Jira ou do GitHub. Para trocar de projeto, use **Trocar projeto** no centro do mapa, o nome do projeto no topo ou o seletor do menu lateral. A troca renova Tickets, Testes e os demais módulos, e as legendas de Tickets e Testes mostram as fontes ligadas ao projeto atual. As funções manuais continuam disponíveis sem conexões.

## O contrato do projeto

O arquivo **qa.project.json** (schemaVersion 2), na raiz da pasta, define o que o Prumo pode fazer nela:

- **context**: arquivos e pastas que o Prumo pode ler;
- **commands**: comandos permitidos, só `node` e `npm run`. Comandos livres do sistema não são aceitos;
- **execution**: regras de execução, com aprovação, variáveis permitidas e limites de tempo e de saída.

Você pode vincular qualquer pasta de código. O Prumo só grava o contrato nela depois que você o aprova.

### Vincular uma pasta

No painel **Pasta local** do projeto, use **Escolher pasta**:

- **Já tem um qa.project.json válido:** o vínculo é imediato.
- **Não tem `qa.project.json`:** o Prumo identifica a tecnologia pelos arquivos da pasta (`package.json`, `pyproject.toml`, `go.mod`...) e mostra uma proposta. O arquivo só é criado quando você escolhe **Criar contrato e vincular**.
- **qa.project.json inválido:** nada é vinculado. A mensagem explica o motivo; corrija o arquivo ou apague-o para receber uma proposta nova.

### Vincular um repositório do GitHub

Com uma conta GitHub conectada, abra o painel **GitHub** do projeto e vá em **Projetos disponíveis**:

- **Vincular** associa o repositório ao projeto.
- **Vincular e trazer para este computador** também baixa uma cópia (com o git instalado e as credenciais dele) e a vincula como pasta do projeto.

### O que entra no contrato proposto

- **Node.js (npm):** `npm run` para os scripts de teste, build, lint, typecheck ou check que existem no package.json. Scripts de e2e, integração, deploy, publicação, migração ou banco ficam bloqueados até você revisar.
- **Python, Go, Java, .NET, Rust, PHP e Ruby:** o contrato permite **somente leitura**. O Prumo, os agentes e o MCP leem código e testes, mas não os executam.
- Nada roda ao vincular. Cada execução pede a sua aprovação.

Depois, você pode editar o `qa.project.json` como qualquer outro arquivo do projeto.

### O que o Prumo grava na pasta

- o contrato que você aprovou (nunca sobrescreve um existente);
- arquivos de teste e pipelines salvos em **Testes › IDE**, um por vez, com confirmação;
- as evidências e os relatórios das execuções, em `.prumo`;
- a cópia do GitHub, quando você usa **Vincular e trazer para este computador** (clone ou atualização só por avanço).

Fora isso, o Prumo só lê o que o contrato autoriza, sem sair da raiz, sem seguir links simbólicos e sem tocar em arquivos de credenciais. **Desvincular** remove só o vínculo: o qa.project.json e o histórico continuam.
