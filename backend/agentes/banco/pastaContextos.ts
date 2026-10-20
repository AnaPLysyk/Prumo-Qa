/** Devolve a pasta onde ficam os contextos deste projeto (fora da pasta do projeto, na pasta de dados do usuário). */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { ErroQa } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

export function pastaContextos(p: Projeto, base?: string): string {
  const dados = diretorioDados(base); const alvo = path.resolve(dados, 'contextos', hash(p.raiz + '\0' + p.manifesto.id));
  const r = path.relative(p.raiz, alvo); if (!r || (!r.startsWith('..') && !path.isAbsolute(r))) throw new ErroQa('CONTEXT_INSIDE_PROJECT', 'Contextos não podem ficar dentro do projeto.');
  semLinks(alvo); return alvo;
}
