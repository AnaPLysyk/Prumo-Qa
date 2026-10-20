/** Consultas do diário: logs, histórico consolidado e exportação. */
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { consultarAtividades } from "./iniciarAtividade.js";
import { apresentarRegistroDoDiario, filtrarRegistrosDoDiario } from "./iniciarAtividade.js";
import { projetoVinculado } from "../../projetos/servicoProjetos.js";
import { Filtro, filtroSchema } from "../../projetos/contratos.js";

// listarLogsDoProjeto — responsabilidade deste trecho
export async function listarLogsDoProjeto(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados());
  return { events: filtrarRegistrosDoDiario(h.events, f).slice(-f.limit).map(e => apresentarRegistroDoDiario(e)), problems: h.problems, complete: h.complete };
}

// listarHistoricoDoProjeto — responsabilidade deste trecho
export async function listarHistoricoDoProjeto(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados());
  return { activities: filtrarRegistrosDoDiario(h.activities, f).slice(-f.limit).reverse().map(a => apresentarRegistroDoDiario(a, true)), problems: h.problems, complete: h.complete,
    notice: 'Recomendações são orientações do Prumo. Ele não observa se a IA as aplicou.' };
}

// exportarLogs — responsabilidade deste trecho
/** Exporta o histórico bruto do projeto (somente campos do esquema, sem texto livre). */
export async function exportarLogs(raiz: string) {
  const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados());
  return JSON.stringify({ exportedAt: new Date().toISOString(), project: p.manifesto.id, events: h.events, problems: h.problems }, null, 2);
}
