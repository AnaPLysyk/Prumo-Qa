# Backend do Prumo QA

Arquivo gerado por `npm run leia-me` a partir da primeira linha de cada arquivo. Não edite à mão.

As pastas correspondentes a telas visíveis também existem em `frontend/`; módulos internos, como aplicativo e terminal, não precisam ter uma tela própria. Dentro das pastas: `api/` recebe os pedidos da janela, `regras/` decide, `banco/` lê e grava os dados deste computador, `integracoes/` fala com serviços de fora e `tipos/` descreve o formato dos dados.

## Portas de entrada

| Arquivo | O que faz |
| --- | --- |
| `aplicativo.ts` | Porta de entrada do aplicativo desktop: prepara a pasta de dados, registra os canais da janela, abre a janela e a bandeja e mantém o worker de agendamentos. |
| `cli.ts` | Porta de entrada do terminal (comando prumo): lê os argumentos e chama a ação pedida. |
| `mcp.ts` | Porta de entrada do servidor MCP iniciado pelo cliente de IA: liga o projeto informado na configuração e conversa por stdio. |

## Telas

| Pasta | Para que serve |
| --- | --- |
| [`administracao/`](administracao/LEIA-ME.md) | Administração: configurações gerais, usuários, permissões, monitoramento e documentação técnica. |
| [`agendamentos/`](agendamentos/LEIA-ME.md) | Agendamentos: rotinas, fila de trabalhos, worker residente, autorizações prévias e k6. |
| [`agentes/`](agentes/LEIA-ME.md) | Agentes: as especializações, o chat, o Cérebro, as Skills, o conhecimento e os contextos do projeto (requisitos, regras, critérios e decisões, com aprovação humana). |
| [`ajuda/`](ajuda/LEIA-ME.md) | Ajuda: documentos, versões, integrações técnicas e privacidade dos dados. |
| [`aplicativo/`](aplicativo/LEIA-ME.md) | Aplicativo: a janela do Windows, a bandeja, os avisos e o registro de todos os canais da janela (IPC). |
| [`atualizacoes/`](atualizacoes/LEIA-ME.md) | Atualizações (sino): consulta de versão nova, aviso automático e atualização com um clique. |
| [`compartilhado/`](compartilhado/LEIA-ME.md) | Compartilhado: só o que várias telas usam de verdade — segurança, erros, textos, contrato do projeto e pasta de dados. |
| [`conexoes/`](conexoes/LEIA-ME.md) | Conexões: contas de Jira, Qase e GitHub, leitura e escrita controlada nesses serviços e a conexão das IAs pelo MCP. |
| [`configuracoes/`](configuracoes/LEIA-ME.md) | Configurações (Ajustes): preferências da pessoa — tema, idioma, avisos e som. |
| [`inicio/`](inicio/LEIA-ME.md) | Início: o painel do projeto e o assistente local que responde com os dados deste computador, sem IA. |
| [`logs/`](logs/LEIA-ME.md) | Logs: o que o aplicativo e as IAs fizeram, e o histórico das operações do projeto consolidado para o chat e as métricas. |
| [`metricas/`](metricas/LEIA-ME.md) | Métricas: números reais calculados das execuções e do diário de operações. |
| [`projetos/`](projetos/LEIA-ME.md) | Projetos: projetos do Prumo, pastas de código vinculadas e o contrato qa.project.json. |
| [`suporte/`](suporte/LEIA-ME.md) | Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados. |
| [`terminal/`](terminal/LEIA-ME.md) | Terminal: o comando prumo (CLI). |
| [`testes/`](testes/LEIA-ME.md) | Testes: IDE, Repositório, Runs e Planos — casos, automações, execuções com aprovação humana, evidências, vínculos e o comentário de resultado no Jira. |
| [`tickets/`](tickets/LEIA-ME.md) | Tickets: tickets do Jira e propostas de caso e de bug em rascunho, publicadas só com confirmação. |
