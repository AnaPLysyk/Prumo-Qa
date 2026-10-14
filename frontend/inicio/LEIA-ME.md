# Início

**Para que serve esta tela/pasta:** Monta a tela inicial e o chat visual usando os dados que o núcleo retorna.

**Onde encontrar os arquivos:** mostrarInicio.js.

**Atenção:** O estado do worker e os controles da janela estão em pastas compartilhadas. Não contém um modelo de IA independente.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
