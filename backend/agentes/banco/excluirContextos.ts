/** Exclusão de contextos, com registro mínimo e indicação de falhas parciais. */
import fs from 'node:fs';
import path from 'node:path';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { carregarContexto } from './consultarContextos.js';
import { ultimaVersaoDoContexto } from '../regras/validacoesDeContexto.js';
import { pastaContextos } from './arquivosDeContexto.js';

/** Elimina o conteúdo e mantém somente identificador, data, hash e versão no registro. */
export function excluirContexto(projeto: Projeto, id: string, base?: string) {
  const { dir, arq } = carregarContexto(projeto, id, base);
  const ultima = ultimaVersaoDoContexto(arq);

  fs.appendFileSync(
    path.join(dir, 'excluidos.jsonl'),
    JSON.stringify({
      id,
      em: new Date().toISOString(),
      ultimoHash: ultima.conteudoHash,
      versao: ultima.versao
    }) + '\n',
    { mode: 0o600 }
  );
  fs.unlinkSync(path.join(dir, id + '.json'));
  return { deleted: true };
}

/** Exclui cada arquivo de contexto e informa os que não puderam ser removidos. */
export function excluirTodosContextos(projeto: Projeto, base?: string) {
  const dir = pastaContextos(projeto, base);
  let deleted = 0;
  const failed: { file: string; code: string }[] = [];
  let nomes: string[] = [];

  try {
    nomes = fs.readdirSync(dir).filter(nome => /^[0-9a-f-]{36}\.json$/.test(nome));
  } catch {
    return { deleted: 0, failed };
  }

  for (const nome of nomes) {
    try {
      const info = fs.lstatSync(path.join(dir, nome));
      if (!info.isFile() || info.nlink !== 1) {
        throw Object.assign(new Error('x'), { code: 'FILE_INVALID' });
      }
      fs.unlinkSync(path.join(dir, nome));
      deleted++;
    } catch (erro) {
      failed.push({ file: nome, code: (erro as NodeJS.ErrnoException).code ?? 'UNKNOWN' });
    }
  }

  return { deleted, failed };
}
