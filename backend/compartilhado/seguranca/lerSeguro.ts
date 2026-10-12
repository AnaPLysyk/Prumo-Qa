/** Lê um arquivo de texto do projeto com limite de tamanho, recusando arquivos binários e caminhos proibidos. */
import { promises as fs } from 'node:fs';
import { ErroQa } from '../erros/ErroQa.js';
import { caminhoSeguro } from './caminhoSeguro.js';

export async function lerSeguro(raiz: string, relativo: string, interno = false, limite = 262144) {
  const alvo = await caminhoSeguro(raiz, relativo, interno);
  const st = await fs.stat(alvo);
  if (!st.isFile() || st.size > limite) throw new ErroQa('READ_LIMIT', 'Arquivo não regular ou maior que o limite de leitura.');
  const b = await fs.readFile(alvo);
  if (b.length > limite) throw new ErroQa('READ_LIMIT', 'Limite de leitura excedido.');
  if (b.includes(0)) throw new ErroQa('BINARY_FILE', 'Arquivo binário não será interpretado.');
  return b.toString('utf8');
}
