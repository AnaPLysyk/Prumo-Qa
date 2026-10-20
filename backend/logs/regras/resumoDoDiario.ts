/** Reúne resumo do diario da funcionalidade, mantendo cada operação identificável pelo nome. */
import { Evento, orientacoes } from "../tipos/atividade.js";
import { z } from "zod";
import { filtroSchema } from "../../projetos/tipos/painel.js";

/** Diz se um tipo de achado é uma lacuna (requisito faltando, cobertura, rastreabilidade...). */

export const achadoELacuna=(tipo:string)=>/^(MISSING_|UNVERIFIED_|TRACEABILITY_GAP|COVERAGE_GAP|CONTRADICTORY_REQUIREMENT|CONTEXT_(UNAVAILABLE|NOT_APPROVED|OUTDATED|CONFLICT|SOURCE_MISSING|MISMATCH))/.test(tipo);

/** `consolidado`: o último evento da operação; se ainda for o início, nenhum término foi observado. */
export function apresentarRegistroDoDiario(e: Evento, consolidado = false) {
  return { operationId: e.operationId, at: e.at, phase: e.phase, tool: e.tool, origin: e.origin, client: e.client, clientIdentity: e.clientIdentity,
    state: consolidado && e.phase === 'start' ? 'SEM_TERMINO_OBSERVADO' : e.state, durationMs: e.durationMs, input: e.input, summary: e.summary, findingsText: descreverAchados(e) };
}

export function descreverAchados(e:Evento) {return e.summary.types.map(t=>`${t.count} × ${orientacoes[t.type]}`).join(' ');}

export function filtrarRegistrosDoDiario(eventos: Evento[], f: z.output<typeof filtroSchema>) {
  return eventos.filter(e => (!f.tool || e.tool === f.tool) && (!f.state || e.state === f.state) && (!f.since || e.at >= f.since) && (!f.until || e.at <= f.until));
}
