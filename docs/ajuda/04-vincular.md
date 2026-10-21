# Como vincular um projeto

## Origem e isolamento dos projetos

**Projetos** é o cadastro central do Prumo QA. Cada projeto tem seu próprio ID, pasta de contexto, histórico, relações, repositório local opcional e até um vínculo por serviço. Os vínculos de outros projetos não são reutilizados nem associados por semelhança de nomes.

- **Criar projeto manual:** cria um espaço Prumo sem conexões externas.
- **Importar projetos do Jira:** escolhe uma conta conectada, consulta os projetos disponíveis e cria um espaço por projeto escolhido.
- **Importar projetos do Qase (TMS):** permite escolher projetos de uma conta já vinculada; o fluxo de prévia e token em Projetos continua disponível.
- **Importar projetos do GitHub:** escolhe um repositório remoto e cria seu espaço Prumo, sem clonagem automática.
- **Vincular Jira ou Qase a um projeto existente:** acrescenta somente o serviço selecionado ao espaço escolhido. O repositório GitHub ou a pasta local também podem ser vinculados explicitamente.

A criação/importação exige confirmação na janela nativa do aplicativo; os recursos externos são revalidados no backend antes de serem persistidos. Uma reimportação da mesma identidade remota retorna o projeto existente, sem criar duplicata. Projetos Qase ambíguos entre contas distintas são recusados. A importação não cria vínculos Jira/Qase/GitHub cruzados, não executa código nem publica ou altera recursos remotos.

**Permissões:** leitura de projetos e seus recursos exige Projetos VER; importação, criação e novos vínculos exigem Projetos USAR. Credenciais são administradas dentro da área de conexões de Projetos. A IDE trabalha somente com o repositório local ou GitHub associado ao projeto selecionado. Cada tela deve utilizar o ID do projeto selecionado para escopar todas as consultas, execuções, casos, tickets e evidências.

**Manutenção:** alterações de comportamento de Projetos em `frontend/projetos/tela-projetos.js`; identidade, contratos, persistência e vínculo inicial em `backend/projetos/controlador.ts`, `servicoProjetos.ts`, `contratos.ts` e `banco/projetos.ts`. Validação das contas e APIs externas pertence a `backend/conexoes/`. Os controles e toda a aparência da interface continuam centralizados em `frontend/design-system/`, inclusive os botões e campos compartilhados.


Você pode vincular qualquer pasta de código. O Prumo só grava nela o contrato depois que você aprová-lo.

O contrato é o arquivo **qa.project.json** (schemaVersion 2) na raiz da pasta:

- **context**: arquivos e pastas que o Prumo pode ler;
- **commands**: comandos permitidos. São comandos `node` ou `npm run`; não é permitido executar comandos livres do sistema;
- **execution**: regras de execução, incluindo aprovação, variáveis permitidas e limites de tempo e de saída.

## Vincular uma pasta

Em **Projetos**, selecione o projeto e clique na bolha **Pasta local** > **Escolher pasta** para vincular os arquivos do computador:

- **Já tem qa.project.json válido:** vincula na hora.
- **Não tem `qa.project.json`:** o Prumo identifica a tecnologia pelos arquivos da pasta (como `package.json`, `pyproject.toml` ou `go.mod`) e mostra uma proposta. O arquivo só é criado quando você escolhe **Criar contrato e vincular**.
- **qa.project.json inválido:** nada é vinculado. A mensagem explica o motivo; corrija o arquivo ou apague-o para receber uma proposta nova.

## Vincular um repositório do GitHub

Com uma conta GitHub conectada, abra a bolha **GitHub** no projeto e selecione **Projetos disponíveis**:

- **Vincular** associa o repositório ao projeto.
- **Vincular e trazer para este computador** também baixa uma cópia (com o git instalado e as credenciais dele) e a vincula como pasta do projeto.

## O que entra no contrato proposto

- **Node.js (npm):** npm run para os scripts de teste, build, lint, typecheck ou check que existem no package.json. Scripts de e2e, integração, deploy, publicação, migração ou banco ficam bloqueados até você revisar.
- **Python, Go, Java, .NET, Rust, PHP e Ruby:** o contrato permite **somente leitura**. O Prumo, os agentes e o MCP podem ler o código e os testes, mas ainda não podem executá-los.
- Nada roda ao vincular. Cada execução pede a sua aprovação.

Depois, você pode editar o `qa.project.json` como qualquer outro arquivo do projeto.

## O que o Prumo grava na pasta

- o contrato que você aprovou (nunca sobrescreve um existente);
- arquivos de teste e pipelines salvos em **Testes › IDE**, um por vez, com a confirmação do sistema;
- as evidências e relatórios das execuções, em .prumo;
- a cópia do GitHub, quando você usa **Vincular e trazer para este computador** (clone ou atualização só por avanço).

Fora isso, o Prumo só lê o que o contrato autoriza, sem sair da raiz, sem seguir links simbólicos e sem tocar em arquivos de credenciais. **Desvincular** remove só o vínculo; o qa.project.json e o histórico continuam.

## Conexões dentro de cada projeto

**Projetos** usa uma bancada única, sem empilhar projetos ou abrir uma segunda tela. Clique na bolha Jira, Qase, GitHub ou Pasta local para abrir o painel do serviço; **Fechar** devolve o mapa original. **Contas e permissões** oferece a visão geral. A conta autorizada fica no cofre e pode ser reutilizada, mas o recurso escolhido, seus vínculos, a pasta e a permissão de escrita são **por projeto**. Remover uma credencial compartilhada pode afetar outros projetos; remover um vínculo não remove a credencial nem altera o serviço externo.

Sem projetos, a tela começa vazia: **Criar projeto manual** cria um projeto sem conexões. **Importar do Qase/Jira/GitHub** abre a autorização da conta e a seleção dos recursos. Importar cria um projeto independente; vincular pela bolha de um projeto existente não mistura projetos. O Qase permite informar um token, consultar projetos e importar os escolhidos.

O seletor lateral troca o ID do projeto ativo, atualiza o nome e renova o conteúdo dos módulos pela navegação comum. No menu, as legendas de Tickets e Testes mostram as fontes habilitadas para o projeto atual. Funcionalidades manuais continuam disponíveis independentemente das conexões. O contexto visual do menu fica em frontend/compartilhado/navegacaoDaJanela.js; sua aparência em frontend/design-system/ds.css. Credenciais e validações de API permanecem no backend de conexões por segurança.

Para alternar entre vários projetos, use **Trocar projeto** dentro da bolha central ou clique no nome do projeto no topo da bancada. O seletor do menu lateral continua disponível. A troca ocorre pelo ID e atualiza as fontes de Tickets, Testes e os demais módulos sem compartilhar vínculos entre projetos parecidos. A bancada não rola; somente painéis de seleção com muitas contas ou recursos têm rolagem própria.
