/** Cria a política que permite a rotina publicar comentário em tickets escolhidos, com validade e limite. */
import { randomUUID } from 'node:crypto';
import { validadeDaAutorizacao } from './validadeDaAutorizacao.js';
import { abrirEspacoDeAutorizacoes } from './abrirEspacoDeAutorizacoes.js';
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';
import { PoliticaPublicacao, pubSchema } from '../tipos/autorizacoes.js';

export function criarPoliticaPublicacao(espacoId: string, d: { tickets: string[]; tipos: PoliticaPublicacao['tipos']; dias: number; maxPublicacoes: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaPublicacao {
  const p = pubSchema.parse({ id: randomUUID(), espacoId, tickets: [...new Set(d.tickets.map(t => t.toUpperCase()))], tipos: d.tipos, criadaEm: agora.toISOString(), validaAte: validadeDaAutorizacao(d.dias, agora), maxPublicacoes: d.maxPublicacoes, usadas: 0, aprovadoPor, revogadaEm: null });
  const r = lerAutorizacoes(base); r.publicacoes = abrirEspacoDeAutorizacoes(r.publicacoes, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.publicacoes.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.publicacoes) if (x.espacoId === espacoId && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.publicacoes.push(p); gravarAutorizacoes(r, base); return p;
}
