# Agentes — onde encontrar cada ação

**O que essa tela faz:** Insere o modal Contextos e preserva a tela existente de Agentes.

**Arquivos desta pasta:** usarTelaAgentes.js e abrirModalContextos.js.

**Como conversa com o sistema:** api.contextosListar e abas.contextos → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/contextos.ts e src/orquestrador.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
