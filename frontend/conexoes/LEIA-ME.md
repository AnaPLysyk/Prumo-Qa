# Conexões

**Para que serve esta tela/pasta:** Mostra contas de serviços externos e o estado de permissão de escrita.

**Onde encontrar os arquivos:** mostrarConexoes.js; mostrarEscritaExterna.js.

**Atenção:** Os tokens não ficam na interface após a configuração; credenciais são tratadas no processo principal.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
