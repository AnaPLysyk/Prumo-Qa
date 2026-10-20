/** Login: endereço HTTPS configurado para autenticação central, sem sessão nem chamadas de rede. */
export function enderecoDeAutenticacao(){
  const origem=String(process.env.PRUMO_AUTH_API_URL||'');
  let u:URL;try{u=new URL(origem);}catch{return null;}
  if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password||u.port)return null;
  return u.origin;
}
export const usarAutenticacaoRemota=()=>!!enderecoDeAutenticacao();
