# Suporte — onde encontrar cada ação

**O que essa tela faz:** Prepara e revisa relatos antes de abrir uma issue pública.

**Arquivos desta pasta:** mostrarSuporte.js.

**Como conversa com o sistema:** api.suportePreparar, api.suporteAbrir e api.suporteConsultar → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/suporte.ts e src/chamados.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
