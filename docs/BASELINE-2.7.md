# Baseline 2.7 — auditada em 2026-10-10

Repositório Prumo-Qa, branch main, inicialmente limpo em `affb9c630428a85d5fdf02aba5a30fe7f98e80b3`, package 2.6.0. Release v2.6.0 existente, publicada em 2026-10-10T21:45:33Z. Auditoria confirmou 2.6 como base; nova versão 2.7.0 sem reutilizar tags. README, segurança, contratos, fluxo Electron/IPC/MCP, instalador e workflow Windows examinados.

`npm.cmd run check` antes das alterações: 204 testes, 200 pass, 1 fail, 3 skipped (migração só no instalado/CI). Falha do broker compilado: `spawnSync ... aprovar.exe UNKNOWN`, log local `.prumo/baseline-2.7.txt`. Não foi convertido em skip nem contornado com alteração de política. A primeira regressão depois da implementação compilou o broker novamente e passou: 211 testes, 208 pass, 0 fail, 3 skips de migração. O relatório final registra os testes acrescentados depois.

CI 2.6: [38089223329](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38089223329), verde; release [38088474506](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38088474506). Instalador 2.6 publicado/baixado, SHA-256 `53c1de612536f13afe817b0dd4f9ff09343991d5ac4bb3c60eabc68486fec183`, sem assinatura. Evidência histórica, não aprovação da 2.7.

Lab original em `8808e57`, não utilizado como alvo de testes. Novo clone isolado sob `.prumo/lab-2.7`, dados temporários e servidores controlados. QA-Orchestrator não alterado. Render existente autorizado `prumo-qa-docs`, ID `srv-db5aq2o473hc73ag1nh0`, workspace My Workspace; não criar outro nem alterar o portfólio.

Não há credenciais próprias Jira/Qase/GitHub disponíveis para autenticação desktop real. Implementação/testes seguem com fixtures fictícias; leituras reais ficam NOT_RUN, sem pedir ou fabricar credenciais. Não haverá escrita externa pelas integrações.
