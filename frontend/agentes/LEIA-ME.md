# Agentes

**Para que serve esta tela/pasta:** Exibe agentes e abre os Contextos aprováveis em modal.

**Onde encontrar os arquivos:** usarTelaAgentes.js; mostrarAgentesIntegrados.js; abrirModalContextos.js.

**Atenção:** Outras telas e o núcleo de agentes ainda estão em interfaces-v36.js e src; agentes personalizados podem ser apenas prévias.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.

## Onde alterar o visual dos Agentes

As funções visuais avançadas estão em `frontend/agentes/visual-v36-fonte/` (como `listarAgentesDisponiveis`, `mostrarCerebroAgente`, `abrirDetalhesAgente` e `montarAssistenteFlutuante`). Seus estilos estão em `frontend/agentes/visual-v36-estilos/` (retratos, cérebro, tema claro e cenário).

Essas fontes compõem os bundles do visual v36; não carregue partes isoladas. Para testar identidade, rode `node ferramentas/frontend/gerar-telas-modulares.mjs --check` e `npm.cmd run check`.
