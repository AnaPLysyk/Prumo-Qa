/** Troca as funções persistidas por versões em memória nos testes unitários, sem usar SQLite. */
import { mock } from 'node:test';
import { memoria } from './conhecimento-falso.mjs';
import substitutos from './conhecimento-substitutos.cjs';

for (const [arquivo, membros] of Object.entries(substitutos)) {
  const exports = Object.fromEntries(
    Object.entries(membros).map(([exportado, nome]) => [exportado, memoria[nome]])
  );
  mock.module('../../../dist/' + arquivo, { exports });
}
