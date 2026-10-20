/** Busca um projeto do Prumo pelo id; se não existe, avisa WORKSPACE_NOT_FOUND. */
import { listarEspacos } from './armazenamentoDeEspacos.js';

export function obterEspaco(id:string,base?:string){const e=listarEspacos(base).find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');return e;}
