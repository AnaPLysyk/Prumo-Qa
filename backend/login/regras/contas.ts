/** O que a própria pessoa faz com a conta: criar a primeira conta, entrar, sair, se cadastrar por e-mail, definir senha nova pelo e-mail, trocar a senha e o nome. */
import { randomUUID } from 'node:crypto';
import { conferirCodigo, emailValido, emitirCodigo } from './codigosPorEmail.js';
import { enviarCodigoPorEmail } from '../integracoes/envioEmail.js';
import { conferirForcaDaSenha, conferirSegredo, resumirSegredo } from './senhas.js';
import { contaParaJanela, encerrarSessao, iniciarSessao, loginLigado, sessaoParaJanela, situacaoDaSessao } from './sessao.js';
import { gravarContas } from '../repositorioContas.js';
import { lerContas } from '../repositorioContas.js';
import { RegistroDeContas, Usuario, nomeDaPessoaSchema } from '../tipos/contas.js';

// Freio geral contra adivinhação: além do bloqueio por conta, no máximo 20 tentativas erradas por minuto no aplicativo inteiro.
const errosRecentes: number[] = [];

function frearTentativas(agora: number): void {
  while (errosRecentes.length && agora - errosRecentes[0]! > 60_000) errosRecentes.shift();
  if (errosRecentes.length >= 20) throw new Error('LOGIN_RATE_LIMIT: muitas tentativas erradas seguidas; espere um minuto.');
}

/** Login interno de quem se cadastra por e-mail: a parte antes do @, no formato de login, com número no fim se já existir. A pessoa entra com o e-mail. */
function loginDoEmail(r: RegistroDeContas, email: string): string {
  let base = email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 36);
  if (base.length < 3) base = (base ? base + '-' : '') + 'conta';
  let login = base; for (let i = 2; r.usuarios.some((u) => u.login === login); i++) login = base + '-' + i;
  return login;
}

/** Confere nome, e-mail e senha antes de gastar o código: um campo errado não obriga a pedir outro código. */
function dadosDoCadastro(r: RegistroDeContas, d: { email: string; nome: string; senha: string }) {
  const email = emailValido(d.email);
  const nome = nomeDaPessoaSchema.safeParse(d.nome); if (!nome.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  if (r.usuarios.some((u) => u.email === email)) throw new Error('EMAIL_TAKEN: esse e-mail já tem conta neste computador; entre com ele ou use Esqueci a senha.');
  const login = loginDoEmail(r, email); conferirForcaDaSenha(d.senha, login);
  return { email, login, nome: nome.data };
}

export function contaNova(r: RegistroDeContas, d: { login: string; nome: string; email?: string }, extra: Pick<Usuario, 'papel' | 'estado' | 'senha' | 'recuperacao' | 'trocarSenha' | 'origem'> & { identidades?: Usuario['identidades']; admin?: boolean }, agora: Date): Usuario {
  if (r.usuarios.some((u) => u.login === d.login)) throw new Error('LOGIN_TAKEN: esse login já está em uso; escolha outro.');
  const quando = agora.toISOString();
  // Conta nova nasce sem a marca admin (cadastro e provedor); só a primeira conta e a Administração a dão.
  return { id: randomUUID(), login: d.login, nome: d.nome, ...(d.email ? { email: d.email } : {}), identidades: [], falhas: 0, bloqueadoAte: null, criadoEm: quando, atualizadoEm: quando, ultimoAcesso: null, admin: false, ...extra };
}

/** Registra uma tentativa errada: conta o erro e, ao chegar no limite, bloqueia a conta pelo tempo configurado. */
function registrarErro(id: string | null, agora: Date, b?: string): boolean {
  errosRecentes.push(agora.getTime()); if (!id) return false;
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === id); if (!u) return false;
  u.falhas += 1; let bloqueou = false;
  if (u.falhas >= r.acesso.tentativasAntesDoBloqueio) { u.falhas = 0; u.bloqueadoAte = new Date(agora.getTime() + r.acesso.minutosDeBloqueio * 60_000).toISOString(); bloqueou = true; }
  gravarContas(r, b); return bloqueou;
}

