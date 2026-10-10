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
  notifFalhou: { 'pt-BR': 'Falhou', en: 'Failed' }
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
