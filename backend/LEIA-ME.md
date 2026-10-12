# Backend do Prumo QA

Arquivo gerado por `npm run leia-me` a partir da primeira linha de cada arquivo. Não edite à mão.

Cada pasta tem o nome de uma tela do aplicativo (a mesma pasta existe em `frontend/`). Dentro dela: `api/` recebe os pedidos da janela, `regras/` decide, `banco/` lê e grava os dados deste computador, `integracoes/` fala com serviços de fora e `tipos/` descreve o formato dos dados.

## Portas de entrada

| Arquivo | O que faz |
| --- | --- |
| `aplicativo.ts` | Porta de entrada do aplicativo desktop: prepara a pasta de dados, registra os canais da janela, abre a janela e a bandeja e mantém o worker de agendamentos. |
| `cli.ts` | Porta de entrada do terminal (comando prumo): lê os argumentos e chama a ação pedida. |
| `mcp.ts` | Porta de entrada do servidor MCP iniciado pelo cliente de IA: liga o projeto informado na configuração e conversa por stdio. |

## Telas

| Pasta | Para que serve |
| --- | --- |
| [`agendamentos/`](agendamentos/LEIA-ME.md) | Agendamentos: rotinas, fila de trabalhos, worker residente, autorizações prévias e k6. |
| [`agentes/`](agentes/LEIA-ME.md) | Agentes: chat com agentes, banco de conhecimento, políticas da IA e o servidor MCP. |
| [`ajuda/`](ajuda/LEIA-ME.md) | Ajuda: documentos, versões, integrações técnicas e privacidade dos dados. |
| [`aplicativo/`](aplicativo/LEIA-ME.md) | Aplicativo: a janela do Windows, a bandeja, os avisos e o registro de todos os canais da janela (IPC). |
| [`atualizacoes/`](atualizacoes/LEIA-ME.md) | Atualizações (sino): consulta de versão nova, aviso automático e atualização com um clique. |
| [`compartilhado/`](compartilhado/LEIA-ME.md) | Compartilhado: só o que várias telas usam de verdade — segurança, erros, textos, contrato do projeto e pasta de dados. |
| [`conexoes/`](conexoes/LEIA-ME.md) | Conexões: contas de Jira, Qase e GitHub, leitura e escrita controlada nesses serviços e a conexão das IAs pelo MCP. |
| [`configuracoes/`](configuracoes/LEIA-ME.md) | Configurações (Ajustes): preferências da pessoa — tema, idioma, avisos e som. |
| [`contextos/`](contextos/LEIA-ME.md) | Contextos: requisitos, regras, critérios e decisões do projeto, com aprovação humana e histórico verificável. |
| [`evidencias/`](evidencias/LEIA-ME.md) | Evidências: o que cada execução produziu, guardado com integridade dentro de .prumo do projeto. |
| [`execucoes/`](execucoes/LEIA-ME.md) | Execuções: executar uma capacidade com aprovação humana, histórico de execuções e comentário de resultado no Jira. |
| [`historico/`](historico/LEIA-ME.md) | Histórico: operações do projeto consolidadas (início e término). |
| [`inicio/`](inicio/LEIA-ME.md) | Início: o painel do projeto e o assistente local que responde com os dados deste computador, sem IA. |
| [`logs/`](logs/LEIA-ME.md) | Logs: diário de operações do CLI e do MCP e o diagnóstico técnico da janela. |
| [`metricas/`](metricas/LEIA-ME.md) | Métricas: números reais calculados das execuções e do diário de operações. |
| [`projetos/`](projetos/LEIA-ME.md) | Projetos: projetos do Prumo, pastas de código vinculadas e o contrato qa.project.json. |
| [`rastreabilidade/`](rastreabilidade/LEIA-ME.md) | Rastreabilidade: o mapa de ligações entre tickets, casos, runs, execuções e evidências. |
| [`suporte/`](suporte/LEIA-ME.md) | Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados. |
| [`terminal/`](terminal/LEIA-ME.md) | Terminal: o comando prumo (CLI). |
| [`testes/`](testes/LEIA-ME.md) | Testes: catálogo de testes da pasta, análise de testes, runs do Qase e publicação de resultados. |
| [`tickets/`](tickets/LEIA-ME.md) | Tickets: tickets do Jira e propostas de caso e de bug em rascunho, publicadas só com confirmação. |
