/** servicoContas: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { AdaptadorServico } from "./integracoes/AdaptadorServico.js";
import { Conta, ContextoDosServicos, CredencialOAuth, conexaoEntrada, contaSchema, credencialOAuthSchema } from "./tipos/contaDeServico.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { lerContasDeServico, gravarContasDeServico } from "./banco/contasDeServico.js";
import { enderecoDoSiteJira, instanciaServico } from "./integracoes/configuracaoDosServicos.js";
import { ErroServico } from "./integracoes/configuracaoDosServicos.js";
import { atualizarEstadoDoVinculo } from "../projetos/servicoProjetos.js";
import { Servico } from "../projetos/contratos.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { Protetor } from "./tipos/adaptador.js";

// --- servicoContas ---
/** Conexão OAuth guarda no cofre um JSON (acesso, renovação, vencimento); as demais, o token puro. */
export function credencialOAuthDaConta(c: ContextoDosServicos, conta: Conta): CredencialOAuth {
  try { return credencialOAuthSchema.parse(JSON.parse(c.cofre.ler(conta.id))); } catch { throw new ErroServico('CREDENTIAL_UNAVAILABLE'); }
}

export function adaptadorDaConta(c: ContextoDosServicos, conta: Conta) {
  const oauth = conta.autenticacao === 'oauth';
  const token = oauth ? credencialOAuthDaConta(c, conta).acesso : c.cofre.ler(conta.id);
  return new AdaptadorServico({ ...conta, token, oauth, nuvem: conta.nuvem }, c.transporte, c.escrita);
}

/** Um acesso OAuth vence em minutos e o refresh token do provedor gira a cada uso: duas renovações ao mesmo tempo perderiam a conta. */
const renovacoesEmAndamento = new Map<string, Promise<void>>();

async function renovarAcesso(c: ContextoDosServicos, conta: Conta) {
  const atual = credencialOAuthDaConta(c, conta);
  if (!atual.expiraEm || atual.expiraEm - Date.now() > 120_000) return;
  if (!atual.renovacao || !c.renovar) throw new ErroServico('CREDENTIAL_INVALID_OR_EXPIRED');
  let nova: CredencialOAuth;
  try { nova = credencialOAuthSchema.parse(await c.renovar(conta.servico, atual.renovacao)); } catch { throw new ErroServico('CREDENTIAL_INVALID_OR_EXPIRED'); }
  c.cofre.salvar(conta.id, JSON.stringify({ renovacao: atual.renovacao, ...nova }));
}

/** A conta ativa com o acesso OAuth ainda válido: renova pelo serviço do Prumo quando falta menos de dois minutos. */
export async function contaAtivaRenovada(c: ContextoDosServicos, id: string) {
  const conta = contaAtiva(c, id);
  if (conta.autenticacao !== 'oauth') return conta;
  const emAndamento = renovacoesEmAndamento.get(id) ?? renovarAcesso(c, conta).finally(() => renovacoesEmAndamento.delete(id));
  renovacoesEmAndamento.set(id, emAndamento);
  await emAndamento;
  return contaAtiva(c, id);
}

