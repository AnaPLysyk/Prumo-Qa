/** Recusa caminhos que passam por atalhos (links simbólicos ou junctions) em qualquer pasta do caminho. */
import fs from 'node:fs';
import path from 'node:path';
import { falharCom } from '../erros/falharCom.js';

/** Recusa links em TODOS os componentes, inclusive ancestrais do diretório de dados. */
export function semLinks(alvo:string) {
  const absoluto=path.resolve(alvo); let atual=path.parse(absoluto).root;
  for(const parte of absoluto.slice(atual.length).split(path.sep).filter(Boolean)) {
    atual=path.join(atual,parte);
    try { if(fs.lstatSync(atual).isSymbolicLink())falharCom('HISTORY_SYMLINK'); }
    catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return;throw e; }
  }
}
