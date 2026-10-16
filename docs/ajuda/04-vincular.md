# Como vincular um projeto

O vínculo funciona com qualquer pasta de código, mas eu fiz questão de que nada seja gravado nela sem você aprovar o contrato.

O contrato é o arquivo **qa.project.json** (schemaVersion 2) na raiz da pasta:

- **context**: documentação, testes e código que o Prumo pode ler;
- **commands**: capacidades permitidas, sempre node ou npm run, sem shell;
- **execution**: aprovação humana obrigatória, variáveis permitidas, limites de tempo e de saída.

## Vincular uma pasta

Em **Projetos**, no projeto, use **Vincular repositório local…** (ou, no fim da página, em Pastas com contrato local, **Vincular pasta…**) e escolha a pasta:

- **Já tem qa.project.json válido:** vincula na hora.
- **Não tem qa.project.json:** o Prumo detecta a stack pelos arquivos da raiz (package.json, pyproject.toml, go.mod, pom.xml, build.gradle, .csproj, Cargo.toml, composer.json, Gemfile) e mostra o contrato proposto. O arquivo só é criado se você clicar em **Criar contrato e vincular**.
- **qa.project.json inválido:** nada é vinculado. A mensagem explica o motivo; corrija o arquivo ou apague-o para receber uma proposta nova.

## Vincular um repositório do GitHub

Com uma conta do GitHub conectada, use **Escolher repositório do GitHub…** no projeto:

- **Vincular** associa o repositório ao projeto.
- **Vincular e trazer para este computador** também baixa uma cópia (com o git instalado e as credenciais dele) e a vincula como pasta do projeto.

## O que entra no contrato proposto

- **Node.js (npm):** npm run para os scripts de teste, build, lint, typecheck ou check que existem no package.json. Scripts de e2e, integração, deploy, publicação, migração ou banco ficam bloqueados até você revisar.
- **Python, Go, Java, .NET, Rust, PHP e Ruby:** contrato **somente leitura**. O Prumo, os agentes e o MCP leem código e testes; rodar pytest, go test, mvn, dotnet test ou cargo pelo Prumo ainda não é possível.
- Nada roda ao vincular. Cada execução pede a sua aprovação.

Depois você pode editar o qa.project.json como qualquer arquivo do repositório.

## O que o Prumo grava na pasta

- o contrato que você aprovou (nunca sobrescreve um existente);
- arquivos de teste e pipelines salvos em **Testes › IDE**, um por vez, com a confirmação do sistema;
- as evidências e relatórios das execuções, em .prumo;
- a cópia do GitHub, quando você usa **Vincular e trazer para este computador** (clone ou atualização só por avanço).

Fora isso, o Prumo só lê o que o contrato autoriza, sem sair da raiz, sem seguir links simbólicos e sem tocar em arquivos de credenciais. **Desvincular** remove só o vínculo; o qa.project.json e o histórico continuam.
