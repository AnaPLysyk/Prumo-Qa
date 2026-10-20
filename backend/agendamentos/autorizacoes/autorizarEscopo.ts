/** Pede a autenticação humana do Windows e grava a autorização para um escopo exato (projeto, comando por hash, ambiente). */
import { randomUUID } from 'node:crypto';
import { validadeDaAutorizacao } from './politicasDaAutorizacao.js';
import { abrirEspacoDeAutorizacoes } from './estadoERevogacao.js';
import { estadoDaAutorizacao } from './estadoERevogacao.js';
import { gravarAutorizacoes } from '../repositorioAutorizacoes.js';
import { lerAutorizacoes } from '../repositorioAutorizacoes.js';
import { AutorizacaoExecucao, EscopoAutorizado, MAX_USOS, Solicitador, execSchema } from '../tipos/autorizacoes.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { solicitarAprovacao } from '../../testes/servicoAprovacao.js';

/** Pede o consentimento humano nativo para este escopo exato e só então grava a autorização. */
export async function autorizarEscopo(p: Projeto, espacoId: string, capability: string, ambiente: string, escopo: EscopoAutorizado, opcoes: { dias: number; maxUsos: number }, base?: string, solicitar: Solicitador = solicitarAprovacao, agora = new Date()): Promise<AutorizacaoExecucao> {
  if (!Number.isInteger(opcoes.maxUsos) || opcoes.maxUsos < 1 || opcoes.maxUsos > MAX_USOS) throw new Error('AUTH_USES_INVALID');
  const validaAte = validadeDaAutorizacao(opcoes.dias, agora);
  const aprovado = await solicitar({ projectId: p.manifesto.id, root: p.raiz, capability, scopeHash: escopo.scopeHash, command: escopo.command, expiresAt: new Date(agora.getTime() + 120000).toISOString() });
  if (!aprovado || aprovado.scopeHash !== escopo.scopeHash) throw new Error('HUMAN_APPROVAL_REQUIRED');
  const a: AutorizacaoExecucao = { id: randomUUID(), espacoId, projectId: p.manifesto.id, capability, ambiente, scopeHash: escopo.scopeHash, criadaEm: agora.toISOString(), validaAte, maxUsos: opcoes.maxUsos, usos: 0, aprovadoPor: aprovado.subject, metodo: aprovado.method, revogadaEm: null };
  const r = lerAutorizacoes(base); r.execucoes = abrirEspacoDeAutorizacoes(r.execucoes, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.execucoes.length >= 300) throw new Error('AUTH_LIMIT');
  // Uma autorização vigente por (espaço, capability, ambiente): a nova substitui (revoga) a anterior, sem acumular poderes.
  for (const x of r.execucoes) if (x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.execucoes.push(execSchema.parse(a)); gravarAutorizacoes(r, base); return a;
}
