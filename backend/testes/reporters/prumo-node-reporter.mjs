/** Converte eventos observados do node:test em resultados do contrato Prumo, sem transformar skip em PASS. */
import path from 'node:path';
import { createHash } from 'node:crypto';

export function casoDoNode(evento, status, { raiz, grupo, indice }) {
  if (evento.details?.type === 'suite') return null;
  const fonte = path.relative(raiz, evento.file ?? raiz).replaceAll('\\', '/');
  const id = createHash('sha256').update([grupo, fonte, evento.line, evento.name, indice].join('|')).digest('hex').slice(0, 24);
  return { id, status: evento.skip || evento.todo ? 'NOT_RUN' : status,
    evidence: `Evento node:test: ${evento.name}; ${fonte}:${evento.line ?? '?'}; duração ${evento.details?.duration_ms ?? '?'} ms${evento.skip ? '; SKIPPED: ' + evento.skip : ''}${evento.todo ? '; TODO: ' + evento.todo : ''}` };
}
