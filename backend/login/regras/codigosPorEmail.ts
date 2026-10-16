/** Códigos de 6 dígitos mandados por e-mail para confirmar o cadastro ou definir senha nova: só na memória, valem 10 minutos, uma vez, com até 5 tentativas. */
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { loginLigado } from './sessao.js';
import { lerContas } from '../banco/lerContas.js';
import { enviarCodigoPorEmail, PedidoDeCodigo } from '../integracoes/enviarCodigoPorEmail.js';
import { codigoPorEmailSchema, emailSchema } from '../tipos/contas.js';

export type FinalidadeDoCodigo = PedidoDeCodigo['finalidade'];
export const MINUTOS_DE_VALIDADE = 10;
export const SEGUNDOS_PARA_REENVIAR = 60;
const TENTATIVAS = 5;

type Pendente = { resumo: Buffer; expira: number; tentativas: number; enviadoEm: number };
const pendentes = new Map<string, Pendente>();
// O código nunca é guardado: só o resumo com um sal que existe enquanto o Prumo está aberto.
const sal = randomBytes(32);
const resumir = (codigo: string) => createHash('sha256').update(sal).update(codigo).digest();
const chave = (f: FinalidadeDoCodigo, email: string) => f + ':' + email;

export function emailValido(email: string): string {
  const e = emailSchema.safeParse(email); if (!e.success) throw new Error('EMAIL_INVALID: confira o e-mail informado.');
  return e.data;
}

/**
 * Manda um código ao e-mail. Cadastro: recusa e-mail que já tem conta e cadastro fechado. Senha: sem conta ativa com esse
 * e-mail não manda nada, mas responde igual, para a tela não revelar quem tem conta.
 */
export async function pedirCodigo(d: { email: string; finalidade: FinalidadeDoCodigo; idioma?: 'pt-BR' | 'en' }, b?: string, enviar = enviarCodigoPorEmail, agora = Date.now()) {
  const email = emailValido(d.email); const r = lerContas(b); const dono = r.usuarios.find((u) => u.email === email);
  if (d.finalidade === 'CADASTRO') {
    if (loginLigado(r) && !r.acesso.cadastroAberto) throw new Error('SIGNUP_CLOSED: o cadastro está fechado; peça uma conta à Administração.');
    if (dono) throw new Error('EMAIL_TAKEN: esse e-mail já tem conta neste computador; entre com ele ou use Esqueci a senha.');
  } else if (!loginLigado(r)) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  const k = chave(d.finalidade, email); const antes = pendentes.get(k);
  if (antes && agora - antes.enviadoEm < SEGUNDOS_PARA_REENVIAR * 1000) throw new Error('EMAIL_WAIT: espere ' + Math.ceil((SEGUNDOS_PARA_REENVIAR * 1000 - (agora - antes.enviadoEm)) / 1000) + ' segundos para pedir outro código.');
  const resposta = { email, minutosDeValidade: MINUTOS_DE_VALIDADE, segundosParaReenviar: SEGUNDOS_PARA_REENVIAR };
  const expira = agora + MINUTOS_DE_VALIDADE * 60_000;
  if (d.finalidade === 'SENHA' && (!dono || dono.estado === 'DESATIVADO')) { pendentes.set(k, { resumo: randomBytes(32), expira, tentativas: 0, enviadoEm: agora }); return resposta; }
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await enviar({ email, codigo, finalidade: d.finalidade, idioma: d.idioma ?? 'pt-BR' });
  pendentes.set(k, { resumo: resumir(codigo), expira, tentativas: 0, enviadoEm: agora });
  return resposta;
}

/** Confere e gasta o código. Errar 5 vezes ou passar dos 10 minutos obriga a pedir outro. */
export function conferirCodigo(finalidade: FinalidadeDoCodigo, email: string, codigo: string, agora = Date.now()): void {
  const k = chave(finalidade, email); const p = pendentes.get(k);
  if (!p || p.expira <= agora) { pendentes.delete(k); throw new Error('CODE_EXPIRED: o código venceu ou não foi pedido; peça um novo.'); }
  const formato = codigoPorEmailSchema.safeParse(codigo);
  if (!formato.success || !timingSafeEqual(resumir(formato.data), p.resumo)) {
    p.tentativas += 1;
    if (p.tentativas >= TENTATIVAS) { pendentes.delete(k); throw new Error('CODE_EXPIRED: código errado vezes demais; peça um novo.'); }
    throw new Error('CODE_INVALID: código incorreto; confira o e-mail e tente de novo.');
  }
  pendentes.delete(k);
}

/** Só para os testes unitários: esquece os códigos pendentes. */
export function esquecerCodigos(): void { pendentes.clear(); }
