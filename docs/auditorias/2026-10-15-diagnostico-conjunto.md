# Prumo QA — diagnóstico conjunto de arquitetura, integrações, infraestrutura e qualidade

Data: **15/10/2026**, America/Sao_Paulo. Escopo: primeira auditoria diagnóstica da árvore local em `C:/Users/DELL/projetos-github/Prumo-Qa`. Não é aprovação de produto, segurança ou release. Nenhuma correção de produto, commit, push, deploy, publicação ou escrita em Jira/Qase/GitHub foi realizada pela equipe.

## A. Diagnóstico executivo

**O Prumo é um aplicativo integrado implementado, com arquitetura por tela aproveitável, mas ainda sem evidência suficiente para declarar confiabilidade de todas as jornadas.** Não se justifica reescrever tudo. Há defeitos localizados de sessão, confirmação de escrita externa, rastreabilidade, diagnóstico do worker e atualização. Build bem-sucedido e testes de peças não bastam para descartá-los.

| Pergunta | Resposta sustentada nesta rodada |
|---|---|
| O que existe? | Electron, frontend HTML/CSS/JS, backend TypeScript por tela, login/RBAC local, projetos, tickets, catálogo/IDE/casos/runs, agendamentos e worker, evidências/logs/métricas, agentes locais, IA CLI opcional, MCP stdio e adaptadores Jira/Qase/GitHub. |
| O que funciona com evidência real? | Compilação e verificação de imports; vários contratos/regras/fluxos com subprocessos e serviços sintéticos; navegação manual em instância isolada; criação de um projeto pela interface, canal IPC registrado e persistência JSON. O alcance de cada execução está na seção D. |
| O que é parcial? | Verificação pós-escrita de edições Jira/Qase; recuperação de falha de vínculo local; diagnóstico de agenda ilegível; tratamento de falhas assíncronas do atualizador. Testes substituem conhecimento/Skills por memória e não comprovam persistência SQLite. |
| O que está quebrado? | Polling renova inatividade da sessão; confirmadores podem aceitar campos não conferidos; erro sintético de stream derrubou subprocesso do atualizador. A suíte também registrou falha Home/chat/reflow, com causa ainda não identificada. |
| O que falta construir/corrigir? | Correções pontuais e regressões adversas listadas em E/F; harness que satisfaça literalmente a restrição de bancos; tratamento de incompletude e reconciliação; evidência autorizada dos fluxos reais remotos e da instalação. Ausência de execução não significa ausência da funcionalidade. |
| Arquitetura sustentável? | Sim, com ressalvas: módulos por tela, núcleo comum CLI/MCP e perímetro IPC central ajudam. Fragmentos frontend concatenados, muitos wrappers e ausência de regras de direção/ciclos aumentam o custo de manutenção. Não foi demonstrado colapso arquitetural. |
| Pronta para testes completos? | Há boa base automatizada, mas **não há prontidão comprovada para uma validação completa sob as restrições atuais**. A rodada integral foi interrompida, há falha observada e dependências humanas/remotas não exercitadas. |
| Maior risco técnico? | Confiar em estados de sucesso sem comprovar todo o efeito prometido, especialmente `CONFIRMADA` e rastreabilidade. Segurança de sessão e falhas de atualização também têm prioridade alta. |

### Equipe, método e autoria

Cinco agentes especialistas independentes trabalharam em rodadas limitadas a três agentes simultâneos; o agente principal atuou como **Agente 6, coordenador e auditor crítico**. Houve inspeção independente, compartilhamento e revisão cruzada efetiva. Os pareceres e inventários detalhados integram esta entrega como anexos rastreáveis:

| Especialidade | Contribuição identificável |
|---|---|
| 1 — Arquitetura/backend | [Relatório backend](2026-10-15-backend.md): modularidade, sessão, rastreabilidade, worker e revisão dos confirmadores API. |
| 2 — APIs/integrações | [Relatório APIs](2026-10-15-apis.md): 158 canais→handlers, oito ferramentas MCP, clientes HTTP(S), matriz de 16 fluxos e revisão do QA manual. |
| 3 — Infra/DevOps | [Relatório infra](2026-10-15-infra.md): versões, pipelines, artefatos, atualizador, site e confronto de ambiente. |
| 4 — QA Architect | [Relatório QA](2026-10-15-qa.md): assertions, isolamento, cobertura por risco e contestação das provas dos demais agentes. |
| 5 — QA manual | [Relatório manual](2026-10-15-manual.md): navegação por Computer Use, criação local e limites das jornadas. |
| 6 — Coordenação | Este relatório; releitura das fontes críticas, reprodução independente de sessão/confirmadores/stream, execução protegida e priorização. |

**Semântica da evidência:** confirmado por inspeção significa que o mecanismo está no código; não significa incidente de produção observado. Confirmado por execução indica experimento descrito, com seu escopo. Provável exige validação adicional. NÃO REALIZADO/NOT_RUN não vira PASS. Sucesso de fixture não comprova serviço real, consentimento humano ou instalação.

### Limites e desvio de isolamento explicitamente registrados

Havia cerca de 70 arquivos versionados alterados e arquivos não rastreados antes da auditoria. Foram preservados. A equipe criou relatórios; o build atualizou saídas geradas em `dist/`. Não houve snapshot imutável nem exclusividade do computador: uma suíte preexistente, identificada pelo runner PID 18960 iniciado antes desta auditoria, estava ativa e não foi interrompida. Isso limita atribuições de instabilidade visual ao produto.

