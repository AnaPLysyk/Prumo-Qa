/** Calcula o escopo que a pessoa aprova: hashes do contrato, do comando, do ambiente e dos arquivos envolvidos. */
import path from 'node:path';
import { inventariar } from '../../compartilhado/projeto/inventariar.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { Comando, Projeto } from '../../compartilhado/tipos/projeto.js';

export async function escopoDaExecucao(p:Projeto,c:Comando,env:NodeJS.ProcessEnv) {
  const inv=await inventariar(p); const fontes=inv.fontes.map(({path,sha256})=>({path,sha256}));
  for(const arg of c.executable==='node' ? c.args.filter(v=>v!=='--test') : ['package.json']) {
    const rel=path.join(c.cwd,arg); fontes.push({path:rel,sha256:hash(await lerSeguro(p.raiz,rel))});
  }
  // O PRUMO_JOB_ID muda a cada execução; fora do hash o escopo fica estável e uma autorização prévia pode ser reconhecida.
  const { PRUMO_JOB_ID:_ignorado, ...envEstavel }=env;
  return hash(JSON.stringify({root:p.raiz,manifest:p.manifestoHash,command:c,env:envEstavel,fontes}));
}