/** Conta criada pela autorização no navegador (GitHub App ou Jira OAuth): o acesso nasce validado e a renovação fica só no cofre. */
export async function adicionarContaOAuth(c: ContextoDosServicos, e: { servico: 'github' | 'jira'; nome?: string; instancia?: string; nuvem?: string; credencial: CredencialOAuth }) {
  if (!c.protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
  const credencial = credencialOAuthSchema.parse(e.credencial); const informado = z.string().trim().min(1).max(100).optional().parse(e.nome);
  const nuvem = e.servico === 'jira' ? z.string().uuid().parse(e.nuvem) : undefined;
  if (e.servico === 'jira' && !e.instancia) throw new Error('JIRA_SITE_REQUIRED');
  const id = randomUUID(); const instancia = instanciaServico(e.servico, e.instancia);
  const identidade = await new AdaptadorServico({ id, servico: e.servico, instancia, contaId: 'pendente', token: credencial.acesso, oauth: true, nuvem }, c.transporte, c.escrita).autenticar();
  const r = lerContasDeServico(c.base); if (r.contas.length >= 100) throw new Error('CONNECTION_LIMIT');
  if (r.contas.some(x => x.ativa && x.servico === e.servico && x.instancia === instancia && x.contaId === identidade.contaId)) throw new Error('CONNECTION_DUPLICATE');
  const quando = new Date().toISOString();
  const conta = contaSchema.parse({ id, servico: e.servico, nome: mascarar(informado ?? `${e.servico === 'github' ? 'GitHub' : 'Jira'} · ${identidade.nome}`.slice(0, 100), [credencial.acesso, credencial.renovacao ?? '']), instancia, contaId: identidade.contaId, identidade: identidade.nome, criadaEm: quando, validadaEm: quando, ativa: true, autenticacao: 'oauth', ...(nuvem ? { nuvem } : {}) });
  c.cofre.salvar(id, JSON.stringify(credencial));
  try { r.contas.push(conta); gravarContasDeServico(r, c.base); } catch (erro) { c.cofre.remover(id); throw erro; }
  return conta;
}

export async function adicionarConta(c: ContextoDosServicos, entrada: z.input<typeof conexaoEntrada>) {
  const d = conexaoEntrada.parse(entrada); if (!c.protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE'); if (d.servico === 'jira' && !d.usuario) throw new Error('JIRA_EMAIL_REQUIRED');
  const id = randomUUID(); const instancia = instanciaServico(d.servico, d.servico === 'jira' ? enderecoDoSiteJira(d.instancia) : d.instancia);
  const a = new AdaptadorServico({ id, servico: d.servico, instancia, usuario: d.usuario, contaId: 'pendente', token: d.token }, c.transporte); const identidade = await a.autenticar();
  const r = lerContasDeServico(c.base); if (r.contas.length >= 100) throw new Error('CONNECTION_LIMIT');
  if (d.servico !== 'qase' && r.contas.some(x => x.ativa && x.servico === d.servico && x.instancia === instancia && x.contaId === identidade.contaId)) throw new Error('CONNECTION_DUPLICATE');
  if (d.servico === 'qase' && r.contas.some(x => { if (!x.ativa || x.servico !== 'qase') return false; try { return c.cofre.ler(x.id) === d.token; } catch { return false; } })) throw new Error('CONNECTION_DUPLICATE');
  const conta = contaSchema.parse({ id, servico: d.servico, nome: mascarar(d.nome, [d.token]), instancia, usuario: d.usuario, contaId: identidade.contaId, identidade: identidade.nome, criadaEm: new Date().toISOString(), validadaEm: new Date().toISOString(), ativa: true });
  c.cofre.salvar(id, d.token);
  try { r.contas.push(conta); gravarContasDeServico(r, c.base); } catch (e) { c.cofre.remover(id); throw e; }
  return conta;
}

/** Troca o token de uma conta existente: valida com o novo token, exige a mesma identidade (Qase não tem identidade estável) e só então substitui no cofre; o token antigo nunca é exibido. */
export async function trocarToken(c: ContextoDosServicos, id: string, token: string) {
  if (!c.protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
  const conta = contaAtiva(c, id);
  if (conta.autenticacao === 'oauth') throw new Error('OAUTH_RECONNECT_REQUIRED: esta conexão foi feita pelo navegador; conecte de novo em vez de colar um token.');
  const identidade = await new AdaptadorServico({ ...conta, token }, c.transporte, c.escrita).autenticar();
  if (conta.servico !== 'qase' && identidade.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const antigo = c.cofre.ler(id);
  c.cofre.salvar(id, token);
  try { const r = lerContasDeServico(c.base); r.contas.find(x => x.id === id)!.validadaEm = new Date().toISOString(); gravarContasDeServico(r, c.base); }
  catch (e) { c.cofre.salvar(id, antigo); throw e; }
  return contaAtiva(c, id);
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
  if(v.desligado)throw new Error('SERVICE_DISABLED: ative o vínculo em Projetos antes de consultar ou enviar dados.');
  try {
    const conta = await contaAtivaRenovada(c, v.conexaoId); const a = adaptadorDaConta(c, conta);
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

// --- protetorDoSistema ---
type CofreDoSistema = { isEncryptionAvailable: () => boolean; encryptString: (s: string) => Buffer; decryptString: (b: Buffer) => string; getSelectedStorageBackend?: () => string };

/**
 * No Linux, sem Secret Service ou KWallet o Electron cai em "basic_text" (chave fixa, equivale a texto aberto). Isso é
 * recusado: sem cofre real o Prumo não guarda token, e a pessoa é orientada a instalar o gnome-keyring ou o KWallet.
 */
export function protetorDoSistema(cofre: CofreDoSistema, sistema: string = process.platform): Protetor {
  const cofreReal = () => sistema !== 'linux' || !['basic_text', 'unknown'].includes(cofre.getSelectedStorageBackend?.() ?? 'unknown');
  return { disponivel: () => cofre.isEncryptionAvailable() && cofreReal(), proteger: s => cofre.encryptString(s), abrir: b => cofre.decryptString(b) };
}
