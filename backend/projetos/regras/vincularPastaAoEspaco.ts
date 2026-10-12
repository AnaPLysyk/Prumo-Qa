/** Liga a pasta de código ao projeto do Prumo, conferindo o contrato e se outra pessoa/projeto já usa a mesma pasta. */
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { listarEspacos } from '../banco/listarEspacos.js';
import { obterEspaco } from '../banco/obterEspaco.js';
import { adicionarVinculo } from './adicionarVinculo.js';
import { eventoEspaco } from './eventoEspaco.js';
import { situacaoProjeto } from './situacaoProjeto.js';

export async function vincularPastaAoEspaco(id:string,raiz:string,base?:string){
  obterEspaco(id,base);const s=await situacaoProjeto(raiz);if(s.state!=='INTEGRADO')throw new Error('WORKSPACE_LOCAL_CONTRACT_INVALID');
  const outra=listarEspacos(base).find(e=>e.id!==id&&e.pastaLocal?.toLowerCase()===s.root.toLowerCase());if(outra)throw new Error('WORKSPACE_LOCAL_DUPLICATE');
  await adicionarVinculo(s.root,base);return atualizarEspaco(id,e=>{e.pastaLocal=s.root;eventoEspaco(e,'PASTA');},base);
}
