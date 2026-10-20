/** Escopo de arquivos por identidade; cada pedido IPC mantém a conta inicial mesmo se outro usuário entrar. */
import { AsyncLocalStorage } from 'node:async_hooks';
let usuarioAtivo:string|null=null;
const escopoPorPedido=new AsyncLocalStorage<string|null>();
export function definirUsuarioDoEscopo(id:string|null) {
  if(id!==null&&!/^[a-f0-9-]{36}$/i.test(id))throw new Error('USER_SCOPE_INVALID');
  usuarioAtivo=id;
}
export function usuarioDoEscopo(){
  const pedido=escopoPorPedido.getStore();
  return pedido===undefined?usuarioAtivo:pedido;
}
export function executarNoEscopoDoUsuario<T>(usuarioId:string|null,tarefa:()=>T):T {
  if(usuarioId!==null&&!/^[a-f0-9-]{36}$/i.test(usuarioId))throw new Error('USER_SCOPE_INVALID');
  return escopoPorPedido.run(usuarioId,tarefa);
}
