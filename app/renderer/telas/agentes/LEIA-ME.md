# Agentes

**Para que serve esta tela/pasta:** Exibe agentes e abre os Contextos aprováveis em modal.

**Onde encontrar os arquivos:** usarTelaAgentes.js; mostrarAgentesIntegrados.js; abrirModalContextos.js.

**Atenção:** Outras telas e o núcleo de agentes ainda estão em interfaces-v36.js e src; agentes personalizados podem ser apenas prévias.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
