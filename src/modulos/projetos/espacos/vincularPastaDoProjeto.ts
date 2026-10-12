/** Vincula uma pasta local somente após validar seu contrato. */
import {situacaoProjeto, adicionarVinculo} from '../../../vinculos.js';
import {listarEspacos, obterEspaco, atualizar, eventoEspaco} from './armazenarEspacos.js';

export async function pastaEspaco(id:string,raiz:string,base?:string){
  obterEspaco(id,base);const s=await situacaoProjeto(raiz);if(s.state!=='INTEGRADO')throw new Error('WORKSPACE_LOCAL_CONTRACT_INVALID');
  const outra=listarEspacos(base).find(e=>e.id!==id&&e.pastaLocal?.toLowerCase()===s.root.toLowerCase());if(outra)throw new Error('WORKSPACE_LOCAL_DUPLICATE');
  await adicionarVinculo(s.root,base);return atualizar(id,e=>{e.pastaLocal=s.root;eventoEspaco(e,'PASTA');},base);
}
