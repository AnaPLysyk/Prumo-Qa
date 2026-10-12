/** Diz se um tipo de achado é uma lacuna (requisito faltando, cobertura, rastreabilidade...). */

export const achadoELacuna=(tipo:string)=>/^(MISSING_|UNVERIFIED_|TRACEABILITY_GAP|COVERAGE_GAP|CONTRADICTORY_REQUIREMENT|CONTEXT_(UNAVAILABLE|NOT_APPROVED|OUTDATED|CONFLICT|SOURCE_MISSING|MISMATCH))/.test(tipo);
