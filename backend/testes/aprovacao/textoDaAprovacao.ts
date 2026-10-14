/** Texto curto, sem marcação, que a janela de autenticação do sistema mostra para a pessoa aprovar. */
import { EscopoAprovacao } from '../tipos/aprovacao.js';

const cortar = (s:string,n:number) => (s.length>n ? s.slice(0,n-1)+'…' : s).replace(/[\u0000-\u001f]+/g,' ');

export function textoDaAprovacao(e:EscopoAprovacao):string {
  return [`Prumo QA quer executar "${cortar(e.capability,60)}".`,`Projeto: ${cortar(e.projectId,60)}`,`Pasta: ${cortar(e.root,120)}`,`Comando: ${cortar(e.command,200)}`,`Escopo: ${e.scopeHash.slice(0,16)}`,'Só aprove se foi você quem pediu.'].join('\n');
}