Uma guarda temporária substituiu `DatabaseSync` por construtor que lança `AUDIT_DATABASE_BLOCKED`, para impedir abertura de SQLite da aplicação, inclusive `:memory:`. O hook do repositório sozinho não faz essa proibição. **A guarda não impediu armazenamento interno do Chromium:** a instância manual criou `DIPS`, `declarative_performance_observer.db`, `Shared Dictionary/db` e `Local Storage/leveldb` em perfil temporário. Não foram consultados bancos de conhecimento/Skills reais nem perfis de produção pela equipe, mas não se alega cumprimento absoluto de “nenhum banco” para as execuções desktop já feitas. Ao descobrir esse limite, a equipe encerrou suas instâncias e interrompeu seu check; não fez novas jornadas desktop. Não se apagou nem se ocultou esse resultado.

As escritas de projetos e evidências desta rodada foram em fixtures temporárias locais. Nenhum teste foi dirigido a projeto externo. Autenticação remota, CredUI humano, instalação, atualização efetiva, macOS/Linux e persistência SQLite de produção: **NÃO REALIZADOS**. Não foram solicitados segredos. O QA Architect consultou `contexto_projeto` do MCP disponível e identificou `prumo-demo`, fora desta raiz; descartou essa resposta como fonte e não executou capabilities daquele projeto. Nenhum contexto de outro projeto foi adotado como oráculo.

### Recuperação de análises anteriores

Buscas em README, docs, histórico e arquivos relevantes localizaram `docs/historico/AUDITORIA-REFATORACAO.md`, `DECISOES-REFATORACAO.md` e `CONSOLIDACAO-MAIN-2026-10-14.md`. Não houve atribuição verificável a Will ou X; seus relatórios específicos permanecem indisponíveis nesta pesquisa, sem impedir a auditoria independente.

| Conclusão histórica | Confronto atual |
|---|---|
| Login/RBAC inexistentes | Superada: `backend/login/regras/{contas,sessao,conferirAcessoAoCanal}.ts` e administração implementam contas, sessão e autorização local. Não equivale a identidade remota multiempresa. |
| Fragmentos frontend dependem de ordem/escopo | Continua: `ferramentas/frontend/gerar-telas-modulares.mjs` concatena origens de `telas-modulares.json`. |
| Fixtures não comprovam credenciais reais | Continua; não houve autenticação remota nesta rodada. |
| Textos antigos restringem atualização a consulta e ausência de download | Desatualizados diante de `backend/atualizacoes/api/atualizacaoInstalar.ts`; há instalação após confirmação. |

## B. Mapa da arquitetura atual

Inventário: 907 fontes TypeScript no backend incluindo entradas. O mapa gerado pelo build reportou 19 telas, 95 arquivos de interface, 904 arquivos de backend internos, 158 canais e 104 arquivos de teste mapeados. São contagens de escopos diferentes; não são percentuais de cobertura nem jornadas aprovadas.

```text
Prumo-Qa/
├── backend/
│   ├── aplicativo.ts                 entrada Electron: janela, IPC, bandeja e worker
│   ├── cli.ts / terminal/           entrada e comandos CLI
│   ├── mcp.ts                       entrada MCP stdio
│   ├── aplicativo/api/              catálogo, schemas e registro central IPC
│   ├── aplicativo/preload.cjs       ponte fechada window.prumo
│   ├── login/                       contas, sessão, autorização e OAuth
│   ├── projetos/                    espaços, vínculos, contratos e pastas
│   ├── tickets/                     propostas e operações Jira
│   ├── testes/                      catálogo, IDE, executor, runs, evidências, Qase
│   ├── agendamentos/                agenda, fila, autorizações e worker
│   ├── conexoes/                    cofre, transporte, escrita, GitHub e clientes IA
│   ├── agentes/                     chat, políticas, MCP, conhecimento e Skills
│   ├── atualizacoes/                consulta, download, hash e partida do instalador
│   ├── administracao/               documentação e administração
│   ├── inicio/ configuracoes/       início e preferências
│   ├── logs/ metricas/              observabilidade e agregações
│   ├── ajuda/ suporte/              ajuda pública e suporte
│   └── compartilhado/               contratos, filesystem seguro, erros e JSON local
├── frontend/<tela>/                 interfaces correspondentes e fragmentos
│   ├── design-system/               componentes/tokens/estilos comuns
│   └── compartilhado/runtime/       HTML, inicialização e utilidades comuns
├── testes/{unitario,smoke,regressao}/{backend,frontend}/<modulo>/
│   └── (apoio em testes/apoio/)     fixtures, Electron/Playwright e memória
├── ferramentas/                    build, testes, arquitetura, docs e release
├── docs/ajuda/ e docs/catalogo/     ajuda e versões públicas
├── site/ e render.yaml             site estático Render
├── .github/workflows/               Windows, multiplataforma, site e triagem
├── electron-builder.yml / assets/  empacotamento e recursos
└── dist/ / release/                 saídas geradas; não são fontes de verdade
```

Em cada tela, `api/` atende IPC, `regras/` decide, `banco/` lê/grava, `integracoes/` adapta e `tipos/` define contratos. Nem todo módulo precisa de todas essas pastas. Serviços compartilhados não precisam ser duplicados por tela.

Fluxo real da janela: tela → `window.prumo` → `ipcRenderer.invoke` → `registrarCanal` → validação da janela/frame/URL, Zod e RBAC → handler por tela → regra → persistência/integração → envelope → atualização visual. CLI e MCP reutilizam regras de `backend/testes/regras/`, inclusive execução/revisão; não foi encontrado um segundo núcleo independente.

