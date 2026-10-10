# Entrega Prumo QA 2.2 — aplicativo Windows

## O que foi implementado

- Janela desktop (Electron 44) com Projetos, Métricas, Logs (filtros e acompanhamento), Histórico, Evidências, Conexões e Ajuda (privacidade, termos e limites em rascunho).
- Núcleo preservado: `projeto`, `qualidade`, `execucao`, `evidencias`, `atividades`, `conexoes`, `aprovacao`, MCP e CLI. Mudanças no núcleo: `atividades.diretorioDados` (extraída), runtime embutido em `conexoes`/`execucao` (`ELECTRON_RUN_AS_NODE`) e a correção de `mascarar` abaixo.
- Camada nova: `src/vinculos.ts`, `src/painel.ts` (adaptador sem regra própria), `src/desktop/main.ts`, `app/` (preload, interface, ajuda), `electron-builder.yml`, `assets/` (ícone provisório), `scripts/demonstrar-app.mjs`, `.github/workflows/windows.yml`.
- Instalador NSIS por usuário, pasta alterável, atalhos no menu Iniciar e na área de trabalho, desinstalador, sem inicialização automática, sem apagar dados na desinstalação.

## Defeito encontrado e corrigido

`mascarar("Authorization: Bearer abc.def.ghi")` devolvia `Authorization: [REDACTED] abc.def.ghi` — o token continuava visível em evidências e na janela. Corrigido em `src/projeto.ts` (Bearer tratado antes da regra genérica), com teste de regressão em `testes/painel.test.mjs`.

Outros achados do CI numa máquina limpa: o `TEMP` do runner vem em formato 8.3 (`RUNNER~1`) e vários testes antigos usavam esse caminho sem `realpath`. O núcleo sempre usa o caminho real, então os fixtures foram ajustados a isso (nenhuma asserção foi afrouxada). `vinculos.ts` passou a comparar caminhos canônicos.

## Testes

| Verificação | Resultado |
|---|---|
| `npm run check` local (tipos + build + 83 testes, inclui janela real) | 83/83, 0 falhas, 0 ignorados na última rodada |
| Broker `aprovar.exe` no ambiente local | **intermitente**: bloqueado pelo Smart App Control em algumas rodadas (`spawnSync UNKNOWN`); em rodadas anteriores desta sessão falhou, na última passou. Não foi alterado nem contornado |
| `npm run check` no Windows limpo do GitHub Actions | passou (inclui o teste do broker) |
| Janela sobre `win-unpacked` local (`PRUMO_APP_EXE`) | 8/8 |
| Janela e MCP sobre o programa **instalado** em `C:\Prumo QA instalação` (CI) | 8/8 |
| Instalação silenciosa, atalhos, desinstalação preservando `%LOCALAPPDATA%\PrumoQA` (CI) | passou |
| `npm audit --omit=dev` | 0 vulnerabilidades. `npm audit` completo: 8 moderadas, todas na cadeia de build do electron-builder (`sprintf-js`), que não vai no instalador |

Testes novos de janela (Playwright sobre o Electron real): abertura e versão, sete seções sem erro de console, isolamento (`contextIsolation`, `sandbox`, sem `require`/`process`, ponte congelada com 13 funções), rede bloqueada (fetch e navegação), IPC com argumentos inválidos / raiz não vinculada / remetente estranho, projeto com e sem manifesto, fluxo MCP→logs ao vivo→métricas→histórico→evidências, persistência após reabrir, sessão MCP independente com a janela fechada, funcionamento com proxy inexistente, ajuda e proposta de conexão sem alterar clientes de IA.

## Demonstração

`node scripts/demonstrar-app.mjs "<caminho>\Prumo QA.exe"` executa o roteiro completo (janela real, MCP real, projeto de demonstração) e grava capturas e `resumo.json` em `.prumo/demonstracao-app/` (fora do Git). Execução local sobre `win-unpacked`: 4 operações MCP registradas (contexto, revisão com 1 redundância candidata, execução protegida `BLOCKED` por `HUMAN_APPROVAL_REQUIRED`, consulta de evidências), histórico preservado após fechar e reabrir (4 → 5 operações, incluindo a chamada feita com a janela fechada), `PASS = 0`.

## Limitações e verificações humanas pendentes

- **Instalador não assinado.** SmartScreen pode alertar; com Smart App Control ativo o Windows pode bloquear o instalador e o `aprovar.exe`. Não foi desativada nenhuma proteção.
- **Build local do instalador bloqueado nesta máquina** (Smart App Control bloqueia o instalador provisório que o electron-builder executa). O instalador foi gerado e testado no runner do GitHub. **Instalar e abrir o `.exe` nesta máquina não foi validado**; é uma verificação humana.
- Autenticação humana ponta a ponta (CredUI) continua não exercida por mim: exige sua senha. Nada foi simulado.
- Interação gráfica humana (aparência em outras escalas de tela, leitor de tela) não foi validada; só a automação.
- Ícone provisório; textos de privacidade e termos são rascunhos que precisam de revisão jurídica.
- Atalho na área de trabalho é sempre criado (sem página de escolha no instalador).
- Pacote sem npm: capacidades `npm run` exigem Node com npm instalado.
- Claude Code não estava instalado; a configuração para ele é um comando a copiar. Codex: proposta e confirmação nativas implementadas; a escrita real não foi exercida nesta entrega.
- Sem auto-atualização, sem assinatura, execução protegida só no Windows.
