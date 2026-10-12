/** Diz se um IP é público (recusa rede interna, localhost e faixas especiais). */
import { isIP } from 'node:net';

export function enderecoPublico(ip:string){
  // Conjunto conservador: descarta IPv6 no transporte inicial e todas as faixas especiais IPv4.
  if(isIP(ip)!==4)return false;const a=ip.split('.').map(Number);const[x,y]=a;
  const terceiro=a[2]!;
  return x!>=1&&x!<224&&x!==10&&x!==127&&!(x===169&&y===254)&&!(x===172&&y!>=16&&y!<=31)&&!(x===100&&y!>=64&&y!<=127)&&!(x===192&&(y===168||y===0||y===88))&&!(x===198&&(y===18||y===19||(y===51&&terceiro===100)))&&!(x===203&&y===0&&terceiro===113);
}
