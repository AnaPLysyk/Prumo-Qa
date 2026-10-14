# Testes do Prumo QA

Os testes ficam organizados primeiro pelo **tipo** de verificação e depois pela **camada** do sistema que eles exercitam. O caminho do arquivo que falhou já diz o que quebrou e onde procurar.

```
testes/
├── estrutura/            regras do repositório (pastas, nomes, catálogos, dependências, assinatura, site)
├── unitario/regras/      regras de negócio isoladas, sem janela e sem serviço
├── contrato/
│   ├── ipc/              canais da janela: esquemas, catálogo e remetente
│   ├── mcp/              servidor MCP real e ferramentas dos agentes
│   └── externa/          formato de relatórios entregues a outras ferramentas
├── integracao/
│   ├── banco/            gravação e leitura de dados locais (agenda, preferências, integrações)
│   └── externa/          serviços simulados (Jira, Qase, GitHub, atualização, subprocessos)
├── seguranca/
│   ├── regras/           recusas, permissões, máscaras e limites nas regras
│   ├── banco/            isolamento e exclusão de dados locais
│   └── externa/          escrita externa, execução e leituras só com autorização
├── e2e/ui/               janela Electron real, ponta a ponta
├── migracao/ui/          atualização a partir de versões instaladas (só no CI Windows)
├── apoio/                auxiliares compartilhados: fixtures, janela, banco em memória
└── catalogo.json         classificação de cada arquivo (tipo, camada, funcionalidade)
```

| Camada no catálogo | Pasta |
| --- | --- |
| `ui` | `ui/` |
| `ipc` | `ipc/` |
| `mcp` | `mcp/` |
| `regra` | `regras/` |
| `persistencia` | `banco/` |
| `integracao` | `externa/` |

## O que cada teste da janela (`e2e/ui/`) cobre

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
- Teste novo entra no `catalogo.json` e na pasta do seu tipo e camada; `testes/estrutura/organizacao-testes.test.mjs` recusa arquivo fora do lugar.
- Nenhum teste abre SQLite nem dados da pessoa: `apoio/conhecimento-hook.cjs` troca os bancos de conhecimento e de Skills por memória.
- Nenhum teste usa conta real ou altera projeto externo; serviços são simulados em `apoio/servicos-fixtures.mjs`.
- Suíte completa: `npm.cmd run check`. Por tipo ou camada: `npm run test:selecionar -- --natureza contrato` ou `--camada mcp` (veja `docs/TESTES.md`).
