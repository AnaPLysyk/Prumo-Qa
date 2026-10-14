# Agendamentos

**Para que serve esta tela/pasta:** Cria e lista rotinas programadas, exibe cartões e condições de autorização.

**Onde encontrar os arquivos:** mostrarAgendamentos.js; formularios/montarFormularioRotina.js; cartoes/montarCartaoRotina.js; permissoes/mostrarPermissoesRotina.js; datas/interpretarHorarios.js.

**Atenção:** A janela apenas apresenta horários e ações; a execução, o consentimento e a fila real são responsabilidades do backend.

**Como funciona:** a interface chama operações permitidas de `backend/aplicativo/preload.cjs`; `backend/aplicativo/api/catalogoDeContratos.ts` valida entradas e `backend/aplicativo/api/registrarCanaisIpc.ts` encaminha ao backend. Ainda são canais IPC, não endpoints HTTP.
