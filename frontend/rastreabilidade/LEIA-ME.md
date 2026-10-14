# Rastreabilidade

**Para que serve esta tela/pasta:** Exibe vínculos declarados e relacionamentos entre referências do projeto.

**Onde encontrar os arquivos:** mostrarRastreabilidade.js; mostrarVinculos.js; mostrarRastreabilidadeIntegrada.js.

**Atenção:** Associação declarada não comprova execução nem cobertura.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `src/contratos.ts` valida entradas e `src/desktop/main.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
