# Ajuda — onde encontrar cada ação

**O que essa tela faz:** Mostra documentação e permite pesquisar guias e versões.

**Arquivos desta pasta:** mostrarAjuda.js.

**Como conversa com o sistema:** api.ajuda e funções do painel de versões → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/painel.ts e src/versoes.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
