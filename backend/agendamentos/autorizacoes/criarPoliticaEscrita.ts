/** Cria a política que permite rotinas publicarem resultados numa run do Qase, com validade e limite. */
import { randomUUID } from 'node:crypto';
import { validadeDaAutorizacao } from './validadeDaAutorizacao.js';
import { abrirEspacoDeAutorizacoes } from './abrirEspacoDeAutorizacoes.js';
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';
import { PoliticaEscrita, escritaSchema } from '../tipos/autorizacoes.js';

export function criarPoliticaEscrita(espacoId: string, d: { operacao: PoliticaEscrita['operacao']; runs: number[]; dias: number; maxUsos: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaEscrita {
  const p = escritaSchema.parse({ id: randomUUID(), espacoId, operacao: d.operacao, runs: [...new Set(d.runs)], criadaEm: agora.toISOString(), validaAte: validadeDaAutorizacao(d.dias, agora), maxUsos: d.maxUsos, usos: 0, aprovadoPor, revogadaEm: null });
  const r = lerAutorizacoes(base); r.escritas = abrirEspacoDeAutorizacoes(r.escritas, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.escritas.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.escritas) if (x.espacoId === espacoId && x.operacao === p.operacao && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.escritas.push(p); gravarAutorizacoes(r, base); return p;
}
