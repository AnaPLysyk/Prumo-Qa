# Funções compartilhadas

**Para que serve esta tela/pasta:** Reúne funções realmente usadas por mais de uma tela.

**Onde encontrar os arquivos:** criarBotaoAcao.js; criarCampoFormulario.js; mostrarDadosRetornados.js; consultarServicoRemoto.js; lerTextoRemoto.js; identificarTituloRemoto.js; criarCamposAgenda.js; mostrarEstadoWorker.js; acessarServicosExternos.js; acompanharEventosWorker.js.

**Atenção:** Não é tela navegável: qualquer função de uma única tela deverá ser movida à pasta dessa tela.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
