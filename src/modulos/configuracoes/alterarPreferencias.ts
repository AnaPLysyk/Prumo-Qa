/** Altera somente as preferências da interface autorizadas pelo contrato. */
import { alteracaoSchema } from './definirPreferencias.js';
import { lerPreferencias, gravar } from './armazenarPreferencias.js';

export function alterarPreferencias(alteracao: unknown, base?: string) {
  const a = alteracaoSchema.parse(alteracao); const atual = lerPreferencias(base);
  return gravar({ ...atual, ...a, ia: { ...atual.ia, ...(a.ia ?? {}), delegacao: atual.ia.delegacao } }, base);
}
