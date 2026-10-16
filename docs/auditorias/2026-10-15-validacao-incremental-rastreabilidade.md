# Validação incremental — rastreabilidade de casos e tickets

Data: 2026-10-15. Branch local: main, pacote 2.14.1. Nenhum commit, push, deploy ou alteração remota realizada durante esta validação.

## Mudanças
- A ação de associar ticket Jira a caso local só registra o vínculo após `servicoConsultar(projeto, 'jira', 'ticket', {}, chave)` retornar sucesso. O serviço de consulta confere a identidade do projeto vinculado. Chave de outro projeto não é consultada.
- O mapa de vínculos agora sinaliza tickets locais sem caso, além de tickets Jira. Relações declaradas não são resultados comprovados.
- Testes dinâmicos de UI exercitam sucesso de leitura Jira, falha de leitura e rejeição de chave de outro projeto, todos com stubs.

## Resultados
- `npm run build`: **PASS** (TypeScript e geração de interface).
- Testes direcionados de rastreabilidade (6) e interface (27): **33/33 PASS**.
- `npm run check` com `NODE_OPTIONS=--require .../no-database-no-desktop.cjs`: **519 testes, 482 PASS, 37 FAIL por bloqueio intencional do Playwright/Chromium**. O comando teve código de saída 1 e **não constitui aprovação global**. Log completo em `%LOCALAPPDATA%\\Temp\\prumo-check-fontes-20261015.log`.
- `node ferramentas/testes/executar.mjs --camada backend` com bloqueio de SQLite: **438/438 PASS**, código de saída 0. Log em `%LOCALAPPDATA%\\Temp\\prumo-backend-fontes-20261015.log`.
- `git diff --check`: PASS.

## Limitações / próximos passos
- Não foi executado teste visual do Electron nesta rodada: Chromium cria armazenamento interno e violaria o bloqueio de testes com bancos do `AGENTS.md`.
- Não houve teste real de escrita/leitura ponta a ponta em Jira KAN nem Qase PQ **via Prumo QA**. O teste Jira anterior no chat foi feito por conector Atlassian, não pelo Prumo; não conta como homologação da plataforma.
- Homologação em ambiente isolado deve seguir `docs/auditorias/2026-10-15-roteiro-homologacao-jira-qase.md`, com autorização e evidências por etapa. Nunca reutilizar tokens compartilhados em chat; rotacioná-los antes de uso real.

**Status:** ajustes de rastreabilidade aprovados em testes isolados; release bloqueada até homologação de interface e integrações reais.
