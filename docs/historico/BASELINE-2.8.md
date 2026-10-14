# Baseline 2.8 — auditada em 2026-10-10

Repositório Prumo-Qa, branch `main`, limpa em `7d0d029`, tag `v2.7.0` publicada (release com instalador e SHA-256). Package 2.7.0. A auditoria confirmou a 2.7 como base e a nova versão 2.8.0 sem reutilizar tag.

`npm run check` antes das alterações: **215 testes, 211 aprovados, 0 falhas, 4 ignorados** (migração 2.2/2.6 e etapas só do instalador no CI). CI da 2.7.0: verde, release publicada com instalador não assinado.

Referências lidas sem alteração: `QA-Orchestrator` (`main` `e041003`), `ana-portifolio` (`main` `339b412`), `Prumo-QA-Lab` (`main` `8808e57`). Detalhes em [REAPROVEITAMENTO-2.8.md](REAPROVEITAMENTO-2.8.md).

Ambiente local: Windows 11 com Smart App Control. O compilador do broker (`aprovar.exe`) falha de forma intermitente no teste do broker (`spawnSync ... UNKNOWN`); isso é ambiental, não foi contornado nem convertido em skip, e o instalador só é gerado e testado no CI. k6 não está instalado nesta máquina.