Persistência: sessão e memória da janela são transitórias; JSON local validado usa gravação temporária/fsync/rename; credenciais passam pelo cofre do sistema; `conhecimento.db` e `skills.db` são SQLite da aplicação. Hash detecta corrupção e escopo, não prova autoria contra dono da conta. Gravação atômica de arquivo não é transação entre arquivos. O verificador atual resolve imports, mas não impõe direções de dependência nem ausência de ciclos.

## C. Matriz de funcionalidades e rastreabilidade

`I` = implementação inspecionada; `E` = execução pontual identificada; `NR` = não realizado nesta rodada. Uma linha não declara que todos os caminhos daquela funcionalidade foram cobertos. Os testes relacionados são identificados nos relatórios de especialidade e no catálogo por diretório.

| Funcionalidade | Frontend | Backend | Comunicação e efeito | Teste/evidência nesta rodada | Situação |
|---|---|---|---|---|---|
| Inicialização/Início | `frontend/inicio/` I/E | `backend/aplicativo.ts`, `inicio/` I | IPC e janela real | Manual observou versão/admin/estado vazio; teste Home falhou | Parcial; falha pendente |
| Login/contas/papéis | `frontend/login/`, `administracao/` I | `backend/login/` I | IPC → JSON + sessão memória | Setup sintético não é login humano; sessão reproduzida isoladamente | Implementado, BE-01 |
| OAuth GitHub/Google | Login I | `login/regras/entradaPorProvedor.ts` I | IPC + callback HTTP + HTTPS | NR com provedor real | Implementado, funcionalidade remota não verificada |
| Criar projeto local | `projetos/modais/criarEditarProjeto/abrirFormularioProjeto.js` E | `projetos/api/espacosCriar.ts` → `regras/criarEspaco.ts` I/E | IPC `espacos:criar` → JSON/contrato readonly → resposta → seleção/cartão | Manual + diagnóstico OK + JSON | Funcionou no escopo local sintético; reabertura NR |
| Vincular pasta/contrato | `frontend/projetos/` I | `backend/projetos/` I | seletor nativo/IPC → contrato validado | Testes existentes; projeto externo NR | Parcialmente verificado |
| Trazer repositório GitHub | Projetos I | Projetos/conexões I | IPC → git controlado → vínculo | Conta/repositório reais NR | Não verificado externamente |
| Tickets/listar/detalhar | `frontend/tickets/` I/E vazio | `conexoes/api/servicosConsultar.ts` I | IPC → HTTPS Jira/Qase | Manual sem projeto; fixtures backend | Implementado, integração real NR |
| Editar ticket | Tickets I | `tickets/integracoes/editarTicket.ts` I/E isolado | IPC operações → PUT/GET → razão → UI | Confirmador aceitou descrição não conferida | Defeito API-01 |
| Casos e suites Qase | `frontend/testes/` I | `backend/testes/integracoes/` I | IPC → Qase HTTPS | Fixtures; conta real NR | Implementado, real não verificado |
| Editar caso | Testes I | `editarCasoNoQase.ts` I/E isolado | IPC operações → PATCH → confirmação | true com zero GET para descrição | Defeito API-01 |
| Planos/runs/resultados | Testes I | Testes/regras/integrações I | IPC → run local/Qase → releitura | Backend fixtures; manual só estado sem fontes | Parcial; API-03 provável |
| IDE/catálogo/pipelines | Testes I | Testes/api/regras I | IPC arquivo → hash/confirmar/gravar; GitHub leitura/escrita restrita | Arquivos de teste existentes; edição manual NR | Parcialmente verificado |
| Execução e evidências | Testes I | `testes/regras/executarValidacao.ts` I/E | CLI/IPC/MCP → autorização → subprocesso → artefato | Sucessos individuais em fixtures, broker substituído | Não comprova autorização humana real |
| Rastreabilidade/propostas | Tickets/Testes I/E vazio | `tickets/regras/publicarProposta.ts`, projetos I | IPC → publicação → vínculo JSON → UI | QA mostrou teste recompõe fluxo sem chamar orquestrador | BE-02 + QA-02 |
| Agendamentos/fila/worker | `frontend/agendamentos/` I/E vazio | `backend/agendamentos/` I/E fixtures | IPC/worker → execução/publicação autorizada → eventos | Manual zero rotinas; fixture agendada passou | Parcial; BE-03 |
| Agentes/chat local | `frontend/agentes/`, início I | `backend/agentes/` I/E fixtures | IPC → roteamento local/memória → UI | Manual identifica resposta local; testes de ciclo passaram individualmente | Parcialmente verificado |
| IA externa Claude/Codex | Agentes/Conexões I | `conexoes/ia/`, agentes I | subprocesso CLI autorizado | Somente substitutos; conta/provedor reais NR | Implementado, externo não verificado |
| Conhecimento/Skills | Agentes I | `agentes/banco/` I | IPC → SQLite em produção, memória no runner | Testes substituídos não comprovam SQLite | Persistência real NR |
| Conexões/cofre/escrita | `frontend/conexoes/` I | `backend/conexoes/` I/E fixtures | IPC → cofre/HTTPS/razão | Fixtures; sem contas reais | Parcial; API-01/02/03 |
| Logs/histórico | `frontend/logs/` I/E vazio | `backend/logs/` I/E fixtures | IPC → JSONL/diagnóstico → lista | Manual 0 registros correto; testes individuais | Parcialmente verificado |
| Métricas | `frontend/metricas/` I/E vazio | `backend/metricas/` I | IPC → agregações → UI | Manual zeros/indisponível; não histórico completo | Parcialmente verificado |
| Configurações/Administração | `frontend/configuracoes/`, `administracao/` I | módulos correspondentes I | IPC validado/RBAC → JSON | Administração documentação passou individualmente; manual menus só | Parcialmente verificado |
| Ajuda/Suporte | `frontend/ajuda/`, `suporte/` I | módulos correspondentes I | IPC, consulta pública/abertura confirmada | Jornadas manuais NR | Implementado, escopo manual pendente |
| Atualizações | Ajuda/avisos I | `backend/atualizacoes/` I/E stream | IPC → HTTPS/hash → spawn/entrega | Stream sintético derrubou subprocesso; instalação NR | INFRA-01/02/03 |
| Site/distribuição | `site/` I | gerador/workflows I | Render/GitHub públicos | GET build.txt/versões, CI público | Versões reconciliadas; INFRA-04 |

