/** Revoga uma autorização de execução, uma política de escrita no Qase ou uma política de publicação no Jira. */
import { gravarAutorizacoes } from '../banco/autorizacoes.js';
import { lerAutorizacoes } from '../banco/autorizacoes.js';
import { Registro } from '../tipos/autorizacoes.js';

export function revogarAutorizacao<L extends 'execucoes' | 'escritas' | 'publicacoes'>(lista: L, id: string, base?: string, agora = new Date()): Registro[L][number] {
  const r = lerAutorizacoes(base); const a = (r[lista] as Registro[L][number][]).find(x => x.id === id);
  if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravarAutorizacoes(r, base); return a;
}
