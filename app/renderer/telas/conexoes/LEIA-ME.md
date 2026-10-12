# Conexões — onde encontrar cada ação

**O que essa tela faz:** Configura conexões Jira, Qase ou GitHub e vincula recursos ao projeto.

**Arquivos desta pasta:** mostrarConexoes.js.

**Como conversa com o sistema:** api.servicoAdicionar, api.servicoValidar, api.servicoRecursos e api.servicoVincular → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/servicos.ts e src/operacoesExternas.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
