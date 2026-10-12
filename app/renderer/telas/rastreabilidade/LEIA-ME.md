# Rastreabilidade — onde encontrar cada ação

**O que essa tela faz:** Mostra associações declaradas e permite ligar ticket Jira a caso Qase.

**Arquivos desta pasta:** mostrarRastreabilidade.js.

**Como conversa com o sistema:** api.servicoConsultar e api.espacoAssociar → `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`.

**Quem executa a lógica:** `src/modulos/projetos/espacos/associarReferencias.ts e src/rastreabilidade.ts`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
