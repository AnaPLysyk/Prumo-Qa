/** Descobre qual projeto do Prumo usa esta pasta. */
import path from 'node:path';
import { listarEspacos } from '../banco/armazenamentoDeEspacos.js';

/** Projeto Prumo (espaço) a que uma raiz autorizada pertence: a pasta de contextos do projeto ou a pasta de automação vinculada. */
export function espacoDaRaiz(raiz: string, b?: string) {
  const alvo = path.resolve(raiz).toLowerCase(); return listarEspacos(b).find(e => path.resolve(e.raizContextos).toLowerCase() === alvo || (e.pastaLocal && path.resolve(e.pastaLocal).toLowerCase() === alvo)) ?? null;
}
