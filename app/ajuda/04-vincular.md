# Como vincular um projeto

Um projeto se integra ao Prumo por um arquivo **qa.project.json** (schemaVersion 2) na raiz da pasta. Ele declara:

- **context**: caminhos de documentação, testes e código que o Prumo pode ler;
- **commands**: capacidades permitidas, sempre comandos node ou npm run, sem shell;
- **execution**: aprovação humana obrigatória, variáveis permitidas, limites de tempo e de saída.

Em **Projetos › Vincular pasta**, escolha a pasta no seletor do Windows. O Prumo valida o contrato:

- **INTEGRADO**: contrato válido; o projeto entra na lista.
- **SEM MANIFESTO** ou **MANIFESTO INVÁLIDO**: nada é vinculado e a janela mostra o diagnóstico e as instruções.

O Prumo **nunca cria nem altera arquivos do projeto**. Ele só lê o que o contrato autoriza, sem sair da raiz, sem seguir links simbólicos e sem tocar em arquivos de credenciais. **Desvincular** remove apenas o item da lista.
