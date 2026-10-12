# Runs

**Para que serve esta tela/pasta:** Mostra runs e cartões de resultados vinculados aos testes.

**Onde encontrar os arquivos:** mostrarRunsQase.js; cartoes/montarCartaoRun.js.

**Atenção:** Criar run não representa teste executado. Confirmações e publicações são controladas pelo backend.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
