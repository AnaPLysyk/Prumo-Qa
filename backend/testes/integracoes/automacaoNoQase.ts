/** Converte o tipo de automação do caso para o formato do Qase (0/1 no envio) e lê qualquer formato que o Qase devolva. */
// A documentação descreve isManual/isToBeAutomated como boolean, mas a API real (homologada em 15/10/2026) recusa true/false:
// "Allowed values: 0, 1". A leitura aceita boolean, 0/1 ou o campo antigo `automation` (0 manual, 1 a automatizar, 2 automatizado).
type Automacao = 'manual' | 'a-automatizar' | 'automatizado';

export const flagsDeAutomacao = (a: Automacao) => ({ isManual: a === 'automatizado' ? 0 : 1, isToBeAutomated: a === 'a-automatizar' ? 1 : 0 });

const comoBool = (v: unknown) => (v === true || v === 1 ? true : v === false || v === 0 ? false : undefined);

export function automacaoLida(c: { isManual?: unknown; isToBeAutomated?: unknown; automation?: unknown }): Automacao | undefined {
  const manual = comoBool(c.isManual), aAutomatizar = comoBool(c.isToBeAutomated);
  if (manual !== undefined) return !manual ? 'automatizado' : aAutomatizar ? 'a-automatizar' : 'manual';
  return c.automation === 0 ? 'manual' : c.automation === 1 ? 'a-automatizar' : c.automation === 2 ? 'automatizado' : undefined;
}
