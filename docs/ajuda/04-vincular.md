# Como vincular um projeto

Um projeto se integra ao Prumo por um arquivo **qa.project.json** (schemaVersion 2) na raiz da pasta. Ele declara:

- **context**: caminhos de documentação, testes e código que o Prumo pode ler;
- **commands**: capacidades permitidas, sempre comandos node ou npm run, sem shell;
- **execution**: aprovação humana obrigatória, variáveis permitidas, limites de tempo e de saída.

Em **Projetos › Vincular pasta**, escolha a pasta do repositório no seletor do Windows. Funciona com qualquer pasta de código:

- **Já tem qa.project.json válido**: o projeto é vinculado na hora.
- **Ainda não tem qa.project.json**: o Prumo detecta a stack pelos arquivos da raiz (package.json, pyproject.toml, go.mod, pom.xml, build.gradle, .csproj, Cargo.toml, composer.json, Gemfile) e mostra o contrato proposto: pastas de documentação, testes e código, comandos e observações. Só se você clicar em **Criar contrato e vincular** o arquivo é criado e a pasta vinculada.
- **qa.project.json inválido**: nada é vinculado. A mensagem explica o problema; corrija o arquivo, ou apague-o para o Prumo propor um novo.

## O que entra no contrato proposto

- **Node.js (npm)**: comandos `npm run` para os scripts de teste, build, lint ou typecheck que existem no package.json. Scripts de e2e, integração, deploy, publicação, migração ou banco ficam bloqueados até você revisar.
- **Python, Go, Java, .NET, Rust, PHP e Ruby**: o contrato fica **somente leitura**. O Prumo, os agentes e o MCP leem o código e os testes, e o catálogo funciona; executar pytest, go test, mvn, dotnet test ou cargo pelo Prumo ainda não é possível.
- Nada é executado ao vincular. Cada execução continua pedindo a sua aprovação.

Você pode editar o qa.project.json depois, como qualquer arquivo do repositório.

## O que o Prumo nunca faz

Criar o contrato aprovado é a **única** escrita do Prumo na pasta do projeto, e ele nunca sobrescreve um contrato existente. Fora isso, só lê o que o contrato autoriza, sem sair da raiz, sem seguir links simbólicos e sem tocar em arquivos de credenciais. **Desvincular** remove apenas o item da lista; o qa.project.json continua na pasta.
