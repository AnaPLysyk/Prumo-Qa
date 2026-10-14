# Tickets

**Para que serve esta tela/pasta:** Mostra tickets do Jira e as operações de escrita autorizadas.

**Onde encontrar os arquivos:** mostrarTickets.js; mostrarOperacoesJira.js.

**Atenção:** O backend e o processo principal precisam autorizar qualquer escrita remota.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
