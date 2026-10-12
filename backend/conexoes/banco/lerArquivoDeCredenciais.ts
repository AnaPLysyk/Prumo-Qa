/** Lê o arquivo credenciais.json (só valores cifrados); se ainda não existe, começa vazio. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { schema } from '../tipos/credenciais.js';

export function lerArquivoDeCredenciais(base?: string) {
  return lerLocal('credenciais.json', schema, { version: 1, entradas: {} }, base);
}
