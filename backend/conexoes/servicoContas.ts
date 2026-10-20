/** Adiciona, valida e seleciona contas vinculadas a serviços externos. */
import { AdaptadorServico } from "./integracoes/AdaptadorServico.js";
import { Conta, ContextoDosServicos, conexaoEntrada, contaSchema } from "./tipos/contaDeServico.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { lerContasDeServico } from "./banco/contasDeServico.js";
import { instanciaServico } from "./integracoes/configuracaoDosServicos.js";
import { ErroServico } from "./integracoes/ErroServico.js";
import { atualizarEstadoDoVinculo } from "../projetos/servicoProjetos.js";
import { Servico } from "../projetos/contratos.js";
import { obterEspaco } from "../projetos/banco/projetos.js";

export function adaptadorDaConta(c: ContextoDosServicos, conta: Conta) {
  return new AdaptadorServico({ ...conta, token: c.cofre.ler(conta.id) }, c.transporte, c.escrita);
}

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

export function codigoDoErroDeServico(e: unknown) {
  return e instanceof ErroServico ? e.codigo : 'CREDENTIAL_UNAVAILABLE';
}

export function contaAtiva(c: ContextoDosServicos, id: string) {
  const conta = lerContasDeServico(c.base).contas.find(x => x.id === id && x.ativa);
  if (!conta) throw new ErroServico('CREDENTIAL_UNAVAILABLE');
  return conta;
}

function estadoDoVinculoPeloErro(e: unknown) {
  if (!(e instanceof ErroServico)) return 'INDISPONIVEL' as const;
  if (e.codigo === 'SERVICE_PERMISSION') return 'SEM_PERMISSAO' as const;
  if (e.codigo === 'CREDENTIAL_INVALID_OR_EXPIRED' || e.codigo === 'CREDENTIAL_UNAVAILABLE') return 'SEM_CREDENCIAL' as const;
  if (e.codigo === 'SERVICE_NOT_FOUND' || e.codigo === 'SERVICE_SCOPE_CHANGED') return 'DESATUALIZADO' as const;
  return 'INDISPONIVEL' as const;
}

export async function verificarVinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico, aceitarAlteracao = false) {
  const v = vinculoDoServico(c, espacoId, servico);
  try {
    const conta = contaAtiva(c, v.conexaoId); const a = adaptadorDaConta(c, conta);
    const principal = await a.autenticar(); if (principal.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    const atual = await a.obterRecurso(v.recurso.id);
    if (atual.id !== v.recurso.id || atual.contaId !== v.recurso.contaId || (!aceitarAlteracao && atual.chave !== v.recurso.chave)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    atualizarEstadoDoVinculo(espacoId, servico, 'VALIDO', undefined, atual, c.base);
    return { adaptador: a, recurso: atual, campoAceite: v.campoAceite };
  } catch (e) { atualizarEstadoDoVinculo(espacoId, servico, estadoDoVinculoPeloErro(e), codigoDoErroDeServico(e), undefined, c.base); throw e; }
}

export function vinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico) {
  const v = obterEspaco(espacoId, c.base).vinculos.find(x => x.servico === servico);
  if (!v) throw new Error('WORKSPACE_LINK_NOT_FOUND');
  return v;
}
