# Métricas

**Para que serve esta tela/pasta:** Mostra métricas e representa os dados em diferentes visuais.

**Onde encontrar os arquivos:** mostrarMetricas.js; componentes/montarVisuaisMetricas.js.

**Atenção:** O frontend apenas apresenta agregações retornadas pelo núcleo e preferencias locais de visualização.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
