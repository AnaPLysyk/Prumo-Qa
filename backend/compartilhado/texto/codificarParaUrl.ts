/** Codifica um texto para ir dentro de um endereço (URL). */

/**
 * Escritas controladas no Qase TestOps (API v1, qase-tms/specs). O projeto é o código vinculado (rec.chave).
 * Rotas: POST /case|suite|plan|run/{code}, PATCH /case/{code}/{id}, POST /run/{code}/{id}/complete, POST /result/{code}/{run}/bulk,
 * POST /attachment/{code} (multipart, campo file[]), POST /case/{code}/external-issue/attach. Criação de caso, run e plano é
 * idempotente (busca por título e marcador); resultados levam o marcador no comentário e são conferidos relendo a run.
 * Não existe PASS sem execução: resultados só entram aqui com status vindo de uma execução ou de declaração humana explícita.
 */
export const codificarParaUrl = encodeURIComponent;
