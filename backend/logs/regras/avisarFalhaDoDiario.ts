/** Avisa no stderr quando o diário não pôde ser gravado, sem perder o resultado da operação. */

export const avisarFalhaDoDiario = (fase:string,id:string) => { process.stderr.write(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado; verifique PRUMO_DATA_DIR/permissões/limites.\n`); };
