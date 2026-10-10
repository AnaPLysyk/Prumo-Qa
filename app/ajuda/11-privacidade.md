# Política de privacidade (rascunho)

Rascunho técnico consistente com o funcionamento atual. Requer revisão humana e jurídica antes de qualquer distribuição ampla. Não afirma conformidade com leis ou certificações.

## O que é armazenado, e onde

- **Histórico de operações**: %LOCALAPPDATA%\PrumoQA\projects. Identificadores com hash, ferramenta, cliente declarado, estado, duração, contagens de achados e referências a evidências. Não guarda o texto de requisitos nem respostas completas.
- **Diagnóstico da interface**: %LOCALAPPDATA%\PrumoQA\diagnostico. Somente canal, estado, duração, código e correlação das chamadas da janela; nunca argumentos, caminhos ou conteúdo. Não entra nas métricas.
- **Contextos**: %LOCALAPPDATA%\PrumoQA\contextos. Requisitos e regras que você cadastra, por projeto, com histórico verificável. Só vão ao agente de IA se você habilitar essa opção para o projeto, e então o provedor da IA conectada pode processar o texto.
- **Projetos vinculados**: %LOCALAPPDATA%\PrumoQA\vinculos.json (caminhos locais que você escolheu).
- **Evidências de execução**: pasta .prumo/evidencias dentro de cada projeto, com logs mascarados.
- **Dados internos da janela**: %LOCALAPPDATA%\PrumoQA\app.

## Retenção

Sem retenção automática: nada é apagado sozinho. Você exclui quando quiser, em Privacidade e dados.

## O que é enviado a terceiros

O servidor MCP responde ao cliente de IA que o iniciou. O que ele devolve (contexto autorizado, análises, evidências) passa a ser tratado por esse cliente e por seu provedor. O Prumo não recebe as conversas da IA.

Ao verificar atualizações (somente quando você clica), o aplicativo faz uma requisição HTTPS ao GitHub sem enviar logs, projetos, caminhos ou identificadores. Como em qualquer conexão, o servidor remoto vê o seu endereço IP e dados normais de rede; isso não é anonimato.

## O que não é coletado

Nenhuma telemetria, rastreamento, upload de logs ou sincronização. Exportar logs é ação sua e grava apenas onde você escolher.

## Desinstalação

Desinstalar remove o programa, mas mantém seus dados e evidências.
