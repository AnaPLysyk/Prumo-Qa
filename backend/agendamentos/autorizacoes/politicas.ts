/** Prepara políticas aprováveis de escrita e publicação para execuções agendadas. */
import { randomUUID } from "node:crypto";
import { validadeDaAutorizacao } from "./autorizarRotina.js";
import { abrirEspacoDeAutorizacoes } from "./estadoERevogacao.js";
import { estadoDaAutorizacao } from "./estadoERevogacao.js";
import { gravarAutorizacoes, lerAutorizacoes } from "../banco/autorizacoes.js";
import { PoliticaEscrita, escritaSchema, PoliticaPublicacao, pubSchema } from "../tipos/autorizacoes.js";

export function criarPoliticaEscrita(espacoId: string, d: { operacao: PoliticaEscrita['operacao']; runs: number[]; dias: number; maxUsos: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaEscrita {
  const p = escritaSchema.parse({ id: randomUUID(), espacoId, operacao: d.operacao, runs: [...new Set(d.runs)], criadaEm: agora.toISOString(), validaAte: validadeDaAutorizacao(d.dias, agora), maxUsos: d.maxUsos, usos: 0, aprovadoPor, revogadaEm: null });
  const r = lerAutorizacoes(base); r.escritas = abrirEspacoDeAutorizacoes(r.escritas, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.escritas.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.escritas) if (x.espacoId === espacoId && x.operacao === p.operacao && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.escritas.push(p); gravarAutorizacoes(r, base); return p;
}

export function criarPoliticaPublicacao(espacoId: string, d: { tickets: string[]; tipos: PoliticaPublicacao['tipos']; dias: number; maxPublicacoes: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaPublicacao {
  const p = pubSchema.parse({ id: randomUUID(), espacoId, tickets: [...new Set(d.tickets.map(t => t.toUpperCase()))], tipos: d.tipos, criadaEm: agora.toISOString(), validaAte: validadeDaAutorizacao(d.dias, agora), maxPublicacoes: d.maxPublicacoes, usadas: 0, aprovadoPor, revogadaEm: null });
  const r = lerAutorizacoes(base); r.publicacoes = abrirEspacoDeAutorizacoes(r.publicacoes, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.publicacoes.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.publicacoes) if (x.espacoId === espacoId && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.publicacoes.push(p); gravarAutorizacoes(r, base); return p;
}
