# Como vincular um projeto

Você pode vincular qualquer pasta de código. O Prumo só grava nela o contrato depois que você aprová-lo.

O contrato é o arquivo **qa.project.json** (schemaVersion 2) na raiz da pasta:

- **context**: arquivos e pastas que o Prumo pode ler;
- **commands**: comandos permitidos. São comandos `node` ou `npm run`; não é permitido executar comandos livres do sistema;
- **execution**: regras de execução, incluindo aprovação, variáveis permitidas e limites de tempo e de saída.

## Vincular uma pasta

Em **Projetos**, no projeto, use **Vincular repositório local…** (ou, no fim da página, em Pastas com contrato local, **Vincular pasta…**) e escolha a pasta:

- **Já tem qa.project.json válido:** vincula na hora.
- **Não tem `qa.project.json`:** o Prumo identifica a tecnologia pelos arquivos da pasta (como `package.json`, `pyproject.toml` ou `go.mod`) e mostra uma proposta. O arquivo só é criado quando você escolhe **Criar contrato e vincular**.
- **qa.project.json inválido:** nada é vinculado. A mensagem explica o motivo; corrija o arquivo ou apague-o para receber uma proposta nova.

## Vincular um repositório do GitHub

Com uma conta do GitHub conectada, use **Escolher repositório do GitHub…** no projeto:

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
