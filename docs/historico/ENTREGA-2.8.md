# Entrega 2.8.0

Release: https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.8.0 (instalador **não assinado**). SHA-256 conferido ao baixar o asset publicado: `e9794ac5d01dce1d46200a0250eb6bf4f2742cfbf8c2b6a47e06bf565ca3297c` (`Prumo-QA-Setup-2.8.0.exe`, 114.628.873 bytes).

## Resultados verificados

- Local: `npm run check` com 253 testes, 248 aprovados, 0 falhas, 5 ignorados (etapas só do instalador). O teste do broker compilado é intermitente nesta máquina por Smart App Control e não foi contornado.
- CI Windows no commit `e219fc4` (#31), no `8e5fd4e` (#32, `main`) e na tag `v2.8.0` (#33): todos verdes. Cobrem verificação completa, instalador, atualização 2.2/2.6/2.7 → 2.8 com dados preservados, janela e MCP no app instalado, demonstração com o laboratório fixado em `8808e57`, desinstalação mantendo dados e SHA-256.
- Demonstração de 26 passos (`testes/demonstracao-28.test.mjs`): agenda real, bandeja, execução real do laboratório, evidência íntegra, comentário Jira simulado sem duplicar, isolamento, pausa e saída.

## Não verificado

Autenticação humana real do Windows em execução agendada (testes simulam o consentimento no runner), Jira real com escrita, Qase e GitHub reais, k6 real (executável ausente), Playwright real, leitor de tela, assinatura digital, espanhol (não implementado) e ajuda longa em inglês (só a de agendamentos).
