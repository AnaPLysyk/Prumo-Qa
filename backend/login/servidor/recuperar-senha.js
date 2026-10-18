'use strict';
const form=document.querySelector('#form');
const estado=document.querySelector('#estado');
const token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
history.replaceState(null,'',location.pathname);
if(!/^[A-Za-z0-9_.-]{20,256}$/.test(token)){form.hidden=true;estado.textContent='Este link não é válido. Peça outro pelo aplicativo.';}
form?.addEventListener('submit',async event=>{
 event.preventDefault();const senha=document.querySelector('#senha');const botao=form.querySelector('button');
 botao.disabled=true;estado.textContent='Validando...';
 try{
   const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({token,newPassword:senha.value}),credentials:'omit',cache:'no-store'});
   if(!r.ok)throw new Error('RESET_FAILED');
   senha.value='';form.hidden=true;estado.textContent='Senha alterada. Volte ao aplicativo e entre com sua conta.';
 }catch{estado.textContent='Não foi possível redefinir a senha. Solicite outro link no aplicativo.';botao.disabled=false;}
});