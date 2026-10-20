/** Pasta do diário de operações do projeto (fora da pasta do projeto). */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { falharCom } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

/** Diz se `alvo` fica dentro de `raiz` (ou é a própria raiz). */
function caminhoDentroDe(raiz:string,alvo:string) { const r=path.relative(raiz,alvo);return !r || (r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r)); }

export function pastaAtividades(p:Projeto, base?:string):string {
  const dados=diretorioDados(base);
  const alvo=path.resolve(dados,'projects',hash(p.raiz+'\0'+p.manifesto.id));
  if(caminhoDentroDe(p.raiz,path.resolve(dados)) || caminhoDentroDe(p.raiz,alvo))falharCom('HISTORY_INSIDE_PROJECT');
  semLinks(alvo);return alvo;
}
