/** Resume senhas com scrypt e sal próprio, confere em tempo constante e exige senha mínima. */
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { ResumoDeSegredo } from '../tipos/contas.js';

// N=2^15, r=8: cerca de 32 MiB e algumas dezenas de milissegundos por conferência; o limite de memória vai acima disso.
const N = 32768; const R = 8; const P = 1; const TAMANHO = 32;
const SEM_AMBIGUIDADE = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

function derivar(segredo: string, sal: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((ok, falha) => scrypt(segredo.normalize('NFKC'), sal, TAMANHO, { N: n, r, p, maxmem: 256 * n * r * p }, (e, chave) => (e ? falha(e) : ok(chave))));
}

/** Resumo novo, com sal aleatório de 16 bytes. O texto original nunca é guardado. */
export async function resumirSegredo(segredo: string): Promise<ResumoDeSegredo> {
  const sal = randomBytes(16);
  return { algoritmo: 'scrypt', N, r: R, p: P, sal: sal.toString('base64'), resumo: (await derivar(segredo, sal, N, R, P)).toString('base64') };
}

/** Confere o segredo. Sem resumo (conta inexistente) faz o mesmo trabalho e devolve falso, para o tempo não revelar se a conta existe. */
export async function conferirSegredo(segredo: string, guardado: ResumoDeSegredo | null): Promise<boolean> {
  if (!guardado) { await resumirSegredo(segredo); return false; }
  const esperado = Buffer.from(guardado.resumo, 'base64');
  const obtido = await derivar(segredo, Buffer.from(guardado.sal, 'base64'), guardado.N, guardado.r, guardado.p);
  return obtido.length === esperado.length && timingSafeEqual(obtido, esperado);
}

/** Senha mínima: 10 caracteres, com letra e número, sem conter o login nem ser só repetição. */
export function conferirForcaDaSenha(senha: string, login: string): void {
  const problema = senha.length < 10 ? 'use pelo menos 10 caracteres'
    : !/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha) ? 'misture letras e números'
      : senha.toLowerCase().includes(login.toLowerCase()) ? 'não use o login dentro da senha'
        : new Set(senha).size < 5 ? 'use caracteres variados'
          : null;
  if (problema) throw new Error('PASSWORD_WEAK: senha fraca: ' + problema + '.');
}

/** Senha temporária que a Administração entrega à pessoa: 16 caracteres sem letras parecidas, com letra e número garantidos. */
export function gerarSenhaTemporaria(): string {
  for (;;) {
    let s = ''; for (let i = 0; i < 16; i++) s += SEM_AMBIGUIDADE[randomInt(SEM_AMBIGUIDADE.length)];
    if (/[a-zA-Z]/.test(s) && /\d/.test(s) && new Set(s).size >= 5) return s;
  }
}