function conferirBloqueio(u: Usuario, agora: Date): void {
  if (u.bloqueadoAte && Date.parse(u.bloqueadoAte) > agora.getTime()) throw new Error('ACCOUNT_LOCKED: conta bloqueada por tentativas erradas até ' + new Date(u.bloqueadoAte).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '; espere ou peça o desbloqueio à Administração.');
}

/** Primeira conta, de administrador, com o e-mail confirmado pelo código; já entra com ela. Só funciona enquanto não existe nenhuma conta. */
export async function ativarLogin(d: { email: string; nome: string; senha: string; codigo: string }, b?: string, agora = new Date()) {
  const antes = lerContas(b); if (loginLigado(antes)) throw new Error('LOGIN_ALREADY_ACTIVE: o login já está ligado; use Usuários para criar outras contas.');
  const dados = dadosDoCadastro(antes, d); conferirCodigo('CADASTRO', dados.email, d.codigo, agora.getTime());
  const senha = await resumirSegredo(d.senha);
  const r = lerContas(b); if (loginLigado(r)) throw new Error('LOGIN_ALREADY_ACTIVE: o login já está ligado; use Usuários para criar outras contas.');
  const u = contaNova(r, dados, { papel: 'administrador', estado: 'ATIVO', senha, recuperacao: null, trocarSenha: false, origem: 'ATIVACAO', admin: true }, agora);
  u.ultimoAcesso = agora.toISOString(); r.usuarios.push(u); gravarContas(r, b); iniciarSessao(u.id, agora.getTime());
  return { conta: contaParaJanela(r, u, agora.getTime()) };
}

/** Entrada em duas etapas pendente: a senha já conferiu e falta o código do e-mail. Só na memória, por 10 minutos. */
const desafios = new Map<string, { usuarioId: string; email: string; expira: number }>();
const precisaDeDuasEtapas = (r: RegistroDeContas, u: Usuario) => !!u.email && (!!u.duasEtapas || r.acesso.exigirDuasEtapas);
const mascararEmail = (e: string) => { const [n, dominio] = e.split('@'); return n!.slice(0, 1) + '***@' + dominio; };

/**
 * Entrar com o e-mail ou o login: mensagem igual para conta inexistente e senha errada; bloqueio por conta depois de várias tentativas erradas.
 * Com a verificação em duas etapas, a senha certa não abre a sessão: um código vai ao e-mail da conta e a entrada termina em confirmarEntrada.
 */
