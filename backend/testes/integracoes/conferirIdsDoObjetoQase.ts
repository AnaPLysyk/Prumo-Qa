/** Confere casos do plano/run releitos do Qase: IDs, não apenas quantidade. */
export const conferirIdsDoObjetoQase = (valor: unknown, esperados: number[]): boolean => {
  if (!Array.isArray(valor)) return false;
  const ids = valor.map((x: unknown): number | null => {
    const candidato = typeof x === 'number' || typeof x === 'string'
      ? x
      : x !== null && typeof x === 'object' && ('id' in x || 'case_id' in x)
        ? ('case_id' in x ? x.case_id : x.id) : null;
    if ((typeof candidato !== 'number' && typeof candidato !== 'string') || String(candidato).trim() === '') return null;
    const id = Number(candidato);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  });
  if (ids.includes(null)) return false;
  const esperadosUnicos = new Set(esperados);
  const lidosUnicos = new Set(ids);
  return ids.length === lidosUnicos.size && lidosUnicos.size === esperadosUnicos.size &&
    [...esperadosUnicos].every(id => lidosUnicos.has(id));
};
