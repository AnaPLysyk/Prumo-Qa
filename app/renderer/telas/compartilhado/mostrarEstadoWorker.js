'use strict';
/** Traduz estados do worker para indicadores de interface. */
const estadoOrb = (w) => (!w || !w.executando ? 'parado' : w.emExecucao ? 'executando' : 'ocioso');
const nivelWorker = (w) => (!w || !w.executando || !w.trava?.vivo ? 'falha' : w.pausado ? 'aviso' : 'ok');
const textoWorker = (w) => (!w || !w.executando || !w.trava?.vivo ? tr('Worker parado') : w.pausado ? tr('Agendamentos pausados') : w.emExecucao ? tr('Executando uma rotina') : tr('Worker ativo'));

