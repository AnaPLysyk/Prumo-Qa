# Suporte — onde encontrar cada ação

**O que essa tela faz:** descreve, revisa e envia o chamado direto para a equipe (sem conta no GitHub), com até 3 imagens e 1 vídeo, e mostra Meus chamados com o estado e as respostas. Continua oferecendo abrir uma issue pública no GitHub ou exportar o relato.

**Arquivos desta pasta:** mostrarSuporte.js.

**Como conversa com o sistema:** api.suportePreparar, api.suporteAnexar, api.suporteEnviar, api.suporteMeus, api.suporteMeu, api.suporteAbrir, api.suporteExportar e api.suporteConsultar → `backend/aplicativo/preload.cjs` → `backend/aplicativo/api/catalogoDeContratos.ts` → `backend/aplicativo/api/registrarCanaisIpc.ts`.

**Quem executa a lógica:** `src/suporte.ts e src/chamados.ts (ainda não migrados)`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
