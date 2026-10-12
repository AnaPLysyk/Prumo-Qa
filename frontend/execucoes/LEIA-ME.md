# Execuções

**Para que serve esta tela/pasta:** Exibe o histórico real de execuções e seus detalhes de Jira.

**Onde encontrar os arquivos:** mostrarExecucoes.js.

**Atenção:** A interface não inventa resultados de teste nem prova execução com base em um rótulo.

**Como funciona:** a interface chama operações permitidas de `app/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
