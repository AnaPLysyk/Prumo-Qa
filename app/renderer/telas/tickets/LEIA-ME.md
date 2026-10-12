# Tickets — onde encontrar cada ação

**O que essa tela faz:** Consulta tickets e mostra detalhes retornados pelo Jira.

**Arquivos desta pasta:** mostrarTickets.js.

**Como conversa com o sistema:** api.servicoConsultar via telas/compartilhado/consultarServicoRemoto.js → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/leiturasServicos.ts e src/operacoesExternas.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
