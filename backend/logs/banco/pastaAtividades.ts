/** Pasta do diário de operações do projeto (fora da pasta do projeto). */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { caminhoDentroDe } from '../../compartilhado/seguranca/caminhoDentroDe.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

export function pastaAtividades(p:Projeto, base=process.env.PRUMO_DATA_DIR):string {
  const dados=diretorioDados(base);
  const alvo=path.resolve(dados,'projects',hash(p.raiz+'\0'+p.manifesto.id));
  if(caminhoDentroDe(p.raiz,path.resolve(dados)) || caminhoDentroDe(p.raiz,alvo))falharCom('HISTORY_INSIDE_PROJECT');
  semLinks(alvo);return alvo;
}
