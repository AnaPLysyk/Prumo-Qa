/** Avisa que o histórico está incompleto e usa o código de saída 3. */

export const avisarHistoricoIncompleto=(p:unknown[])=>{if(p.length){console.error('HISTORY_INCOMPLETE: registros inválidos/truncados excluídos; métricas são parciais.');process.exitCode=3;}};
