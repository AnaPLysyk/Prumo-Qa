# Fluxos de Tickets, Testes, Runs e Rastreabilidade

O arquivo `app/renderer/fluxos-v40.js` **continua sendo o script carregado no Electron** para não quebrar o estado compartilhado, os canais IPC e o visual.

Agora ele é gerado a partir de `35 partes` distribuídas entre `telas/tickets/fluxos-fonte/`, `telas/testes/fluxos-fonte/`, `telas/runs/fluxos-fonte/`, `telas/rastreabilidade/fluxos-fonte/` e `telas/compartilhado/fluxos-fonte/`.

- Edite **somente a parte identificada pelo nome da função**.
- Cada parte começa com uma frase descrevendo o que faz.
- Execute `node scripts/gerar-telas-v40.mjs` para regenerar `fluxos-v40.js`.
- Execute `node scripts/gerar-telas-v40.mjs --check` para conferir que o arquivo carregado corresponde às partes.
- O comando `npm.cmd run build` já regenera antes de compilar.

**Não carregue as partes diretamente no HTML**: o arquivo completo compartilha funções em um único escopo de execução. Esta organização mantém o resultado gerado idêntico ao arquivo anterior e permite a revisão por responsabilidades.

As regras de escrita remota, confirmação humana, MCP, rastreabilidade declarada e dados continuam no núcleo; esses trechos são apenas apresentação.
