# Automações

**Para que serve esta tela/pasta:** Apresenta automações locais e repositórios GitHub vinculados.

**Onde encontrar os arquivos:** mostrarAutomacoes.js; mostrarAutomacoesGithub.js.

**Atenção:** A execução protegida e os registros reais ficam no backend.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
