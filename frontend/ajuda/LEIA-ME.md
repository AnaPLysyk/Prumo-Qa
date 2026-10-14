# Ajuda — onde encontrar cada ação

**O que essa tela faz:** Mostra documentação e permite pesquisar guias e versões.

**Arquivos desta pasta:** mostrarAjuda.js.

**Como conversa com o sistema:** api.ajuda e funções do painel de versões → `backend/aplicativo/preload.cjs` → `backend/aplicativo/api/catalogoDeContratos.ts` → `backend/aplicativo/api/registrarCanaisIpc.ts`.

**Quem executa a lógica:** `src/painel.ts e src/versoes.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
