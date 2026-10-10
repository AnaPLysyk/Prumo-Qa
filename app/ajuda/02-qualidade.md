# Como funciona a engenharia de qualidade

O Prumo oferece quatro capacidades à IA, por MCP:

- **contexto_projeto**: lê apenas os arquivos autorizados e descreve tecnologias, testes e comandos. Informa também o que está ausente.
- **revisar_cobertura**: recebe requisito, origem, testes existentes e cenários candidatos. Aponta falta de rastreabilidade, de resultado esperado, equivalências e redundâncias candidatas. O resultado é sempre NOT_VERIFIED: a análise é estrutural e não afirma que algo foi executado.
- **executar_validacao**: executa uma capacidade declarada em qa.project.json, depois de autenticação humana no Windows.
- **consultar_evidencias**: devolve resultados e logs reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.

O Prumo não inventa regras de negócio. Quando falta requisito, registra a lacuna e indica o que precisa ser esclarecido.

## Integrar um projeto

Crie um arquivo qa.project.json (schemaVersion 2) na raiz do projeto, declarando:

- context: caminhos de documentação, testes e código;
- commands: capacidades permitidas (comandos node ou npm run, sem shell);
- execution: requireApproval verdadeiro, variáveis permitidas, limites de tempo e saída.

Depois use **Projetos › Vincular pasta**. O Prumo valida o contrato e mostra a situação. Ele nunca cria nem altera arquivos do seu projeto.
