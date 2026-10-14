# Projetos — onde encontrar cada ação

**O que essa tela faz:** Monta a lista, cria, edita e seleciona projetos Prumo.

**Arquivos desta pasta:** mostrarProjetos.js, selecionarProjeto.js, modais/criarEditarProjeto/abrirFormularioProjeto.js e modais/escolherRepositorioGithub/abrirRepositoriosGithub.js (lista os repositórios da conta GitHub conectada, vincula e, se a pessoa quiser, traz uma cópia).

**Como conversa com o sistema:** api.espacos, api.espacoCriar, api.espacoEditar e api.espacoPasta, api.servicos, api.servicoRecursos, api.servicoVincular e api.espacoTrazer → `backend/aplicativo/preload.cjs` → `backend/aplicativo/api/catalogoDeContratos.ts` → `backend/aplicativo/api/registrarCanaisIpc.ts`.

**Quem executa a lógica:** `src/modulos/projetos/espacos/`.

**Estado:** esta é a parte da tela já separada. Outros arquivos do renderer (como `integracoes.js`, `fluxos-v40.js` e `interfaces-v36.js`) ainda podem complementar ou substituir ações. Não considerar esta pasta a implementação completa até concluir a migração.
