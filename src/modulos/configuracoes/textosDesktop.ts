/** Fornece textos e modelos de menus da bandeja do aplicativo. */
/**
 * Textos do processo principal (bandeja, notificações e confirmações nativas da 2.8) em português e inglês.
 * Puro Node, sem Electron: o modelo do menu da bandeja é testado fora do Electron. Códigos e identificadores técnicos não são traduzidos.
 */
export type Idioma = 'pt-BR' | 'en';
const T = {
  abrir: { 'pt-BR': 'Abrir Prumo', en: 'Open Prumo' },
  agenda: { 'pt-BR': 'Ver agendamentos', en: 'View schedules' },
  execucoes: { 'pt-BR': 'Consultar execuções', en: 'View runs' },
  pausar: { 'pt-BR': 'Pausar agendamentos', en: 'Pause schedules' },
  retomar: { 'pt-BR': 'Retomar agendamentos', en: 'Resume schedules' },
  estado: { 'pt-BR': 'Estado do worker: {e}', en: 'Worker state: {e}' },
  sair: { 'pt-BR': 'Sair do Prumo', en: 'Quit Prumo' },
  parado: { 'pt-BR': 'Worker parado', en: 'Worker stopped' },
  pausado: { 'pt-BR': 'Agendamentos pausados', en: 'Schedules paused' },
  executando: { 'pt-BR': 'Executando uma rotina', en: 'Running a routine' },
  ativo: { 'pt-BR': 'Ativo — {a} rotina(s), {p} pendente(s)', en: 'Active — {a} routine(s), {p} pending' },
  tituloEstado: { 'pt-BR': 'Estado do worker', en: 'Worker state' },
  detalheEstado: { 'pt-BR': 'Próxima execução: {n}\nTrabalhos pendentes: {p}\nPausado: {z}\nÚltimo erro: {u}\n\nSe o computador estiver desligado ou suspenso, nada é executado nesse período.', en: 'Next run: {n}\nPending jobs: {p}\nPaused: {z}\nLast error: {u}\n\nIf the computer is off or suspended, nothing runs during that period.' },
  nenhuma: { 'pt-BR': 'nenhuma agendada', en: 'none scheduled' }, nenhum: { 'pt-BR': 'nenhum', en: 'none' }, sim: { 'pt-BR': 'sim', en: 'yes' }, nao: { 'pt-BR': 'não', en: 'no' },
  fechar: { 'pt-BR': 'Fechar', en: 'Close' },
  bandejaTitulo: { 'pt-BR': 'Prumo QA continua na bandeja', en: 'Prumo QA stays in the tray' },
  bandejaCorpo: { 'pt-BR': 'As rotinas agendadas seguem ativas. Use o ícone da bandeja para abrir ou sair.', en: 'Scheduled routines stay active. Use the tray icon to open or quit.' },
  dicaParado: { 'pt-BR': 'worker parado', en: 'worker stopped' }, dicaPausado: { 'pt-BR': 'agendamentos pausados', en: 'schedules paused' }, dicaExecutando: { 'pt-BR': 'executando', en: 'running' }, dicaAtivo: { 'pt-BR': 'ativo', en: 'active' },
  cancelar: { 'pt-BR': 'Cancelar', en: 'Cancel' },
  excluirTitulo: { 'pt-BR': 'Excluir rotina', en: 'Delete routine' }, excluirMsg: { 'pt-BR': 'Excluir a rotina "{n}"?', en: 'Delete the routine "{n}"?' },
  excluirDet: { 'pt-BR': 'A rotina deixa de executar. As execuções já registradas e as evidências permanecem.', en: 'The routine stops running. Runs already recorded and the evidence remain.' }, excluirBtn: { 'pt-BR': 'Excluir', en: 'Delete' },
  autTitulo: { 'pt-BR': 'Autorizar execuções agendadas', en: 'Authorize scheduled runs' }, autMsg: { 'pt-BR': 'Autorizar a rotina "{n}" por {d} dia(s) e até {u} execução(ões)?', en: 'Authorize the routine "{n}" for {d} day(s) and up to {u} run(s)?' },
  autDet: { 'pt-BR': '{r}\n\nAmbiente: {a}.\nA autorização vale somente para este projeto, ambiente e comando exatos; se o comando, o contrato ou as fontes mudarem, ela deixa de valer. Você pode revogá-la a qualquer momento. Em seguida o Windows pedirá a sua autenticação.', en: '{r}\n\nEnvironment: {a}.\nThe authorization is valid only for this exact project, environment and command; if the command, the contract or the sources change, it stops being valid. You can revoke it at any time. Windows will then ask for your authentication.' },
  continuar: { 'pt-BR': 'Continuar', en: 'Continue' },
  polTitulo: { 'pt-BR': 'Política de publicação no Jira', en: 'Jira publishing policy' }, polMsg: { 'pt-BR': 'Permitir comentários automáticos de resultado nestes tickets?\n{t}', en: 'Allow automatic result comments on these tickets?\n{t}' },
  polDet: { 'pt-BR': 'Projeto Prumo: {p}\nTipos de rotina: {i}\nValidade: {d} dia(s). Máximo: {m} comentário(s).\n\nSó serão publicados comentários de resultado (sem alterar o status dos tickets), em tickets do projeto Jira vinculado. Você pode revogar a política a qualquer momento.', en: 'Prumo project: {p}\nRoutine types: {i}\nValidity: {d} day(s). Maximum: {m} comment(s).\n\nOnly result comments will be published (without changing ticket status), on tickets of the linked Jira project. You can revoke the policy at any time.' },
  polBtn: { 'pt-BR': 'Aprovar política', en: 'Approve policy' },
  pubTitulo: { 'pt-BR': 'Publicar comentário no Jira', en: 'Publish comment to Jira' }, pubMsg: { 'pt-BR': 'Publicar este resultado no ticket {t}?', en: 'Publish this result to ticket {t}?' },
  pubDet: { 'pt-BR': '{x}\n\nSerá criado um comentário. O status do ticket não será alterado.', en: '{x}\n\nA comment will be created. The ticket status will not be changed.' }, pubBtn: { 'pt-BR': 'Publicar', en: 'Publish' },
  notifFalhou: { 'pt-BR': 'Falhou', en: 'Failed' },
  opTitulo: { 'pt-BR': 'Confirmar operação externa', en: 'Confirm external operation' }, opMsg: { 'pt-BR': 'Executar no {s}: {r}?', en: 'Run on {s}: {r}?' },
  opDet: { 'pt-BR': '{x}\n\nProjeto Prumo: {p}.\nA operação é idempotente: repetir não duplica. Depois do envio o serviço é relido para confirmar o resultado.', en: '{x}\n\nPrumo project: {p}.\nThe operation is idempotent: repeating it does not duplicate. After sending, the service is read again to confirm the result.' }, opBtn: { 'pt-BR': 'Executar', en: 'Run' },
  habTitulo: { 'pt-BR': 'Habilitar escrita externa', en: 'Enable external writing' }, habMsg: { 'pt-BR': 'Permitir que o Prumo escreva no {s} neste projeto?', en: 'Allow Prumo to write to {s} in this project?' },
  habDet: { 'pt-BR': 'Isto não executa nada. Cada operação (criar, anexar, editar, mudar status, publicar...) ainda pedirá a sua confirmação, com prévia. Só rotas fixas são usadas e nada é apagado. Você pode desabilitar a qualquer momento.', en: 'This runs nothing. Each operation (create, attach, edit, change status, publish...) will still ask for your confirmation, with a preview. Only fixed routes are used and nothing is deleted. You can disable it at any time.' }, habBtn: { 'pt-BR': 'Habilitar', en: 'Enable' },
  revTitulo: { 'pt-BR': 'Confirmar revisão da proposta', en: 'Confirm proposal review' }, revMsg: { 'pt-BR': 'Você revisou esta proposta?', en: 'Did you review this proposal?' },
  revDet: { 'pt-BR': 'Você confirma que verificou: duplicidade, requisito coberto, risco e cobertura. A revisão fica registrada com o seu nome e vale só para este texto: editar a proposta a invalida.', en: 'You confirm that you checked: duplicates, covered requirement, risk and coverage. The review is recorded under your name and only applies to this text: editing the proposal invalidates it.' }, revBtn: { 'pt-BR': 'Confirmar revisão', en: 'Confirm review' },
  pubRunTitulo: { 'pt-BR': 'Publicar resultados no Qase', en: 'Publish results to Qase' }, pubRunMsg: { 'pt-BR': 'Publicar {n} resultado(s) na run {r}?', en: 'Publish {n} result(s) to run {r}?' },
  pubRunDet: { 'pt-BR': '{x}\n\nCasos sem execução (NOT_RUN) não são enviados. Resultados já publicados não são repetidos. Depois do envio a run é relida no Qase.', en: '{x}\n\nCases that were not run (NOT_RUN) are not sent. Results already published are not repeated. After sending, the run is read again on Qase.' },
  execRunTitulo: { 'pt-BR': 'Executar automações da run', en: 'Run the automations of the run' }, execRunMsg: { 'pt-BR': 'Executar {n} automação(ões) associada(s) a esta run?', en: 'Run {n} automation(s) associated with this run?' },
  execRunDet: { 'pt-BR': 'Somente capabilities declaradas no contrato do projeto. O Windows pedirá a sua autenticação para cada uma. Casos manuais não são executados.', en: 'Only capabilities declared in the project contract. Windows will ask for your authentication for each one. Manual cases are not run.' }, execRunBtn: { 'pt-BR': 'Continuar', en: 'Continue' },
  manTitulo: { 'pt-BR': 'Declarar resultado manual', en: 'Declare manual result' }, manMsg: { 'pt-BR': 'Declarar {s} para o caso {c}?', en: 'Declare {s} for case {c}?' },
  manDet: { 'pt-BR': 'O resultado fica marcado como MANUAL, com o seu nome. Ele não vem de uma execução do Prumo.', en: 'The result is marked MANUAL, under your name. It does not come from a Prumo run.' }, manBtn: { 'pt-BR': 'Declarar', en: 'Declare' },
  polQaseTitulo: { 'pt-BR': 'Política de publicação no Qase', en: 'Qase publishing policy' }, polQaseMsg: { 'pt-BR': 'Permitir que rotinas agendadas publiquem resultados na run {r}?', en: 'Allow scheduled routines to publish results to run {r}?' },
  polQaseDet: { 'pt-BR': 'Projeto Prumo: {p}\nValidade: {d} dia(s). Máximo: {m} publicação(ões).\nSó resultados (passed, failed, blocked) dessa run. Sem a política, nada é publicado automaticamente. Você pode revogar a qualquer momento.', en: 'Prumo project: {p}\nValidity: {d} day(s). Maximum: {m} publication(s).\nOnly results (passed, failed, blocked) of that run. Without the policy nothing is published automatically. You can revoke it at any time.' }, polQaseBtn: { 'pt-BR': 'Aprovar política', en: 'Approve policy' },
  agTitulo: { 'pt-BR': 'Alterar permissões da IA', en: 'Change AI permissions' }, agMsg: { 'pt-BR': 'Salvar as especializações e políticas deste projeto?', en: 'Save this project\'s specializations and policies?' },
  agDet: { 'pt-BR': 'Especializações habilitadas: {e}\nCapacidades bloqueadas: {b}\nO bloqueio vale no servidor MCP a cada chamada. A IA nunca ganha permissão de escrita externa por aqui.', en: 'Enabled specializations: {e}\nBlocked capabilities: {b}\nBlocking applies on the MCP server on every call. The AI never gains external write permission here.' }, agBtn: { 'pt-BR': 'Salvar', en: 'Save' },
  arquivoTitulo: { 'pt-BR': 'Escolher o arquivo para anexar', en: 'Choose the file to attach' }
} as const;
export type Chave = keyof typeof T;
export const tm = (chave: Chave, idioma: Idioma, vars: Record<string, string | number> = {}) => T[chave][idioma].replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));