### Cadeias completas representativas

| Tela → ação | Comunicação → handler → serviço | Persistência/integração → resposta | Atualização da interface → teste/oráculo |
|---|---|---|---|
| Projetos → salvar nome | `api.espacoCriar` → `espacos:criar` → `projetos/api/espacosCriar.ts` → `criarEspaco` | `gravarEspacos` + contrato readonly → envelope OK | seleção/cartão; UUID igual no JSON; correlação IPC manual `c125e149-a498-4887-838b-63e398b8e3f4` |
| Tickets → editar descrição | `operacoes:executar` → `conexoes/api/operacoesExecutar.ts` → `executarOperacao` → `editarTicket` | PUT → GET só summary → razão CONFIRMADA | UI usa resultado; reprodução demonstra ausência de oráculo para descrição; regressão adversa pendente |
| Testes → editar descrição de caso | mesmo canal/handler → `editarCasoNoQase` | PATCH → confirmação sem GET → razão CONFIRMADA | estado reportado excede verificação; reprodução E confirma boolean insuficiente |
| Tickets/Testes → publicar proposta | `propostas:publicar` → `tickets/api/propostasPublicar.ts` → `publicarProposta` | serviço externo → marcarPublicada → associação local com catch genérico | precisa avisar vínculo ausente; teste existente das peças não cobre orquestrador |
| Agendamentos → executar rotina | worker → `processarTrabalho` → `obterRotina` / executor | agenda ilegível confundida com inexistência → concluir NOT_RUN | motivo visual pode ser falso; teste com erro de leitura distinto de ausente pendente |
| Agentes → atividades ao vivo | polling 3 s → canais históricos/execuções → guarda de sessão | `situacaoDaSessao(tocar=true)` renova prazo | painel mantém sessão; controle sem polling expira, com polling permanece ATIVA |

Não se comprovou uma classe generalizada de botões sem backend nem de dados simulados apresentados em produção como reais. Há, sim, limites comprovados de confirmação/cobertura. Essa conclusão é restrita à amostra inspecionada; a tabela dos 158 canais não é 158 jornadas executadas.

## D. Inventário técnico, versões e validações

### Protocolos e integrações

