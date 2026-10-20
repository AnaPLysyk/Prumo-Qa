/** Projeta o usuário verificado pelo Better Auth numa conta local isolada; autorização admin nunca vem do cliente. */
import {createHash} from 'node:crypto';
import {contaNova} from './contas.js';
import {lerContas} from '../banco/contas.js';
import {gravarContas} from '../banco/contas.js';
import {iniciarSessao,sessaoParaJanela} from './sessao.js';
import type {UsuarioRemoto} from '../integracoes/autenticacaoRemota.js';

export function idLocalDeIdentidadeRemota(id:string){
  const v=createHash('sha256').update('prumo-qa:better-auth:'+id).digest('hex');
  return v.slice(0,8)+'-'+v.slice(8,12)+'-5'+v.slice(13,16)+'-a'+v.slice(17,20)+'-'+v.slice(20,32);
}
export function entrarComIdentidadeRemota(p:UsuarioRemoto,base?:string,agora=new Date()){
  if(!p.emailVerified||!/^[A-Za-z0-9_-]{8,128}$/.test(p.id)||!p.email)throw new Error('IDENTITY_INVALID');
  const r=lerContas(base),uuid=idLocalDeIdentidadeRemota(p.id);
  const existente=r.usuarios.find(x=>x.identidades.some(i=>i.provedor==='better-auth'&&i.id===p.id));
  if(!existente&&r.usuarios.some(x=>x.email===p.email))
    throw new Error('IDENTITY_LINK_REQUIRED: uma conta antiga usa este e-mail; requer migração explícita.');
  const login='id-'+uuid.replace(/-/g,'').slice(0,28);
  const nome=String(p.name||p.email.split('@')[0]).trim().slice(0,80);
  const usuario=existente??contaNova(r,{login,nome:nome.length>1?nome:'Pessoa Prumo',email:p.email},
    {papel:'qa',estado:'ATIVO',senha:null,recuperacao:null,trocarSenha:false,
    origem:'CADASTRO',admin:false,identidades:[{provedor:'better-auth',id:p.id,login:p.email.slice(0,60)}]},agora);
  if(usuario.estado!=='ATIVO')throw new Error('ACCOUNT_DISABLED');
  // Sem autorização remota de admin, nunca manter elevação administrativa local.
  if(usuario.admin||usuario.papel==='administrador')throw new Error('IDENTITY_ADMIN_MISMATCH');
  if(!existente){usuario.id=uuid;r.usuarios.push(usuario);}
  usuario.ultimoAcesso=agora.toISOString();
  gravarContas(r,base);iniciarSessao(usuario.id,agora.getTime());
  return sessaoParaJanela(base,agora.getTime());
}
