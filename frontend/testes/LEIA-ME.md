# Testes

**Para que serve esta tela/pasta:** Combina catálogo do repositório, casos Qase, propostas, automações e runs.

**Onde encontrar os arquivos:** mostrarTestesRemotos.js; guardarTelaTestesAnterior.js; formularios/montarFormularioProposta.js; cartoes/montarCartaoProposta.js; mostrarPropostasTeste.js; componentes/organizarSubabasTestes.js; mostrarCatalogoCodigo.js; mostrarTestesComSubabas.js; classificarCasoQase.js.

**Atenção:** Outras implementações aprovadas continuam em testes-v40.js e fluxos-v40.js; estas pastas ainda não são exclusivas.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
