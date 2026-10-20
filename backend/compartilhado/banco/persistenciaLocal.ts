/** Lê e grava os dados JSON locais com validação, restrição de caminhos e troca atômica. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { diretorioDados } from './diretorioDados.js';
import { semLinks } from '../seguranca/semLinks.js';

const LIMITE_ARQUIVO = 2 * 1024 * 1024;

/** Somente nomes internos de JSON e binários dentro da pasta de dados do Prumo. */
export function arquivoLocal(nome: string, base?: string) {
  if (!/^[a-z0-9-]+\.(json|bin)$/.test(nome)) {
    throw new Error('LOCAL_FILE_INVALID');
  }
  const arquivo = path.join(diretorioDados(base), 'plataforma', nome);
  semLinks(arquivo);
  return arquivo;
}

/** Sem arquivo, devolve o padrão; dados inválidos não são tratados como ausentes. */
export function lerLocal<T>(
  nome: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  padrao: T,
  base?: string
): T {
  const arquivo = arquivoLocal(nome, base);
  try {
    const estado = fs.lstatSync(arquivo);
    if (!estado.isFile() || estado.nlink !== 1 || estado.size > LIMITE_ARQUIVO) {
      throw new Error('LOCAL_DATA_INVALID');
    }
    return schema.parse(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return padrao;
    throw new Error('LOCAL_DATA_INVALID');
  }
}

/** Evita links e grava por arquivo temporário exclusivo, fsync e renomeação. */
export function gravarLocal(nome: string, valor: unknown, base?: string) {
  const arquivo = arquivoLocal(nome, base);
  const texto = JSON.stringify(valor);
  if (Buffer.byteLength(texto) > LIMITE_ARQUIVO) throw new Error('LOCAL_DATA_LIMIT');

  if (fs.existsSync(arquivo)) {
    const estado = fs.lstatSync(arquivo);
    if (!estado.isFile() || estado.nlink !== 1) throw new Error('LOCAL_FILE_INVALID');
  }

  fs.mkdirSync(path.dirname(arquivo), { recursive: true, mode: 0o700 });
  semLinks(arquivo);

  const temporario = arquivo + '.' + randomUUID() + '.tmp';
  try {
    const descritor = fs.openSync(temporario, 'wx', 0o600);
    try {
      fs.writeFileSync(descritor, texto);
      fs.fsyncSync(descritor);
    } finally {
      fs.closeSync(descritor);
    }
    fs.renameSync(temporario, arquivo);
  } finally {
    if (fs.existsSync(temporario)) fs.unlinkSync(temporario);
  }
}
