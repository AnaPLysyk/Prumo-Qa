# Jornada integrada isolada — casos e suítes locais

Data: 15/10/2026. Repositório local `C:\Users\DELL\projetos-github\Prumo-Qa`. Versão do pacote: 2.14.1.

## Objetivo
Reduzir a lacuna entre testes isolados do frontend e testes isolados do armazenamento, **sem iniciar Electron/Chromium**, bancos SQLite ou serviços externos.

## Implementação
Arquivo novo: `testes/regressao/frontend/testes/jornada-integrada-local.test.mjs`. A jornada foi classificada como regressão/integração por atravessar a interface e o back-end, não como teste unitário puro.

A jornada executa o **código original do formulário** em um DOM sintético de Node VM, passa pelo **esquema Zod real dos canais IPC** e pelos **handlers de produção** `repositorio:caso`, `repositorio:suite` e `repositorio:listar`. As regras persistem um JSON de teste em pasta TEMP exclusiva, definida explicitamente em `PRUMO_DATA_DIR` e removida ao fim. Somente a busca de projetos e a leitura de propostas antigas são substituídas por fixtures sintéticas, sem credenciais.

O transporte Electron IPC (`ipcMain`, sessão, identificação de remetente), a janela, seu layout/acessibilidade visual e a confirmação nativa **não** são exercitados nesta jornada; não usar o resultado como aprovação de E2E Electron.

## Cenários confirmados
- Criar suíte no formulário, criar caso com passos/dados e requisito, reler persistência JSON e editar sem duplicar ID.
- Recusar argumentos não previstos pelos contratos Zod e não persistir dados inválidos.
- Impedir suíte de outro projeto e cadastro local concorrente quando Qase está vinculado.
- Manter formulário aberto e informar falha de validação.
- Impedir ciclo entre suítes pela própria interface e conservar dados anteriores.

## Evidências
- Teste direcionado: **5/5 PASS**, sem navegador.
- Suíte unitária do frontend: **66/66 PASS**.
- Build TypeScript e bundles: **PASS**.
- `npm run check` protegido por bloqueio explícito de SQLite/Electron: ver complemento de resultado da rodada.

## Próximas barreiras
- Os testes Playwright/Chromium dependem do armazenamento interno do navegador. A política em `AGENTS.md` ainda proíbe testes que toquem banco; não desabilitar a proteção para inventar um PASS.
- E2E visual real, sessão de login, segurança IPC e integrações Jira/Qase reais continuam **NOT_RUN** nesta etapa.
- Requer revisão consciente da política ou ambiente de homologação com exceção explícita e controlada, sem acesso ao perfil de produção.

Nenhum commit, push, deploy, token ou recurso externo foi executado por esta implementação.

## Resultado final do check protegido
- Antes da realocação física do mesmo arquivo de teste: **667 testes**, **552 PASS**, **110 FAIL**, **5 SKIP**, código de saída **1**.
- As **110 falhas** registram `electron.launch: TEST_ISOLATION_BLOCKED`. O check **NÃO passou**. Não são bugs do núcleo local comprovados por esta execução.
- Log: `C:\Users\DELL\AppData\Local\Temp\prumo-check-jornada-20261015.log`.
- Após mover o arquivo de testes de unitário para regressão/frontend, os **mesmos 5 cenários passaram novamente (5/5 PASS)**.
- Resultado de 66/66 unitários frontend corresponde à execução **antes** da realocação do arquivo. A classificação final é de regressão/integração.
