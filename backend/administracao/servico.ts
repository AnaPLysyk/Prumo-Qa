/** servico: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { lerLocal, gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { AgentesDaPlataforma, agentesDaPlataformaPadrao, agentesDaPlataformaSchema, perfilOficialSchema, CodigoDoArquivo, LIMITE_CODIGO_ARQUIVO, LIMITE_CODIGO_TOTAL, LIMITE_MAPA, MapaDoAplicativo, mapaDoAplicativoSchema } from "./contratos.js";
import fs from "node:fs";
import path from "node:path";
import { falharCom } from "../compartilhado/erros.js";
import { raizDoAplicativo } from "../compartilhado/raizDoAplicativo.js";
import { contaDaSessao, contaParaJanela, ehAdmin, situacaoDaSessao } from "../login/regras/sessao.js";
import { agentesChat } from "../agentes/tipos/persona.js";
import { especializacoes } from "../agentes/tipos/persona.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { randomUUID } from "node:crypto";
import { gerarSenhaTemporaria, resumirSegredo } from "../login/regras/contas.js";
import { gravarContas, lerContas } from "../login/banco/contas.js";
import { ContaVisivel, RegistroDeContas, Usuario, estadosDaConta, loginSchema, nomeDaPessoaSchema, ConfiguracaoDeAcesso, IdModulo, NivelDeAcesso, Papel, configuracaoDeAcessoSchema, modulosDoMenu, niveisDeAcesso } from "../login/tipos/contas.js";
import { semAcentos } from "../compartilhado/texto.js";

// --- administracao ---
export const lerAgentesDaPlataforma = (base?: string): AgentesDaPlataforma =>
  lerLocal<AgentesDaPlataforma>(
    'agentes-plataforma.json',
    agentesDaPlataformaSchema,
    structuredClone(agentesDaPlataformaPadrao),
    base
  );

export function gravarAgentesDaPlataforma(
  configuracao: AgentesDaPlataforma,
  base?: string
): AgentesDaPlataforma {
  const validada = agentesDaPlataformaSchema.parse(configuracao);
  gravarLocal('agentes-plataforma.json', validada, base);
  return validada;
}

let cache: { chave: string; codigo: Map<string, string> } | null = null;

/** O arquivo é do próprio aplicativo: sem atalho, com limite; o caminho pedido só serve de chave (nada é lido do disco por ele). */
export function lerCodigoDoAplicativo(caminho: string, raiz: string = raizDoAplicativo): CodigoDoArquivo {
  const alvo = path.join(raiz, 'dist', 'documentacao', 'codigo.json');
  let st: fs.Stats;
  try { st = fs.lstatSync(alvo); } catch { falharCom('ARCHITECTURE_CODE_MISSING: o código é gerado no build (npm run build).'); }
  if (st.isSymbolicLink() || !st.isFile() || st.size > LIMITE_CODIGO_TOTAL) falharCom('ARCHITECTURE_CODE_INVALID');
  const chave = alvo + ':' + st.size + ':' + st.mtimeMs;
  if (cache?.chave !== chave) {
    let bruto: unknown;
    try { bruto = JSON.parse(fs.readFileSync(alvo, 'utf8')); } catch { falharCom('ARCHITECTURE_CODE_INVALID'); }
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) falharCom('ARCHITECTURE_CODE_INVALID');
    cache = { chave, codigo: new Map(Object.entries(bruto as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string')) };
  }
  const texto = cache.codigo.get(caminho);
  if (texto === undefined) falharCom('ARCHITECTURE_CODE_NOT_FOUND: o arquivo não faz parte do mapa desta versão.');
  const bytes = Buffer.byteLength(texto, 'utf8'); const truncado = bytes > LIMITE_CODIGO_ARQUIVO;
  const final = truncado ? Buffer.from(texto, 'utf8').subarray(0, LIMITE_CODIGO_ARQUIVO).toString('utf8') : texto;
  return { caminho, texto: final, linhas: final.split('\n').length, bytes, truncado };
}

/** O arquivo é do próprio aplicativo (não do projeto da pessoa): sem atalho, com limite e esquema estrito. */
export function lerMapaDoAplicativo(raiz: string = raizDoAplicativo): MapaDoAplicativo {
  const alvo = path.join(raiz, 'dist', 'documentacao', 'mapa.json');
  let st: fs.Stats;
  try { st = fs.lstatSync(alvo); } catch { falharCom('ARCHITECTURE_MAP_MISSING: o mapa é gerado no build (npm run build).'); }
  if (st.isSymbolicLink() || !st.isFile() || st.size > LIMITE_MAPA) falharCom('ARCHITECTURE_MAP_INVALID');
  let bruto: unknown;
  try { bruto = JSON.parse(fs.readFileSync(alvo, 'utf8')); } catch { falharCom('ARCHITECTURE_MAP_INVALID'); }
  const r = mapaDoAplicativoSchema.safeParse(bruto);
  if (!r.success) falharCom('ARCHITECTURE_MAP_INVALID');
  return r.data;
}

// --- servico ---
/** Arquivo ilegível não derruba o chat nem o MCP: vale o padrão e a tela da Administração mostra o problema ao abrir. */
export function regrasDosAgentes(b?: string): AgentesDaPlataforma {
  try { return lerAgentesDaPlataforma(b); } catch { return structuredClone(agentesDaPlataformaPadrao); }
}

/** Especialização ligada na plataforma: agente desligado some do chat e das políticas do MCP em todos os projetos. */
export const especializacaoLigada = (id: string, b?: string) => !regrasDosAgentes(b).desligados.includes(id);

export function agentesDaPlataformaParaJanela(b?: string) {
  const c = lerAgentesDaPlataforma(b);
  return { ...c, agentes: agentesChat.map((a) => ({ id: a.id, nome: c.perfis[a.id]?.nome ?? a.nome, dominio: a.dominio, profissao: c.perfis[a.id]?.profissao ?? a.profissao, especialidade: c.perfis[a.id]?.especialidade ?? a.especialidade, fixo: a.id === 'orquestrador', ligado: a.id === 'orquestrador' || !c.desligados.includes(a.id),
    capacidades: a.especializacao ? [...(especializacoes.find((e) => e.id === a.especializacao)?.capacidades ?? [])] : [] })) };
}

export function salvarAgentesDaPlataforma(d: { desligados: string[]; iaExterna: boolean; orquestracao: boolean; perfis?: Record<string, {nome:string; profissao:string; especialidade:string; tom:string; robo?:number}> }, b?: string, agora = new Date()) {
  const validos = new Set(agentesChat.filter((a) => a.id !== 'orquestrador').map((a) => a.id));
  const desconhecido = d.desligados.find((id) => !validos.has(id)); if (desconhecido) throw new Error('AGENT_UNKNOWN: agente desconhecido ou que não pode ser desligado: ' + desconhecido + '.');
  const perfis = d.perfis ?? regrasDosAgentes(b).perfis;
  if (Object.keys(perfis).some(id => !validos.has(id))) throw new Error('AGENT_PROFILE_UNKNOWN');
  for (const p of Object.values(perfis)) perfilOficialSchema.parse(p);
  const conta = contaDaSessao(b);
  gravarAgentesDaPlataforma({ version: 1, perfis, desligados: [...new Set(d.desligados)], iaExterna: d.iaExterna, orquestracao: d.orquestracao, alteradoEm: agora.toISOString(), por: conta ? conta.nome + ' (' + conta.login + ')' : usuarioDoWindows() }, b);
  return agentesDaPlataformaParaJanela(b);
}

function quemAdministra(b?: string): Usuario {
  const s = situacaoDaSessao(b);
  if (s.tipo === 'SEM_LOGIN') throw new Error('LOGIN_NOT_ACTIVE: ative o login antes de gerenciar usuários.');
  if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return s.usuario;
}

function contaPeloId(r: RegistroDeContas, id: string): Usuario {
  const u = r.usuarios.find((x) => x.id === id); if (!u) throw new Error('ACCOUNT_NOT_FOUND: conta não encontrada; atualize a lista.'); return u;
}

/** Sempre sobra ao menos uma conta admin ativa: sem ela ninguém mais entra na Administração. */
function garantirAdministrador(r: RegistroDeContas): void {
  if (!r.usuarios.some((u) => ehAdmin(u) && u.estado === 'ATIVO')) throw new Error('LAST_ADMIN: precisa existir ao menos uma conta admin ativa.');
}

export function listarContasDeAcesso(b?: string): { contas: ContaVisivel[]; voce: string | null } {
  const r = lerContas(b); const agora = Date.now(); const s = situacaoDaSessao(b, agora, false);
  const ordem = { PENDENTE: 0, ATIVO: 1, DESATIVADO: 2 } as const;
  return { contas: r.usuarios.map((u) => contaParaJanela(r, u, agora)).sort((a, z) => ordem[a.estado] - ordem[z.estado] || a.nome.localeCompare(z.nome, 'pt-BR')), voce: s.tipo === 'ATIVA' ? s.usuario.id : null };
}

/** Conta criada pela Administração: senha temporária mostrada uma vez e troca obrigatória no primeiro acesso. */
export async function criarContaPelaAdministracao(d: { login: string; nome: string; papel: string; admin?: boolean }, b?: string, agora = new Date()) {
  quemAdministra(b);
  const login = loginSchema.safeParse(d.login); if (!login.success) throw new Error('LOGIN_INVALID_FORMAT: ' + login.error.issues[0]!.message);
  const nome = nomeDaPessoaSchema.safeParse(d.nome); if (!nome.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  const temporaria = gerarSenhaTemporaria(); const senha = await resumirSegredo(temporaria);
  const r = lerContas(b);
  if (!r.papeis.some((p) => p.id === d.papel)) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (r.usuarios.some((u) => u.login === login.data)) throw new Error('LOGIN_TAKEN: esse login já está em uso; escolha outro.');
  const quando = agora.toISOString();
  const u: Usuario = { id: randomUUID(), login: login.data, nome: nome.data, papel: d.papel, estado: 'ATIVO', senha, recuperacao: null, identidades: [], trocarSenha: true, falhas: 0, bloqueadoAte: null, criadoEm: quando, atualizadoEm: quando, ultimoAcesso: null, origem: 'ADMINISTRACAO', admin: d.admin === true };
  r.usuarios.push(u); gravarContas(r, b);
  return { conta: contaParaJanela(r, u, agora.getTime()), senhaTemporaria: temporaria };
}

/** Aprovar (PENDENTE → ATIVO), desativar, reativar, trocar papel, nome ou a marca admin. Ninguém desativa a si mesmo, tira a própria marca ou o último admin. */
export function alterarContaPelaAdministracao(d: { id: string; nome?: string; papel?: string; estado?: string; admin?: boolean }, b?: string, agora = new Date()) {
  const eu = quemAdministra(b); const r = lerContas(b); const u = contaPeloId(r, d.id); const eraAdmin = ehAdmin(u);
  if (d.papel !== undefined) { if (!r.papeis.some((p) => p.id === d.papel)) throw new Error('ROLE_NOT_FOUND: papel inexistente.'); u.papel = d.papel; }
  if (d.nome !== undefined) { const n = nomeDaPessoaSchema.safeParse(d.nome); if (!n.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.'); u.nome = n.data; }
  if (d.estado !== undefined) {
    if (!estadosDaConta.includes(d.estado as never) || d.estado === 'PENDENTE') throw new Error('ACCOUNT_STATE_INVALID: use ATIVO ou DESATIVADO.');
    if (u.id === eu.id && d.estado !== 'ATIVO') throw new Error('SELF_DISABLE: você não pode desativar a própria conta.');
    u.estado = d.estado as Usuario['estado'];
  }
  if (d.admin !== undefined) { if (u.id === eu.id && !d.admin) throw new Error('SELF_DEMOTE: você não pode tirar a própria marca de admin; peça a outra conta admin.'); }
  // A marca é gravada sempre que a conta muda: conta antiga deixa de depender do papel (trocar papel não muda quem é admin).
  u.admin = d.admin ?? eraAdmin;
  garantirAdministrador(r); u.atualizadoEm = agora.toISOString(); gravarContas(r, b);
  return contaParaJanela(r, u, agora.getTime());
}

/** Redefinir senha de outra pessoa: gera senha temporária, exige troca no próximo acesso e desbloqueia a conta. */
export async function redefinirSenhaPelaAdministracao(id: string, b?: string, agora = new Date()) {
  const eu = quemAdministra(b); if (eu.id === id) throw new Error('USE_MY_ACCOUNT: para a sua própria senha use Minha conta › Trocar senha.');
  const temporaria = gerarSenhaTemporaria(); const senha = await resumirSegredo(temporaria);
  const r = lerContas(b); const u = contaPeloId(r, id);
  Object.assign(u, { senha, trocarSenha: true, falhas: 0, bloqueadoAte: null, atualizadoEm: agora.toISOString() }); gravarContas(r, b);
  return { conta: contaParaJanela(r, u, agora.getTime()), senhaTemporaria: temporaria };
}

export function desbloquearConta(id: string, b?: string, agora = new Date()) {
  quemAdministra(b); const r = lerContas(b); const u = contaPeloId(r, id);
  u.falhas = 0; u.bloqueadoAte = null; u.atualizadoEm = agora.toISOString(); gravarContas(r, b); return contaParaJanela(r, u, agora.getTime());
}

/** Excluir só conta pendente ou desativada (desative antes); a própria conta nunca. */
export function excluirConta(id: string, b?: string) {
  const eu = quemAdministra(b); if (eu.id === id) throw new Error('SELF_DELETE: você não pode excluir a própria conta.');
  const r = lerContas(b); const u = contaPeloId(r, id);
  if (u.estado === 'ATIVO') throw new Error('ACCOUNT_ACTIVE: desative a conta antes de excluir.');
  r.usuarios = r.usuarios.filter((x) => x.id !== id); garantirAdministrador(r); gravarContas(r, b); return { excluida: id };
}

export function listarPapeis(b?: string) {
  const r = lerContas(b);
  return { papeis: r.papeis.map((p) => ({ ...p, contas: r.usuarios.filter((u) => u.papel === p.id).length })), modulos: modulosDoMenu, niveis: niveisDeAcesso, papelDoCadastro: r.acesso.papelDoCadastro };
}

/** Cria ou altera um papel. O administrador é fixo; tela não informada fica sem acesso (NENHUM). */
export function salvarPapel(d: { id?: string; nome: string; descricao?: string; telas: Record<string, string> }, b?: string) {
  const r = lerContas(b);
  const telas = Object.fromEntries(modulosDoMenu.map((m) => [m.id, niveisDeAcesso.includes(d.telas[m.id] as NivelDeAcesso) ? d.telas[m.id] : 'NENHUM'])) as Record<IdModulo, NivelDeAcesso>;
  const nome = d.nome.trim(); if (nome.length < 2 || nome.length > 40) throw new Error('ROLE_NAME_INVALID: o nome do papel precisa ter de 2 a 40 caracteres.');
  if (r.papeis.some((p) => p.id !== d.id && p.nome.toLowerCase() === nome.toLowerCase())) throw new Error('ROLE_NAME_TAKEN: já existe um papel com esse nome.');
  if (d.id) {
    const p = r.papeis.find((x) => x.id === d.id); if (!p) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
    if (p.fixo) throw new Error('ROLE_FIXED: o papel Administrador é fixo e sempre tem acesso a tudo.');
    Object.assign(p, { nome, descricao: (d.descricao ?? p.descricao).trim().slice(0, 200), telas });
  } else {
    const base = semAcentos(nome).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'papel';
    let id = base; for (let i = 2; r.papeis.some((p) => p.id === id); i++) id = base + '-' + i;
    if (id.length < 2) id = 'papel-' + id;
    r.papeis.push({ id, nome, descricao: (d.descricao ?? '').trim().slice(0, 200), fixo: false, telas } satisfies Papel);
  }
  gravarContas(r, b); return listarPapeis(b);
}

/** Excluir só papel que ninguém usa e que não é o papel dado a novos cadastros. */
export function excluirPapel(id: string, b?: string) {
  const r = lerContas(b); const p = r.papeis.find((x) => x.id === id); if (!p) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (p.fixo) throw new Error('ROLE_FIXED: o papel Administrador é fixo.');
  const usam = r.usuarios.filter((u) => u.papel === id).length; if (usam) throw new Error('ROLE_IN_USE: ' + usam + ' conta(s) usam este papel; troque o papel delas antes.');
  if (r.acesso.papelDoCadastro === id) throw new Error('ROLE_IN_USE: este é o papel dado a novos cadastros; escolha outro em Configurações gerais antes.');
  r.papeis = r.papeis.filter((x) => x.id !== id); gravarContas(r, b); return listarPapeis(b);
}

export const configuracaoDeAcesso = (b?: string): ConfiguracaoDeAcesso => lerContas(b).acesso;

/** Novos cadastros nunca entram como administrador: esse papel só a Administração dá. */
export function salvarConfiguracaoDeAcesso(d: Omit<ConfiguracaoDeAcesso, 'githubClientId' | 'googleClientId'>, b?: string): ConfiguracaoDeAcesso {
  // Os Client IDs do GitHub e do Google têm canal próprio (junto com o segredo): salvar as regras gerais nunca o apaga.
  const r = lerContas(b); const acesso = configuracaoDeAcessoSchema.parse({ ...d, githubClientId: r.acesso.githubClientId, googleClientId: r.acesso.googleClientId });
  if (!r.papeis.some((p) => p.id === acesso.papelDoCadastro)) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (acesso.papelDoCadastro === 'administrador') throw new Error('SIGNUP_ROLE_FORBIDDEN: novos cadastros não podem entrar como administrador.');
  r.acesso = acesso; gravarContas(r, b); return acesso;
}
