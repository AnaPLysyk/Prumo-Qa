/** Converte e valida os formatos do Qase utilizados pela funcionalidade de testes. */
import { z } from "zod";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { esquemaCaso } from "../tipos/escritaQase.js";
import { flagsDeAutomacao } from "./automacaoNoQase.js";
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";

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

export const corpoDoCasoQase = (p: z.infer<typeof esquemaCaso>) => ({
  title: mascarar(p.titulo), description: mascarar(p.descricao), preconditions: mascarar(p.preCondicoes), postconditions: mascarar(p.posCondicoes),
  steps: p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })), steps_type: 'classic',
  ...flagsDeAutomacao(p.automacao), tags: p.tags,
  ...(p.suiteId ? { suite_id: p.suiteId } : {}), ...(p.prioridade !== undefined ? { priority: p.prioridade } : {}), ...(p.severidade !== undefined ? { severity: p.severidade } : {}), ...(p.tipo !== undefined ? { type: p.tipo } : {})
});

export const camposDeSistema = async (ctx: ContextoServico) => z.object({ result: z.array(z.record(z.unknown())).default([]) }).passthrough().parse(await ctx.ler('/v1/system_field')).result.slice(0, 40).map(c => ctx.limpar(c));

export const idCriadoNoQase = (v: unknown) => z.object({ result: z.object({ id: z.union([z.number(), z.string()]).transform(String) }).passthrough() }).passthrough().parse(v).result.id;
