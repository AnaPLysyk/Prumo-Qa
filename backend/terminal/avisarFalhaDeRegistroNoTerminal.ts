/** Avisa no terminal quando o diário não pôde ser gravado (código de saída 3). */

export const avisarFalhaDeRegistroNoTerminal=(fase:string,id:string)=>{console.error(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado. Confira diretório de dados, permissões e limites.`);if(!process.exitCode)process.exitCode=3;};
