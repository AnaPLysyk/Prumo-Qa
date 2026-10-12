# Testes — onde encontrar cada ação

**O que essa tela faz:** Consulta casos e planos do Qase na interface.

**Arquivos desta pasta:** mostrarTestesRemotos.js e classificarCasoQase.js.

**Como conversa com o sistema:** api.servicoConsultar via telas/compartilhado/consultarServicoRemoto.js → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/catalogoTestes.ts e src/fluxoQase.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