export async function entrarNaConta(d: { login: string; senha: string; idioma?: 'pt-BR' | 'en' }, b?: string, agora = new Date(), enviar = enviarCodigoPorEmail) {
  frearTentativas(agora.getTime());
  const antes = lerContas(b); if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  const quem = String(d.login ?? '').trim().toLowerCase(); const u = antes.usuarios.find((x) => x.login === quem || (!!x.email && x.email === quem)) ?? null;
  if (u) conferirBloqueio(u, agora);
  if (!(await conferirSegredo(d.senha, u?.senha ?? null))) {
    if (registrarErro(u?.id ?? null, agora, b)) throw new Error('ACCOUNT_LOCKED: conta bloqueada por tentativas erradas; espere ou peça o desbloqueio à Administração.');
    throw new Error('LOGIN_INVALID: login ou senha incorretos.');
  }
  if (u!.estado === 'PENDENTE') throw new Error('ACCOUNT_PENDING: o cadastro aguarda aprovação da Administração.');
  if (u!.estado === 'DESATIVADO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  const r = lerContas(b); const atual = r.usuarios.find((x) => x.id === u!.id); if (!atual) throw new Error('LOGIN_INVALID: login ou senha incorretos.');
  if (precisaDeDuasEtapas(r, atual)) {
    for (const [id, x] of desafios) if (x.expira <= agora.getTime() || x.usuarioId === atual.id) desafios.delete(id);
    await emitirCodigo('ENTRADA', atual.email!, d.idioma ?? 'pt-BR', enviar, agora.getTime());
    const desafio = randomUUID(); desafios.set(desafio, { usuarioId: atual.id, email: atual.email!, expira: agora.getTime() + 10 * 60_000 });
    return { duasEtapas: true as const, desafio, email: mascararEmail(atual.email!) };
  }
  atual.falhas = 0; atual.bloqueadoAte = null; atual.ultimoAcesso = agora.toISOString(); gravarContas(r, b); iniciarSessao(atual.id, agora.getTime());
  return sessaoParaJanela(b, agora.getTime());
}

/** Segunda etapa: o código que chegou no e-mail abre a sessão. Código errado conta para o bloqueio da conta, como senha errada. */
export async function confirmarEntrada(d: { desafio: string; codigo: string }, b?: string, agora = new Date()) {
  frearTentativas(agora.getTime());
  const x = desafios.get(d.desafio);
  if (!x || x.expira <= agora.getTime()) { desafios.delete(d.desafio); throw new Error('CODE_EXPIRED: a entrada venceu; digite a senha de novo.'); }
  const antes = lerContas(b); const u = antes.usuarios.find((y) => y.id === x.usuarioId);
  if (!u) { desafios.delete(d.desafio); throw new Error('LOGIN_INVALID: login ou senha incorretos.'); }
  conferirBloqueio(u, agora);
  try { conferirCodigo('ENTRADA', x.email, d.codigo, agora.getTime()); }
  catch (e) {
    if (/^CODE_EXPIRED/.test((e as Error).message)) desafios.delete(d.desafio);
    if (registrarErro(u.id, agora, b)) { desafios.delete(d.desafio); throw new Error('ACCOUNT_LOCKED: conta bloqueada por tentativas erradas; espere ou peça o desbloqueio à Administração.'); }
    throw e;
  }
  desafios.delete(d.desafio);
  const r = lerContas(b); const atual = r.usuarios.find((y) => y.id === x.usuarioId);
  if (!atual || atual.estado !== 'ATIVO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  atual.falhas = 0; atual.bloqueadoAte = null; atual.ultimoAcesso = agora.toISOString(); gravarContas(r, b); iniciarSessao(atual.id, agora.getTime());
  return sessaoParaJanela(b, agora.getTime());
}

/** Manda outro código da entrada em andamento (respeita a espera de 60 segundos). */
export async function reenviarCodigoDeEntrada(d: { desafio: string; idioma?: 'pt-BR' | 'en' }, agora = new Date(), enviar = enviarCodigoPorEmail) {
  const x = desafios.get(d.desafio); if (!x || x.expira <= agora.getTime()) throw new Error('CODE_EXPIRED: a entrada venceu; digite a senha de novo.');
  await emitirCodigo('ENTRADA', x.email, d.idioma ?? 'pt-BR', enviar, agora.getTime());
  return { email: mascararEmail(x.email) };
}

/** Liga ou desliga a própria verificação em duas etapas. Pede a senha atual; ligar exige e-mail na conta. */
export async function alterarMinhasDuasEtapas(d: { ligar: boolean; senha: string }, b?: string, agora = new Date()) {
  const s = situacaoDaSessao(b, agora.getTime()); if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  if (!(await conferirSegredo(d.senha, s.usuario.senha))) { registrarErro(s.usuario.id, agora, b); throw new Error('PASSWORD_INVALID: a senha atual não confere.'); }
  if (d.ligar && !s.usuario.email) throw new Error('TWO_STEP_EMAIL_REQUIRED: a verificação em duas etapas precisa de um e-mail na conta.');
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === s.usuario.id)!;
  u.duasEtapas = d.ligar; u.atualizadoEm = agora.toISOString(); gravarContas(r, b);
  return sessaoParaJanela(b, agora.getTime());
}

export function sairDaConta(b?: string) { encerrarSessao(); return sessaoParaJanela(b); }

/** Cadastro por e-mail pela tela de entrada: só com o login ligado e o cadastro aberto; o código confirma o e-mail. Nasce PENDENTE quando a Administração aprova cadastros. */
export async function cadastrarConta(d: { email: string; nome: string; senha: string; codigo: string }, b?: string, agora = new Date()) {
  const antes = lerContas(b);
  if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  if (!antes.acesso.cadastroAberto) throw new Error('SIGNUP_CLOSED: o cadastro está fechado; peça uma conta à Administração.');
  const dados = dadosDoCadastro(antes, d); conferirCodigo('CADASTRO', dados.email, d.codigo, agora.getTime());
  const senha = await resumirSegredo(d.senha);
  const r = lerContas(b); const papel = r.papeis.some((p) => p.id === r.acesso.papelDoCadastro) ? r.acesso.papelDoCadastro : 'leitor';
  const u = contaNova(r, { ...dados, login: loginDoEmail(r, dados.email) }, { papel, estado: r.acesso.aprovarCadastros ? 'PENDENTE' : 'ATIVO', senha, recuperacao: null, trocarSenha: false, origem: 'CADASTRO' }, agora);
  r.usuarios.push(u); gravarContas(r, b);
  return { estado: u.estado };
}

/** Esqueci a senha: o código mandado ao e-mail da conta define a senha nova. Código errado conta para o bloqueio, como senha errada. */
export async function recuperarConta(d: { email: string; codigo: string; novaSenha: string }, b?: string, agora = new Date()) {
  frearTentativas(agora.getTime());
  const antes = lerContas(b); if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  const email = emailValido(d.email); const u = antes.usuarios.find((x) => x.email === email) ?? null;
  if (u) conferirBloqueio(u, agora);
  conferirForcaDaSenha(d.novaSenha, u?.login ?? email);
  try { conferirCodigo('SENHA', email, d.codigo, agora.getTime()); }
  catch (e) { registrarErro(u?.id ?? null, agora, b); throw e; }
  if (!u) throw new Error('CODE_INVALID: código incorreto; confira o e-mail e tente de novo.');
  if (u.estado === 'DESATIVADO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  const senha = await resumirSegredo(d.novaSenha);
  const r = lerContas(b); const atual = r.usuarios.find((x) => x.id === u.id); if (!atual) throw new Error('CODE_INVALID: código incorreto; confira o e-mail e tente de novo.');
  Object.assign(atual, { senha, recuperacao: null, trocarSenha: false, falhas: 0, bloqueadoAte: null, atualizadoEm: agora.toISOString() }); gravarContas(r, b);
  return { redefinida: true };
}

/** Troca da própria senha (também a temporária dada pela Administração). */
export async function trocarMinhaSenha(d: { atual: string; nova: string }, b?: string, agora = new Date()) {
  const s = situacaoDaSessao(b, agora.getTime()); if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  if (!(await conferirSegredo(d.atual, s.usuario.senha))) { registrarErro(s.usuario.id, agora, b); throw new Error('PASSWORD_INVALID: a senha atual não confere.'); }
  if (d.atual === d.nova) throw new Error('PASSWORD_WEAK: senha fraca: a nova senha precisa ser diferente da atual.');
  conferirForcaDaSenha(d.nova, s.usuario.login);
  const senha = await resumirSegredo(d.nova);
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === s.usuario.id)!;
  Object.assign(u, { senha, trocarSenha: false, falhas: 0, atualizadoEm: agora.toISOString() }); gravarContas(r, b);
  return { sessao: sessaoParaJanela(b, agora.getTime()) };
}

export function alterarMeuNome(nome: string, b?: string, agora = new Date()) {
  const s = situacaoDaSessao(b, agora.getTime()); if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  const n = nomeDaPessoaSchema.safeParse(nome); if (!n.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === s.usuario.id)!; u.nome = n.data; u.atualizadoEm = agora.toISOString(); gravarContas(r, b);
  return sessaoParaJanela(b, agora.getTime());
}
