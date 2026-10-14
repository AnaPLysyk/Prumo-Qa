# Testes

**Para que serve esta tela/pasta:** Testes reúne IDE, Repositório, Runs e Planos. Execuções, evidências e vínculos fazem parte desses fluxos, sem telas ou módulos separados.

**Onde encontrar os arquivos:** visao-geral-dos-testes.parte.js; fluxos-casos-qase.parte.js; fluxos-planos-e-runs.parte.js; fluxos-vinculos.parte.js; componentes/organizarSubabasTestes.js; formularios/montarFormularioProposta.js; classificarCasoQase.js.

**Build:** testes-v40.js e fluxos-v40.js são gerados em dist/renderer a partir das partes-fonte por tela. Não editar os bundles.

**Como funciona:** a interface usa `backend/aplicativo/preload.cjs`; os canais em `backend/aplicativo/api/` validam as entradas e encaminham aos handlers em `backend/testes/api/`. Ainda são canais IPC, não endpoints HTTP.
