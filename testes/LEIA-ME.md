# Testes do Prumo QA

Os testes têm só três naturezas e ficam em `testes/<natureza>/<camada>/<módulo>/`. O caminho do arquivo que falhou já diz o que quebrou e onde procurar; não existe catálogo separado.

| Natureza | Para que serve | Quando roda |
| --- | --- | --- |
| `unitario` | Regras isoladas, sem janela e sem serviço, mais as regras do próprio repositório (estrutura, versões, assinatura, design system) | A cada alteração |
| `smoke` | O aplicativo sobe: o backend carrega canais e MCP, e a janela abre e desenha todas as telas | Antes de qualquer outra coisa |
| `regressao` | O que já funcionou e não pode quebrar: contratos (IPC, MCP), dados locais, serviços simulados, segurança, janela real e migração | A cada alteração e no CI |

```
testes/
├── unitario/{backend,frontend}/<módulo>/
├── smoke/{backend,frontend}/<módulo>/
├── regressao/{backend,frontend}/<módulo>/
└── apoio/            auxiliares compartilhados: fixtures, janela, banco em memória
```

- **Camada:** `backend` exercita `backend/` (regras, canais, MCP, banco, serviços); `frontend` abre a janela Electron real.
- **Módulo:** o nome da pasta da tela em `backend/` ou `frontend/` (`agentes`, `conexoes`, `login`, `administracao`, `testes`...). `compartilhado` guarda o que vale para várias telas.
- **Migração:** `migracao*.test.mjs` depende do perfil instalado e só roda no workflow de instalação do CI.

## O que cada teste da janela (`regressao/frontend/<módulo>/`) cobre

Cada arquivo abre o aplicativo de verdade (Electron), com dados sintéticos e serviços simulados. O nome diz a tela ou o assunto.

| Arquivo | O que verifica |
| --- | --- |
| `janela-e-seguranca.test.mjs` | A janela abre, não expõe Node, só aceita pedidos da própria página e recusa argumentos inválidos |
| `telas-tickets-testes-e-agenda.test.mjs` | Tickets, Testes (IDE, Repositório, Runs, Planos), vínculos e Agendamentos: navegação, modais, foco e rolagem |
| `casos-tickets-e-evidencias.test.mjs` | Casos e defeitos do Qase, ticket em modal, evidência BLOCKED real e vínculo declarado |
| `ide.test.mjs` | IDE de Testes: editar, criar e salvar arquivo e pipeline com confirmação do Windows, e recusas de segurança |
| `integracoes-jira-qase-github.test.mjs` | Conexões, escrita externa com confirmação, Tickets e Testes contra serviços simulados |
| `jira.test.mjs` | Comentário de resultado no Jira: prévia, publicação única e reconciliação |
| `agenda.test.mjs`, `agenda-e-bandeja-ponta-a-ponta.test.mjs` | Início e agenda; agenda real com bandeja, evidência, pausa e saída |
| `agentes-logs-metricas-e-chat.test.mjs`, `orquestracao.test.mjs`, `ciclo-ia.test.mjs`, `skills.test.mjs`, `contextos.test.mjs` | Agentes, Cérebro, chat, Logs, Métricas, orquestração, conhecimento, Skills e contextos |
| `administracao.test.mjs`, `contas.test.mjs` | Documentação viva com código; login, papéis e permissões |
| `projetos-vinculo-e-ajuda.test.mjs`, `plataforma-dois-projetos.test.mjs`, `conexoes-e-acessibilidade.test.mjs` | Vincular pasta e contrato, dois projetos, protocolo real, teclado, foco e zoom |
| `ajuda.test.mjs`, `suporte.test.mjs`, `atualizacao.test.mjs`, `i18n.test.mjs` | Ajuda, Suporte, atualização com um clique e inglês sem texto em português |
| `design-system.test.mjs`, `ux.test.mjs`, `site-visual.test.mjs` | Foco e ARIA, contraste e alinhamento, e o site gerado |

Regras:
- Teste novo entra na pasta da sua natureza, camada e módulo; `testes/unitario/backend/compartilhado/seletor-testes.test.mjs` recusa arquivo fora do lugar.
- Nenhum teste abre SQLite nem dados da pessoa: `apoio/conhecimento-hook.cjs` troca os bancos de conhecimento e de Skills por memória.
- Nenhum teste usa conta real ou altera projeto externo; serviços são simulados em `apoio/servicos-fixtures.mjs`.
- Suíte completa: `npm.cmd run check`. Por natureza, camada ou módulo: `npm run test:smoke`, `npm run test:backend` ou `npm run test:selecionar -- --modulo agentes` (veja `docs/TESTES.md`).
