# Baseline para evolução 2.6

Conferência em 10/10/2026, antes das alterações. Git limpo em `ddc8e24012a7f9ac1030347a5c3d4b3e11f27520`, branch main, versão 2.5.0.

- Release v2.5.0 confirmada pela API pública: publicada em `2026-10-10T20:31:14Z`, não rascunho, com `Prumo-QA-Setup-2.5.0.exe` e `.sha256`.
- CI da tag: [38083695789](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38083695789), completed/success. CI do commit documental atual ainda em andamento na consulta inicial.
- `npm.cmd run check`: typecheck e compilação passam fora do sandbox; **192 testes, 188 aprovados, 1 falha, 3 ignorados**. A falha preservada é `broker compilado no Windows recusa JSON sem escopo e data expirada sem pedir senha`: `spawnSync dist/aprovar.exe UNKNOWN`, sem exit code. É consistente com o bloqueio de Controle de Aplicativo documentado na 2.5; não comprova autenticação humana. Dentro do sandbox a compilação do broker falhou antes dos testes.
- Nenhuma assertion foi removida, nenhuma proteção alterada. Os três testes ignorados pertencem ao fluxo de migração com instalador e exigem o ambiente do CI.
- Instalador não assinado e autenticação humana ponta a ponta continuam pendências externas. A 2.5 está publicada; a evolução pode prosseguir com esse bloqueio local explicitamente registrado.
- Lab existe em pasta irmã, Git limpo, remoto configurado; existência do remoto ainda será conferida. Testes do produto usam somente fixtures temporárias sintéticas, sem bancos nem projetos externos.

Inspecionados contratos do produto, módulos, Skills, testes, workflows e documentação histórica. Contratos `AGENT_CONTRACT.md` e `AUTOMATION_CONTRACT.md` do QA-Orchestrator foram relidos: reaproveitamento conceitual de entendimento prévio, escopo, evidência e classificação; sem copiar código UNLICENSED ou impor RSpec/POM ao Prumo.
