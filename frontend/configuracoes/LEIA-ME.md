# Configurações

**Para que serve esta tela/pasta:** Controla menu, tema, idioma e opções da janela.

**Onde encontrar os arquivos:** controlesDaJanela.js.

**Atenção:** O backend de preferências fica em src/modulos/configuracoes, e a autorização de IA em src/modulos/agentes.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
