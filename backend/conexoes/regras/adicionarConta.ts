/** Adiciona uma conta de Jira, Qase ou GitHub: autentica no serviço, recusa duplicada e guarda a credencial protegida pelo Windows. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { lerContasDeServico } from '../banco/contasDeServico.js';
import { AdaptadorServico } from '../integracoes/AdaptadorServico.js';
import { instanciaServico } from '../integracoes/instanciaServico.js';
import { ContextoDosServicos, conexaoEntrada, contaSchema } from '../tipos/contaDeServico.js';

export async function adicionarConta(c: ContextoDosServicos, entrada: z.input<typeof conexaoEntrada>) {
  const d = conexaoEntrada.parse(entrada); if (!c.protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE'); if (d.servico === 'jira' && !d.usuario) throw new Error('JIRA_EMAIL_REQUIRED');
  const id = randomUUID(); const instancia = instanciaServico(d.servico, d.instancia);
  const a = new AdaptadorServico({ id, servico: d.servico, instancia, usuario: d.usuario, contaId: 'pendente', token: d.token }, c.transporte); const identidade = await a.autenticar();
  const r = lerContasDeServico(c.base); if (r.contas.length >= 100) throw new Error('CONNECTION_LIMIT');
  if (d.servico !== 'qase' && r.contas.some(x => x.ativa && x.servico === d.servico && x.instancia === instancia && x.contaId === identidade.contaId)) throw new Error('CONNECTION_DUPLICATE');
  if (d.servico === 'qase' && r.contas.some(x => { if (!x.ativa || x.servico !== 'qase') return false; try { return c.cofre.ler(x.id) === d.token; } catch { return false; } })) throw new Error('CONNECTION_DUPLICATE');
  const conta = contaSchema.parse({ id, servico: d.servico, nome: mascarar(d.nome, [d.token]), instancia, usuario: d.usuario, contaId: identidade.contaId, identidade: identidade.nome, criadaEm: new Date().toISOString(), validadaEm: new Date().toISOString(), ativa: true });
  c.cofre.salvar(id, d.token);
  try { r.contas.push(conta); gravarLocal('contas.json', r, c.base); } catch (e) { c.cofre.remover(id); throw e; }
  return conta;
}
