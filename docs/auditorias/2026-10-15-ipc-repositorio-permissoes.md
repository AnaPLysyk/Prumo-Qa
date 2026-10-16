# Continuação — segurança IPC do repositório local

Data: 15/10/2026. Prumo QA 2.14.1, branch local `main`. Não publicar nem realizar commit.

## Escopo

Testar a fronteira dos canais privados `repositorio:listar`, `repositorio:caso` e `repositorio:suite` sem abrir Electron/Chromium, acessar SQLite, projetos externos ou perfil de produção.

**Estratégia:** chamar o `registrarCanal` de produção com `ipcMain` sintético; utilizar os esquemas Zod de produção, a política real `conferirAcessoAoCanal` e os handlers reais dos três canais. Simular somente a janela Electron, o estado da sessão e a leitura de projetos/propostas. A persistência de casos/suítes ocorre em JSON isolado no TEMP.

Arquivo novo: `testes/regressao/backend/aplicativo/ipc-repositorio-local-acesso.test.mjs`.

## Casos cobertos

1. Os três canais privados exigem sessão.
2. Estado de cadastro inicial e sessão expirada impedem leitura/escrita.
3. Perfil com permissão `VER` consulta, mas não cria.
4. Perfil com permissão `NENHUM` não consulta.
5. Perfil `USAR` grava uma suíte e um caso usando os handlers reais e relê o arquivo temporário.
6. Rebaixamento da permissão e troca de senha pendente bloqueiam novas gravações.
7. Remetentes/frames/URLs diferentes da janela principal são recusados.
8. Payload inesperado ou projeto com ID inválido é recusado antes de conferir a sessão.
9. Projeto com Qase vinculado bloqueia cadastro offline concorrente.
10. Diagnóstico IPC não armazena títulos nem dados dos passos.

## Resultado da validação direcionada

`node --experimental-test-module-mocks --test --test-concurrency=1 testes/regressao/backend/aplicativo/ipc-repositorio-local-acesso.test.mjs`

**10/10 PASS.**

`npm.cmd run build`: PASS (exit code 0).

## Limitações

Este é um teste de regressão de fronteira com infraestrutura Electron e sessão **simuladas**, e não uma homologação do aplicativo visual. O conjunto não autentica contas reais, não exercita a API de Chromium/Electron real, não testa filesystem do perfil real e não executa Jira/Qase/GitHub. O check geral protegido poderá terminar com testes de navegador bloqueados deliberadamente por `AGENTS.md`. Não reclassificar recusas intencionais como PASS.

A versão não foi alterada. Nenhum commit/push/deploy ou recurso externo deve ser realizado nesta etapa.

## Check geral

Resultado registrado ao final da rodada, em complemento abaixo.

### Resultado da rodada geral protegida

- `npm.cmd run check`, com `NODE_OPTIONS` restringindo SQLite e início de Electron/Chromium: **677 testes no total; 562 PASS, 110 FAIL, 5 SKIP**; código de saída **1**.
- As **110 falhas** contêm `electron.launch: TEST_ISOLATION_BLOCKED`, proteção intencional do runtime. O check geral permanece **não aprovado** e nenhum teste de interface real pode ser marcado como PASS por essa execução.
- Log em `C:\Users\DELL\AppData\Local\Temp\prumo-check-ipc-20261015.log`.
- Os **10 testes novos IPC PASS** também aparecem na execução geral. O build passou antes do check.
- Não foram executados o perfil do Prumo instalado, o Electron real nem serviços externos nesta nova suíte.

### Verificação específica do back-end
- `node ferramentas/testes/executar.mjs --camada backend`, com proteção ativa contra SQLite e Electron: **494/494 PASS**, código de saída **0**.
- Log local: `C:\Users\DELL\AppData\Local\Temp\prumo-backend-ipc-20261015.log`.
- Esta execução só aprova a camada back-end selecionada, não substitui a regressão E2E visual bloqueada.