export type EstadoWorker = { executando: boolean; pausado: boolean; emExecucao: string | null; rotinasAtivas: number; pendentes: number; proximaExecucao: string | null; ultimoErro: string | null; trava?: { vivo: boolean } };
export function resumoEstado(e: EstadoWorker, i: Idioma) {
  return !e.executando ? tm('parado', i) : e.pausado ? tm('pausado', i) : e.emExecucao ? tm('executando', i) : tm('ativo', i, { a: e.rotinasAtivas, p: e.pendentes });
}
export type ItemMenu = { id: 'abrir' | 'agenda' | 'execucoes' | 'pausar' | 'retomar' | 'estado' | 'sair' | 'separador'; rotulo: string };
/** Modelo puro do menu da bandeja. Pausar e Retomar nunca aparecem juntos; o item de estado reflete o worker real. */
export function modeloMenuBandeja(e: EstadoWorker, i: Idioma): ItemMenu[] {
  return [
    { id: 'abrir', rotulo: tm('abrir', i) }, { id: 'agenda', rotulo: tm('agenda', i) }, { id: 'execucoes', rotulo: tm('execucoes', i) }, { id: 'separador', rotulo: '' },
    e.pausado ? { id: 'retomar', rotulo: tm('retomar', i) } : { id: 'pausar', rotulo: tm('pausar', i) },
    { id: 'estado', rotulo: tm('estado', i, { e: resumoEstado(e, i) }) }, { id: 'separador', rotulo: '' }, { id: 'sair', rotulo: tm('sair', i) }
  ];
}
export const dicaBandeja = (e: EstadoWorker, i: Idioma) => `Prumo QA — ${!e.executando ? tm('dicaParado', i) : e.pausado ? tm('dicaPausado', i) : e.emExecucao ? tm('dicaExecutando', i) : tm('dicaAtivo', i)}`;
