/** Executa uma operação registrando início e término no diário, mesmo quando ela falha. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { iniciarAtividade } from './iniciarAtividade.js';
import { Origem } from '../tipos/atividade.js';

export async function observar<T>(p:Projeto,tool:string,origem:Origem,entrada:unknown,fn:()=>Promise<T>,opcoes:Parameters<typeof iniciarAtividade>[4]={}) {
  const atividade=iniciarAtividade(p,tool,origem,entrada,opcoes);
  try { const r=await fn();atividade.finalizar(r);return r; }
  catch(e) { atividade.finalizar(e,true);throw e; }
}
