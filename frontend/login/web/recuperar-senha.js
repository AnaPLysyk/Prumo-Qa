'use strict';
const form=document.querySelector('#form');
const estado=document.querySelector('#estado');
const token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
history.replaceState(null,'',location.pathname);
const avisar=(texto,tom='')=>{estado.textContent=texto;estado.dataset.tom=tom;};
// Códigos do Better Auth viram orientação; o texto do servidor nunca aparece na página.
const MOTIVOS={PASSWORD_TOO_SHORT:'Use pelo menos 10 caracteres.',PASSWORD_TOO_LONG:'Use no máximo 128 caracteres.',
  INVALID_TOKEN:'Este link venceu ou já foi usado. Peça outro no aplicativo, em Esqueci a senha.'};
if(!/^[A-Za-z0-9_.-]{20,256}$/.test(token)){form.hidden=true;avisar(MOTIVOS.INVALID_TOKEN,'falha');}
form?.addEventListener('submit',async event=>{
 event.preventDefault();
 const senha=document.querySelector('#senha'),confirma=document.querySelector('#confirma'),botao=form.querySelector('button');
 if(senha.value.length<10)return avisar(MOTIVOS.PASSWORD_TOO_SHORT,'falha');
 if(senha.value!==confirma.value)return avisar('A confirmação não é igual à senha.','falha');
 botao.disabled=true;avisar('Validando...');
 try{
   const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({token,newPassword:senha.value}),credentials:'omit',cache:'no-store'});
   if(!r.ok)throw new Error((await r.json().catch(()=>({}))).code||'RESET_FAILED');
   senha.value='';confirma.value='';form.hidden=true;avisar('Senha alterada. Volte ao Prumo QA e entre com a senha nova.','ok');
 }catch(e){avisar(MOTIVOS[e.message]||'Não foi possível definir a senha. Peça outro link no aplicativo.','falha');botao.disabled=false;}
});