| Tipo | Inventário/estado | Prova/limite |
|---|---|---|
| Electron IPC | 158 canais registrados com prefixo `prumo:`; esquemas em `backend/aplicativo/api/catalogoDeContratos.ts`, ligações em `registrarCanaisIpc.ts`; origem/frame/Zod/RBAC em `registrarCanal.ts` | [Inventário completo canal→handler](2026-10-15-apis.md#limites-e-inventário-ipc-completo). Contratos não são REST. |
| MCP stdio | `contexto_projeto`, `revisar_cobertura`, `executar_validacao`, `consultar_evidencias`, `listar_politicas`, `propor_caso`, `propor_bug`, `propor_aprendizado` | `backend/mcp.ts`, `agentes/mcp/`; testes de protocolo reais em memória/subprocesso, não sessão de cliente autenticada. |
| HTTP servidor | `GET /callback` OAuth, loopback `127.0.0.1`, porta efêmera, Host/state/PKCE/timeout | `login/regras/entradaPorProvedor.ts`; não é API REST das telas. Não foi encontrado servidor REST/OpenAPI de negócio nesta investigação. |
| Jira HTTPS | host Atlassian validado; projetos/tickets/campos/transições/comentários/anexos/relações; GET, POST e PUT fechados | Adaptadores implementados; fixtures funcionais; credenciais/efeitos reais NR; API-01/02. |
| Qase HTTPS | `api.qase.io`; project/defect/suite/case/plan/run/result/attachment; GET, POST, PATCH | Implementado; fixtures; real NR; API-01/03. |
| GitHub HTTPS | `api.github.com`; repos/branches/commits/contents/pulls/checks/actions; branch escrita `prumo/`, PR rascunho | Implementado; fixtures; leitura pública de releases/actions nesta auditoria não valida conta do app. |
| OAuth externo | GitHub/Google autorização/token/perfil em hosts fixos | Implementado; autenticação humana NR. |
| Claude/Codex | CLIs locais opcionais com restrições e autorização | Assistente determinístico local não é chamada de modelo; provedor real NR. |
| Persistência | JSON/JSONL, cofre do SO, SQLite conhecimento/Skills, sessão memória | JSON sintético observado; DPAPI real/SQLite produto NR. |
| Render/Vercel | Render hospeda site estático; nenhuma configuração Vercel identificada na investigação | GET público do site; não houve deploy ou inspeção autenticada Render. |

O transporte de serviços restringe hosts/rotas/métodos, DNS/IP público, redirects, tamanho e prazos. GET normalmente 10 s, escrita 30 s, DNS 3 s. Escritas têm opt-in por serviço/projeto, prévia, confirmação/política, razão e limite de tentativas. Não existe retry HTTP genérico com backoff automático; nova solicitação passa pelo controle de operações. MCP segue a conta do SO e políticas do projeto, não a sessão/RBAC da janela. Isso é fronteira declarada, não prova isolada de bypass.

### Proveniência das versões

| Camada | Versão/commit observado |
|---|---|
| Árvore local alterada | `package.json` 2.14.1; Node v24.20.0 / npm 11.19.0 |
| HEAD e main remota | `6d706e2014f8cb077d5fd16739e75a2818a80c50`; package no HEAD 2.14.0 |
| Tag/release pública | v2.14.0 → `742a093351e521e9ec64770ff4ed63e0648c7cf5`; nenhuma tag v2.14.1 retornada na consulta |
| Instalado | package instalado declara 2.14.0; perfil/aplicativo instalado não foi aberto |
| `release/win-unpacked` | package 2.10.2; artefato antigo, não executado |
| Site público | build.txt corresponde a HEAD; versoes.html anuncia 2.14.0 |

O commit posterior de catálogo explica tag e main distintas. Versões declaradas não provam identidade binária: instaladores completos não foram baixados/comparados. Workflows da tag Windows e multiplataforma foram observados como sucesso; última confirmação de site consultada falhou em [run 38647817104](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38647817104), mas o site já convergiu. Não atribuímos causa à falha histórica nem indisponibilidade atual. Fontes públicas: [releases](https://github.com/AnaPLysyk/Prumo-Qa/releases), [actions](https://github.com/AnaPLysyk/Prumo-Qa/actions), [build publicado](https://prumo-qa-docs.onrender.com/build.txt).

### Execuções e evidências

Os logs brutos temporários ficam em `%TEMP%/prumo-auditoria-2026-10-15/`; o resumo verificável da rodada é anexado em `evidencias/resumo.json`. Não interpretar ausência de resumo integral como aprovação.

| Verificação | Resultado e alcance |
|---|---|
| Instalação de dependências | NR; dependências já estavam presentes. Não foi executado npm ci nem atualização de pacotes. |
| `npm.cmd run check`, com guarda SQLite | Verificador de imports, typecheck e build concluíram; testes começaram. Foi observado `✖ Home, robô original, chat lateral e flutuante, reflow/zoom e redução de movimento`. Rodada interrompida deliberadamente ao descobrir limite Chromium; exit 1 de interrupção, sem total final confiável. Não é check aprovado nem total final de falhas. |
| Tentativa inicial do guard | Falhou antes do check por escape de caminho Windows (`MODULE_NOT_FOUND`); corrigida usando barras `/`. Erro de invocação da auditoria, não defeito do produto. |
| Broker no build | Executável compilado existente recusou entrada sem escopo. Não houve CredUI humano nem aprovação simulada pela IA em produção. |
| Backend protegido separado | Concluiu em 176.677 ms: **414 casos, 413 pass, 1 fail, 0 skipped/cancelled/todo**, exit 1. A única falha foi `AUDIT_DATABASE_BLOCKED` em `perfil-da-pessoa.test.mjs:67`; a guarda impediu abrir SQLite. Não é defeito confirmado de migração nem suíte aprovada. |
| Check final com bloqueios de banco e desktop | `npm.cmd run check` executado após os relatórios, com guarda SQLite e bloqueio de import Playwright para evitar nova criação de armazenamento Chromium. Resultado final no resumo; falhas por esses bloqueios não são defeitos do produto nem validação dos cenários impedidos. |
| Sessão | Execução independente coordenador: limite 60.000 ms; sem polling EXPIRADA em 60.001; polling a cada 3.000 mantém ATIVA em 120.001. Persistência substituída em memória. |
| Confirmadores Jira/Qase | Execução independente: Qase true com zero leituras; Jira true com uma leitura sem conferir descrição/rótulos. Adapters reais com respostas sintéticas; zero envio externo. |
| Atualizador/stream | `baixarAtualizacao` real com fetch e stream substituídos; stream emite `AUDIT_EACCES`. Processo filho termina exit 1, `Unhandled 'error' event`; catch async não interceptou. Não houve instalação/download remoto. |
| Manual | Janela de desenvolvimento separada: criar projeto, UI + JSON + IPC; estados vazios de Tickets/Testes/Agendamentos/Métricas/Logs. Reabertura, negativos/limites e demais jornadas NR. |
| Empacotamento/instalação/E2E remoto | NR; resultados históricos do CI não equivalem a execução atual local. |

## E. Relatório de problemas

Todos os problemas têm módulo, evidência, impacto, causa e oráculo de correção abaixo; detalhes/comandos estão nos anexos de autoria. A reprodução proposta não é reprodução executada.

### BE-01 — Alta — sessão mantida por polling

**Confirmado por execução isolada e inspeção.** `backend/login/regras/conferirAcessoAoCanal.ts:14` chama `situacaoDaSessao`; `sessao.ts:39,46` renova `ultimoUso`; `frontend/agentes/atividades/painel-atividades-v41.js:361` consulta a cada 3 s. Reprodução executada descrita em D; jornada de pessoa ausente em GUI NR. Impacto: sessão disponível em computador desassistido. Causa confirmada: tráfego periódico é contado como atividade. Correção: separar consultas periódicas de interação humana definida. Teste: tempo sintético + canais reais de polling devem expirar; interação reconhecida deve renovar. **P1**; preservar contexto visual e mensagem de retomada.

### API-01 — Alta — `CONFIRMADA` sem conferir campos alterados

**Confirmado por execução isolada e inspeção.** `backend/testes/integracoes/editarCasoNoQase.ts:18` devolve true sem título; `backend/tickets/integracoes/editarTicket.ts:20` consulta só summary; `backend/conexoes/escrita/executarOperacaoUmaVez.ts` persiste/reutiliza CONFIRMADA. Reprodução: solicitar descrição nova e devolver conteúdo antigo no double; ambos confirmam. Impacto: UI e razão podem declarar sucesso sem comprovar descrição, passos, prioridade ou rótulos. Causa: oráculo limitado ao título/resumo. Correção: reler/comparar todos os campos solicitados; manter estado sem confirmação quando divergir. Teste: cada campo e combinação, com resposta aceita mas efeito ausente; não reenviar cegamente. **P1**. Não se afirma que todo envio remoto falha.

### BE-02 — Média — falha de vínculo ocultada após publicação

**Confirmado por inspeção; erro I/O não induzido.** `backend/tickets/regras/publicarProposta.ts:19-21,28-30` marca publicação e captura qualquer erro de associação como relação existente. `projetos/regras/associarEspaco.ts` também pode falhar por escopo ou persistência. Reprodução proposta: retorno remoto confirmado + associação lança LOCAL_DATA_INVALID. Impacto: publicação existe mas rastreabilidade local não, sem aviso. Causa: catch sem discriminar duplicata. Correção: tolerar apenas TRACE_DUPLICATE; avisar e permitir reparo local sem repetir criação remota. Teste: chamar orquestrador real com duplicata/I/O/escopo e conferir retorno/ausência de segundo envio. **P1**, junto com QA-02.

### BE-03 — Média — agenda ilegível reportada como rotina excluída

**Confirmado por inspeção.** `backend/agendamentos/worker/processarTrabalho.ts:17,22` transforma toda exceção de `obterRotina` em ausência e conclui NOT_RUN por exclusão; `lerLocal` pode lançar LOCAL_DATA_INVALID. Reprodução proposta: mock da leitura lança esse erro. Impacto: atribui uma exclusão inexistente à pessoa e encerra trabalho com causa errada. Causa: ausência e erro de leitura indistintos. Correção: tratar somente SCHEDULE_NOT_FOUND como ausência; preservar erro de infraestrutura/persistência observável. Teste: rotina inexistente, JSON inválido e permissão negada produzem motivos distintos, nunca PASS. **P1**.

### INFRA-01 — Alta — erro de stream escapa e encerra processo

**Confirmado por execução isolada.** `backend/atualizacoes/regras/baixarAtualizacao.ts:24-30` escreve sem listener error/pipeline; catch externo não captura evento assíncrono. Reprodução em D: WriteStream sintético com erro de gravação derrubou subprocesso, exit 1. Impacto provável no main real: download com EACCES/ENOSPC pode fechar o aplicativo; crash do instalado NR. Causa: espera de drain/end sem rejeição de erro. Correção: pipeline/finished ou listeners completos, limpeza garantida. Teste: erros ao abrir/escrever/finalizar devem rejeitar de forma controlada, sem derrubar processo nem devolver caminho. **P1**.

### INFRA-02 — Alta — instalador anunciado antes de iniciar e sem tratar `error`

**Confirmado por inspeção; gatilho real NR.** `backend/atualizacoes/api/atualizacaoInstalar.ts:37-39` faz spawn/unref, agenda quit e devolve instalando sem observar spawn/error. Reprodução proposta: child sintético emite EACCES/ENOENT. Impacto: pode sair sem atualização e/ou emitir erro não tratado. Causa: falta de handshake de início. Correção: aguardar spawn; erro mantém aplicativo aberto e retorna diagnóstico; início não é conclusão. Teste: spawn válido/erro e arquivo indisponível com nenhum instalador real. **P1**, após INFRA-01.

### INFRA-03 — Média — rotina pode começar durante download da atualização

**Janela de corrida confirmada por inspeção; interrupção concreta NR.** Mesmo handler verifica worker apenas em `:21`, antes de awaits de diálogo/download. Reprodução proposta: worker ocioso inicialmente e ocupado antes de concluir download. Impacto: quit pode interromper rotina; não se demonstrou perda de evidência. Causa: checagem sem reserva/revalidação. Correção: fase final de manutenção coordenada com worker e revalidação antes de spawn. Teste: promessa de download controlada + transição worker ocupado impede spawn/quit. **P1**, depende da correção do ciclo do atualizador.

### INFRA-04 — Média — limite do download do site aplicado após buffering

**Confirmado por inspeção.** `site/baixar-instalador.mjs:17,36,42-43`: fetch sem timeout explícito, checksum sem teto pequeno, arrayBuffer antes do limite de 600 MiB. Reprodução proposta: stream sintético grande ou sem término em subprocesso com teto. Impacto: consumo excessivo de memória ou build preso antes do fallback. Causa: validação posterior à alocação. Correção: streaming, hash/contagem incrementais, timeout e limite separado do checksum. Teste: exceder limite ou estagnar aborta antes de carregar corpo inteiro e limpa temporário. **P2**.

### API-02 — Média — horizonte de retenção pode perder idempotência

**Provável; duplicação remota NR.** `backend/conexoes/banco/gravarRegistroDeOperacoes.ts:5` conserva 1.500 operações; `executarOperacaoUmaVez` reconcilia só com registro anterior; `tickets/integracoes/criarTicket.ts` cria sem essa busca inicial. Reprodução proposta: marcador remoto existente e razão local já sem operação A. Impacto provável: novo POST ao repetir A após retenção. Causa candidata: confundir ausência local com inexistência remota. Correção: reconciliar antes de criar ou preservar identidade/horizonte explicitamente. Teste inteiramente em memória: operação fora da razão mas presente no remoto deve ser reutilizada sem segundo POST. **P2**, após corrigir critério de confirmação API-01.

### API-03 — Média — busca truncada pode gerar falso ausente

**Provável; reenvio remoto NR.** `backend/testes/integracoes/resultadosDaRun.ts:10` para em 1.000 resultados sem sinal de completude; `listarNoQase.ts` usa primeira página na reconciliação de run. Reprodução proposta: marcador além do teto/página, resposta anterior perdida, repetir. Impacto provável: resultado/run reenviado por ausência não comprovada. Causa candidata: array parcial usado como conjunto completo. Correção: paginar ou bloquear decisão de reenvio quando busca incompleta. Teste: 999/1000/1001 resultados, marcador tardio, ordenação adversa; nenhum POST enquanto houver incerteza. **P2**.

### QA-01 — Alta — suíte contém abertura SQLite proibida

**Confirmado por inspeção; guard bloqueia a execução.** `testes/unitario/backend/configuracoes/perfil-da-pessoa.test.mjs:4,67` importa e instancia SQLite `:memory:`; contradiz `AGENTS.md` e a promessa de testes sem SQLite. Não é evidência de acesso ao banco da pessoa. Impacto: check convencional não satisfaz o limite; runner por lista de substitutos não é barreira global. Correção: manter testes permitidos sem banco e separar qualquer validação real para escopo explicitamente autorizado; impor guarda central herdada. Teste: construtor proibido falha antes de abrir; não ocultar com skip/falso PASS. **P0 da validação**, não defeito comprovado de inicialização do produto. Armazenamento interno Chromium exige tratamento adicional descrito em A.

### QA-02 — Média — teste de publicação desvia do orquestrador

**Confirmado por assertions.** `testes/regressao/backend/testes/fluxo-qase.test.mjs:109-118` chama operação, marca publicada e associa separadamente; não chama `publicarProposta`. Impacto: teste verde das peças não detecta BE-02. Causa: teste reproduz composição do fluxo em vez do caminho público real. Correção/teste: invocar orquestrador real, mockar só fronteiras e conferir efeito/erro de associação sem republicação. **P1**, depende do contrato de aviso BE-02. Lacuna adicional QA-03: teste de sessão por salto no tempo não cobre polling; fechar junto de BE-01.

### QA-04 — Média — falha observada em Home/chat/reflow sem causa fechada

**Falha de teste confirmada no log; defeito funcional específico NÃO VERIFICADO.** `testes/regressao/frontend/agentes/agentes-logs-metricas-e-chat.test.mjs`, caso “Home, robô original, chat lateral e flutuante, reflow/zoom e redução de movimento”, foi marcado ✖. A rodada foi interrompida antes do resumo detalhado do reporter; não há assertion/stack final atribuível com segurança. Impacto para pessoa e causa raiz permanecem desconhecidos; concorrência de outra suíte é hipótese, não resolução. Correção recomendada: primeiro reproduzir isoladamente em harness conforme e capturar assertion/trace antes de alterar produto. Teste de correção: o mesmo cenário e seus oráculos originais, sem relaxar expected ou repetir seletivamente para esconder falha. **P0 da validação**, condicionado ao harness.

### QA-05 — Média — preflight de ambiente não cobre a entrada integral

**Risco provável condicionado ao ambiente.** `ferramentas/testes/executar.mjs:38-43` recusa flags de migração/executável instalado, mas `package.json` inicia `node --test` diretamente em test/check; `testes/apoio/janela.mjs` honra PRUMO_APP_EXE e migração usa perfil padrão. Nenhuma flag desse tipo foi usada pela auditoria, nem se afirma acesso ao perfil real. Reprodução proposta exclusivamente em processo sintético: preflight recebe env proibido e deve encerrar antes de spawn. Impacto potencial: check herdando flags pode alcançar instalado/perfil. Correção: centralizar preflight para todas as entradas; CI de instalação tem isolamento próprio explícito. **P1** com QA-01.

Não foi classificado achado crítico com evidência suficiente nesta rodada. Não se fez auditoria de vulnerabilidades abrangente, fuzzing ou pentest.

## F. Plano priorizado de recuperação

| Ordem | Trabalho concreto | Dependências | Critério de saída |
|---|---|---|---|
| P0.1 | Corrigir harness/guard de bancos, tratar armazenamento interno Chromium e centralizar preflight | Nenhuma correção funcional depende de abrir banco real | Prova de bloqueio antes de persistência proibida e perfis temporários exclusivos; regra documentada sem alegação falsa de zero bancos. |
| P0.2 | Reexecutar cenário Home isolado, capturar assertion/trace e diagnosticar | P0.1; evitar outra suíte usando o desktop | Falha reproduzível ou causa de automação/ambiente sustentada; nenhuma alteração de assertion para esconder defeito. |
| P1.1 | Corrigir renovação de sessão BE-01/QA-03 | Definir evento humano reconhecido | Polling não renova; interação definida renova; usuário recebe retomada clara. |
| P1.2 | Corrigir confirmação integral API-01 | Definir projeções/normalizações do efeito de cada campo | Adapters recusam estado divergente em todos os campos; estado UI/razão coerente. |
| P1.3 | Corrigir vínculo BE-02 + teste QA-02 | Contrato de aviso pós-sucesso remoto | Sucesso remoto preservado, falha local visível/reparável, sem nova criação remota. |
| P1.4 | Separar ausência e falha no worker BE-03 | Códigos de erro definidos | NOT_RUN por exclusão só quando ausente; corrupção/permissão com causa correta. |
| P1.5 | Tratar stream, spawn e reserva worker no atualizador | INFRA-01 antes do ciclo final INFRA-02/03 | Erros não encerram main, não anunciam início inexistente, não interrompem rotina nova. |
| P2.1 | Fechar hipóteses de idempotência/reconciliação API-02/03 | P1.2 | Marcador tardio/razão truncada não produz envio duplicado; incompletude bloqueia decisão. |
| P2.2 | Corrigir streaming/timeout do gerador do site INFRA-04 | Independente das telas | Limite antes de buffering, aborto observável, limpeza e fallback comprovados. |
| P2.3 | Consolidar regressão tela→efeito e matriz de risco | P0/P1 | Reabrir projeto, executar cenário sintético, conferir vínculo, logs, métricas e evidências correlacionadas; positivos/negativos/limites por fonte. |
| P2.4 | Planejar validação remota e humana separada | Ambiente/contas autorizados e política de dados explícita | Evidência real de Jira/Qase/GitHub, cofre e consentimento; nenhum resultado de fixture promovido a remoto real. |
| P3.1 | Reduzir concatenação/acoplamentos gradualmente | Preservar contratos/testes de fluxos | Localizar fluxo sem conhecer ordem implícita de fragmentos; regra de direção/ciclos verificável. |
| P3.2 | Atualizar documentação histórica/ajuda e proveniência de artefatos | Comportamento final conhecido | Textos vigentes distinguem consulta/instalação e login atual; artefatos identificam commit/versão. |

Nenhuma dessas correções foi autorizada como parte desta execução diagnóstica. O plano não inicia release. Quando houver pedido de versão nova, aplicar `docs/RELEASE.md` integralmente, inclusive ajuda/site/tag.

## G. Revisão cruzada e parecer conjunto

| Confronto efetivamente realizado | Resolução e pendência |
|---|---|
| Backend revisou APIs | Confirmou mecanismo dos confirmadores, corrigiu referências preliminares de linha e rejeitou inferência de que toda escrita falha. |
| QA revisou backend | Confirmou catches e sessão; contestou uso de fluxo-qase como teste do orquestrador: esse teste recompõe peças. Conclusão corrigida para cobertura parcial. |
| QA revisou APIs | API-01 confirmado; API-02/03 permanecem prováveis. Não há duplicação remota observada. |
| Infra confrontou demais áreas | Separou fonte local/instalado/unpacked, sucesso histórico de CI e falha parcial local; não atribuiu falha Home a empacotamento. Confirmou log da reprodução de stream feita pelo coordenador. |
| APIs revisou manual | Confronto entre espacos:criar, handler, regra, JSON e atualização visual; confirmação limitada a criação local e estado sem projeto, não reabertura/integração real. |
| Manual avaliou propostas | Aprova sentido funcional de mensagens claras para sessão e de distinguir operação localizada de campos conferidos; isso não é aprovação humana de produto ou execução. |
| Coordenação questionou provas | Reproduziu sessão/API/stream; distinguiu polling lógico de jornada GUI; preservou falha Home, bloqueio SQLite e desvio Chromium; não transformou silêncio em consenso técnico. |

**Parecer de backend:** modularidade majoritária útil; corrigir fronteiras de sessão, vínculo e diagnóstico sem reescrita geral. **APIs:** protocolos bem separados e controles implementados; confirmação/idempotência exigem reforço e prova. **Infra:** versões explicáveis, atualizador com falhas relevantes e evidência do instalado limitada. **QA Architect:** suíte tem oráculos úteis, mas presença de arquivo e fluxo recomposto não comprovam jornada; não recomenda prontidão/release. **QA manual:** inicialização e criação local observadas; demais efeitos reais e negativos não realizados, com limite de isolamento explícito. **Coordenador:** concorda com essas conclusões restritas; não há consenso fabricado sobre incidentes remotos, causa da falha Home ou funcionamento de todas as telas.

### Resposta ao critério final da missão

**Parcialmente.** Hoje é possível localizar tela, canal, handler, regra e testes para uma correção; a arquitetura e os inventários dão esse caminho. Ainda não é possível prometer, para toda funcionalidade, reprodução do defeito e validação confiável de ausência de regressão. Faltam harness conforme, causa da falha Home, testes do orquestrador e modos adversos, releitura integral do efeito remoto, prova de completude da reconciliação e jornadas autorizadas de persistência/integração/consentimento reais.

O diagnóstico está entregue com esses limites visíveis. O produto não foi declarado aprovado, integralmente testado ou pronto para nova release.
