/** Extrai do resumo do k6 as métricas principais (requisições, falhas, tempos). */

export function metricasDoK6(resumo: unknown) {
  const m = (resumo as { metrics?: Record<string, Record<string, unknown>> } | null)?.metrics; if (!m) return null;
  const pega = (nome: string, campos: string[]) => Object.fromEntries(campos.filter(c => typeof m[nome]?.[c] === 'number').map(c => [c, m[nome]![c]]));
  const limiares: { metrica: string; expressao: string; ok: boolean }[] = [];
  for (const [nome, v] of Object.entries(m)) { const t = v?.thresholds as Record<string, unknown> | undefined; if (t) for (const [expr, val] of Object.entries(t)) if (val && typeof val === 'object' && typeof (val as { ok?: unknown }).ok === 'boolean') limiares.push({ metrica: nome, expressao: expr, ok: (val as { ok: boolean }).ok }); }
  return { http_reqs: pega('http_reqs', ['count', 'rate']), http_req_failed: pega('http_req_failed', ['value', 'passes', 'fails']), http_req_duration: pega('http_req_duration', ['avg', 'med', 'p(90)', 'p(95)', 'max']), iterations: pega('iterations', ['count']), limiares };
}
