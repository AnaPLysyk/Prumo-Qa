/** Apaga um contexto e anota em excluidos.jsonl só o id, a data e o hash. */
import fs from 'node:fs';
import path from 'node:path';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarContexto } from './carregarContexto.js';
import { ultimaVersaoDoContexto } from '../regras/ultimaVersaoDoContexto.js';

/** Exclusão definitiva do contexto; fica só um registro mínimo (sem texto) de que existiu. */
export function excluirContexto(p: Projeto, id: string, base?: string) {
  const { dir, arq } = carregarContexto(p, id, base); const u = ultimaVersaoDoContexto(arq);
  fs.appendFileSync(path.join(dir, 'excluidos.jsonl'), JSON.stringify({ id, em: new Date().toISOString(), ultimoHash: u.conteudoHash, versao: u.versao }) + '\n', { mode: 0o600 });
  fs.unlinkSync(path.join(dir, id + '.json')); return { deleted: true };
}
