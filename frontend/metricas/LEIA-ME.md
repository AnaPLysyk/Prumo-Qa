# Métricas

**Para que serve esta tela/pasta:** Mostra métricas e representa os dados em diferentes visuais.

**Onde encontrar os arquivos:** mostrarMetricas.js; componentes/montarVisuaisMetricas.js.

**Atenção:** O frontend apenas apresenta agregações retornadas pelo núcleo e preferencias locais de visualização.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
