/** O que a própria pessoa faz com a conta: ativar o login, entrar, sair, se cadastrar, recuperar o acesso, trocar a senha e o nome. */
import { randomUUID } from 'node:crypto';
import { conferirForcaDaSenha, conferirSegredo, gerarCodigoDeRecuperacao, normalizarCodigoDeRecuperacao, resumirSegredo } from './senhas.js';
import { contaParaJanela, encerrarSessao, iniciarSessao, loginLigado, sessaoParaJanela, situacaoDaSessao } from './sessao.js';
import { gravarContas } from '../banco/gravarContas.js';
import { lerContas } from '../banco/lerContas.js';
import { RegistroDeContas, Usuario, codigoDeRecuperacaoSchema, loginSchema, nomeDaPessoaSchema } from '../tipos/contas.js';

// Freio geral contra adivinhação: além do bloqueio por conta, no máximo 20 tentativas erradas por minuto no aplicativo inteiro.
const errosRecentes: number[] = [];

function frearTentativas(agora: number): void {
  while (errosRecentes.length && agora - errosRecentes[0]! > 60_000) errosRecentes.shift();
  if (errosRecentes.length >= 20) throw new Error('LOGIN_RATE_LIMIT: muitas tentativas erradas seguidas; espere um minuto.');
}

function dadosDaConta(d: { login: string; nome: string; senha: string }) {
  const login = loginSchema.safeParse(d.login); if (!login.success) throw new Error('LOGIN_INVALID_FORMAT: ' + login.error.issues[0]!.message);
  const nome = nomeDaPessoaSchema.safeParse(d.nome); if (!nome.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  conferirForcaDaSenha(d.senha, login.data); return { login: login.data, nome: nome.data };
}

function contaNova(r: RegistroDeContas, d: { login: string; nome: string }, extra: Pick<Usuario, 'papel' | 'estado' | 'senha' | 'recuperacao' | 'trocarSenha' | 'origem'>, agora: Date): Usuario {
  if (r.usuarios.some((u) => u.login === d.login)) throw new Error('LOGIN_TAKEN: esse login já está em uso; escolha outro.');
  const quando = agora.toISOString();
  return { id: randomUUID(), login: d.login, nome: d.nome, falhas: 0, bloqueadoAte: null, criadoEm: quando, atualizadoEm: quando, ultimoAcesso: null, ...extra };
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

/** Liga o login: cria a primeira conta, de administrador, e já entra com ela. Só funciona enquanto não existe nenhuma conta. */
export async function ativarLogin(d: { login: string; nome: string; senha: string }, b?: string, agora = new Date()) {
  const dados = dadosDaConta(d); const codigo = gerarCodigoDeRecuperacao();
  const senha = await resumirSegredo(d.senha); const recuperacao = await resumirSegredo(normalizarCodigoDeRecuperacao(codigo));
  const r = lerContas(b); if (loginLigado(r)) throw new Error('LOGIN_ALREADY_ACTIVE: o login já está ligado; use Usuários para criar outras contas.');
  const u = contaNova(r, dados, { papel: 'administrador', estado: 'ATIVO', senha, recuperacao, trocarSenha: false, origem: 'ATIVACAO' }, agora);
  u.ultimoAcesso = agora.toISOString(); r.usuarios.push(u); gravarContas(r, b); iniciarSessao(u.id, agora.getTime());
  return { conta: contaParaJanela(r, u, agora.getTime()), codigoRecuperacao: codigo };
}

/** Entrar: mensagem igual para login inexistente e senha errada; bloqueio por conta depois de várias tentativas erradas. */
export async function entrarNaConta(d: { login: string; senha: string }, b?: string, agora = new Date()) {
  frearTentativas(agora.getTime());
  const antes = lerContas(b); if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: o login ainda não foi ativado neste computador.');
  const login = String(d.login ?? '').trim().toLowerCase(); const u = antes.usuarios.find((x) => x.login === login) ?? null;
  if (u) conferirBloqueio(u, agora);
  if (!(await conferirSegredo(d.senha, u?.senha ?? null))) {
    if (registrarErro(u?.id ?? null, agora, b)) throw new Error('ACCOUNT_LOCKED: conta bloqueada por tentativas erradas; espere ou peça o desbloqueio à Administração.');
    throw new Error('LOGIN_INVALID: login ou senha incorretos.');
  }
  if (u!.estado === 'PENDENTE') throw new Error('ACCOUNT_PENDING: o cadastro aguarda aprovação da Administração.');
  if (u!.estado === 'DESATIVADO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  const r = lerContas(b); const atual = r.usuarios.find((x) => x.id === u!.id); if (!atual) throw new Error('LOGIN_INVALID: login ou senha incorretos.');
  atual.falhas = 0; atual.bloqueadoAte = null; atual.ultimoAcesso = agora.toISOString(); gravarContas(r, b); iniciarSessao(atual.id, agora.getTime());
  return sessaoParaJanela(b, agora.getTime());
}

export function sairDaConta(b?: string) { encerrarSessao(); return sessaoParaJanela(b); }

/** Cadastro pela tela de entrada: só com o login ligado e o cadastro aberto; nasce PENDENTE quando a Administração aprova cadastros. */
export async function cadastrarConta(d: { login: string; nome: string; senha: string }, b?: string, agora = new Date()) {
  const antes = lerContas(b);
  if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: o login ainda não foi ativado neste computador.');
  if (!antes.acesso.cadastroAberto) throw new Error('SIGNUP_CLOSED: o cadastro está fechado; peça uma conta à Administração.');
  const dados = dadosDaConta(d); const codigo = gerarCodigoDeRecuperacao();
  const senha = await resumirSegredo(d.senha); const recuperacao = await resumirSegredo(normalizarCodigoDeRecuperacao(codigo));
  const r = lerContas(b); const papel = r.papeis.some((p) => p.id === r.acesso.papelDoCadastro) ? r.acesso.papelDoCadastro : 'leitor';
  const u = contaNova(r, dados, { papel, estado: r.acesso.aprovarCadastros ? 'PENDENTE' : 'ATIVO', senha, recuperacao, trocarSenha: false, origem: 'CADASTRO' }, agora);
  r.usuarios.push(u); gravarContas(r, b);
  return { estado: u.estado, codigoRecuperacao: codigo };
}

/** Esqueci a senha: o código de recuperação (mostrado uma vez no cadastro) define uma senha nova e é trocado por outro. */
export async function recuperarConta(d: { login: string; codigo: string; novaSenha: string }, b?: string, agora = new Date()) {
  frearTentativas(agora.getTime());
  const antes = lerContas(b); if (!loginLigado(antes)) throw new Error('LOGIN_NOT_ACTIVE: o login ainda não foi ativado neste computador.');
  const login = String(d.login ?? '').trim().toLowerCase(); const u = antes.usuarios.find((x) => x.login === login) ?? null;
  if (u) conferirBloqueio(u, agora);
  const formato = codigoDeRecuperacaoSchema.safeParse(d.codigo);
  const confere = await conferirSegredo(formato.success ? normalizarCodigoDeRecuperacao(formato.data) : '-', u?.recuperacao ?? null);
  if (!formato.success || !confere) {
    if (registrarErro(u?.id ?? null, agora, b)) throw new Error('ACCOUNT_LOCKED: conta bloqueada por tentativas erradas; espere ou peça o desbloqueio à Administração.');
    throw new Error('RECOVERY_INVALID: login ou código de recuperação incorretos. Sem o código, peça à Administração para redefinir a senha.');
  }
  if (u!.estado === 'DESATIVADO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  conferirForcaDaSenha(d.novaSenha, u!.login);
  const codigo = gerarCodigoDeRecuperacao(); const senha = await resumirSegredo(d.novaSenha); const recuperacao = await resumirSegredo(normalizarCodigoDeRecuperacao(codigo));
  const r = lerContas(b); const atual = r.usuarios.find((x) => x.id === u!.id); if (!atual) throw new Error('RECOVERY_INVALID: login ou código de recuperação incorretos.');
  Object.assign(atual, { senha, recuperacao, trocarSenha: false, falhas: 0, bloqueadoAte: null, atualizadoEm: agora.toISOString() }); gravarContas(r, b);
  return { codigoRecuperacao: codigo };
}

/** Troca da própria senha (também a temporária). Quem estava com senha temporária ou sem código ganha um código de recuperação novo. */
export async function trocarMinhaSenha(d: { atual: string; nova: string }, b?: string, agora = new Date()) {
  const s = situacaoDaSessao(b, agora.getTime()); if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  if (!(await conferirSegredo(d.atual, s.usuario.senha))) { registrarErro(s.usuario.id, agora, b); throw new Error('PASSWORD_INVALID: a senha atual não confere.'); }
  if (d.atual === d.nova) throw new Error('PASSWORD_WEAK: senha fraca: a nova senha precisa ser diferente da atual.');
  conferirForcaDaSenha(d.nova, s.usuario.login);
  const precisaCodigo = s.usuario.trocarSenha || !s.usuario.recuperacao; const codigo = precisaCodigo ? gerarCodigoDeRecuperacao() : null;
  const senha = await resumirSegredo(d.nova); const recuperacao = codigo ? await resumirSegredo(normalizarCodigoDeRecuperacao(codigo)) : null;
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === s.usuario.id)!;
  Object.assign(u, { senha, trocarSenha: false, falhas: 0, atualizadoEm: agora.toISOString() }); if (recuperacao) u.recuperacao = recuperacao; gravarContas(r, b);
  return { codigoRecuperacao: codigo, sessao: sessaoParaJanela(b, agora.getTime()) };
}

export function alterarMeuNome(nome: string, b?: string, agora = new Date()) {
  const s = situacaoDaSessao(b, agora.getTime()); if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  const n = nomeDaPessoaSchema.safeParse(nome); if (!n.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  const r = lerContas(b); const u = r.usuarios.find((x) => x.id === s.usuario.id)!; u.nome = n.data; u.atualizadoEm = agora.toISOString(); gravarContas(r, b);
  return sessaoParaJanela(b, agora.getTime());
}
