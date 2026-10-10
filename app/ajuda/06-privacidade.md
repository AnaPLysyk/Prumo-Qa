# Política de privacidade (rascunho)

Rascunho técnico consistente com o funcionamento atual. Requer revisão humana e jurídica antes de qualquer distribuição ampla. Não afirma conformidade com leis ou certificações.

## O que é armazenado, e onde

- Histórico de operações: arquivos em %LOCALAPPDATA%\PrumoQA\projects. Contêm identificadores com hash, ferramenta, cliente declarado, estado, duração, contagens de achados e referências a evidências. Não guardam o texto de requisitos nem respostas completas.
- Lista de projetos vinculados: %LOCALAPPDATA%\PrumoQA\vinculos.json (caminhos locais que você escolheu).
- Evidências de execução: pasta .prumo/evidencias dentro do projeto, com logs mascarados.
- Dados internos da janela: %LOCALAPPDATA%\PrumoQA\app.

## O que é enviado a clientes externos

O servidor MCP responde ao cliente de IA que o iniciou. O que ele retorna (contexto autorizado, análises, evidências) passa a ser tratado pelo cliente e por seu provedor segundo as políticas deles.

## O que não é coletado

Nenhuma telemetria, rastreamento, upload de logs ou sincronização. O aplicativo não faz requisições de rede e funciona sem internet. Exportar logs é ação sua e grava apenas onde você escolher.

## Desinstalação

Desinstalar remove o programa, mas mantém seus dados e evidências. Para apagar também o histórico, remova a pasta %LOCALAPPDATA%\PrumoQA.
