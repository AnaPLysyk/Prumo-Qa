# Fluxos de Tickets, Testes, Runs e Vínculos

A janela carrega `dist/renderer/fluxos-v40.js` e `dist/renderer/testes-v40.js`. Os dois são **gerados no build** a partir das partes abaixo, na ordem em que aparecem (a ordem importa: as partes compartilham o mesmo escopo). Edite a parte, não o arquivo gerado.

## fluxos-v40.js

1. `frontend/compartilhado/fluxos-abertura.parte.js`
2. `frontend/tickets/fluxos-tickets.parte.js`
3. `frontend/testes/fluxos-casos-qase.parte.js`
4. `frontend/runs/fluxos-planos-e-runs.parte.js`
5. `frontend/rastreabilidade/fluxos-rastreabilidade.parte.js`
6. `frontend/compartilhado/fluxos-fechamento.parte.js`

## testes-v40.js

1. `frontend/testes/visao-geral-dos-testes.parte.js`

## Como regenerar e conferir

- `node ferramentas/frontend/gerar-telas-modulares.mjs` gera os bundles; com `--check`, só confere se o carregado corresponde às partes.
- `npm run build` já regenera antes de compilar.
- Cada parte começa com um comentário de uma linha dizendo o que faz. O nome do arquivo diz a tela e o assunto.

Em Testes, as seções são IDE, Repositório, Runs e Planos (ver `frontend/testes/visao-geral-dos-testes.parte.js`). Execuções e Rastreabilidade não são mais telas do menu: a lista de execuções é Testes › Runs e os vínculos aparecem em Testes › Repositório.
