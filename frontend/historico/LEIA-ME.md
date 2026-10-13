# Histórico — onde encontrar cada ação

**O que essa tela faz:** Mostra histórico de eventos relacionados ao projeto.

**Arquivos desta pasta:** mostrarHistorico.js.

**Como conversa com o sistema:** usa dados do projeto e a tela principal de histórico → `backend/aplicativo/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/historicoCentral.ts (ainda não migrado)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
