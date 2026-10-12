# Automações — onde encontrar cada ação

**O que essa tela faz:** Lista automações vinculadas e consulta o repositório GitHub.

**Arquivos desta pasta:** mostrarAutomacoes.js.

**Como conversa com o sistema:** api.espacoAutomacoes e api.servicoConsultar → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/espacos.ts e src/servicos.ts`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
