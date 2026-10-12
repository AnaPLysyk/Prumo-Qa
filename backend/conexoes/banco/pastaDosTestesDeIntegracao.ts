/** Pasta dos registros do teste de integração deste projeto. */
import path from 'node:path';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { pastaAtividades } from '../../logs/banco/pastaAtividades.js';

export function pastaDosTestesDeIntegracao(p: Projeto) { return path.resolve(pastaAtividades(p), '..', '..', 'integracoes', hash(p.raiz + '\0' + p.manifesto.id)); }
