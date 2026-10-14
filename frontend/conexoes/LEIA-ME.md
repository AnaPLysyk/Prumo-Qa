# Conexões

**Para que serve esta tela/pasta:** Mostra contas de serviços externos e o estado de permissão de escrita.

**Onde encontrar os arquivos:** mostrarConexoes.js; mostrarEscritaExterna.js; mostrarIntegracoesDosAgentes.js.

**Integrações dos agentes:** o topo da tela distribui o que alimenta os agentes: Claude Code e Codex por MCP (configurar e testar, por projeto) e Qase, Jira e GitHub para testes (conectar conta, ver escrita). A plataforma e os agentes locais funcionam sem essas ligações.

**Atenção:** Os tokens não ficam na interface após a configuração; credenciais são tratadas no processo principal.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
