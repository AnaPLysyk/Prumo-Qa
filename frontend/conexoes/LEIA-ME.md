# Conexões

**Para que serve esta tela/pasta:** Mostra contas de serviços externos e o estado de permissão de escrita.

**Onde encontrar os arquivos:** mostrarConexoes.js; mostrarEscritaExterna.js.

**Atenção:** Os tokens não ficam na interface após a configuração; credenciais são tratadas no processo principal.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
