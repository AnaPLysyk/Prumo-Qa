import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CORES, SITE, montarEmail} from '../../../../backend/login/servidor/modeloDeEmail.mjs';
import {mensagem} from '../../../../backend/login/servidor/codigos.mjs';
import {criarAutenticacao} from '../../../../backend/login/servidor/autenticacao.mjs';
import {criarServico} from '../../../../backend/aplicativo/servidor/servidor.mjs';

const ler=rel=>fs.readFileSync(new URL('../../../../'+rel,import.meta.url),'utf8');

test('e-mails repetem as cores da tela de entrada e do tema claro do Design System',()=>{
  const estilo=ler('frontend/design-system/estilo.css'),entrada=ler('frontend/design-system/estilos-das-telas.parte.css');
  const claro=estilo.slice(estilo.indexOf('--fundo: #f5f8fc'));
  for(const [token,cor] of [['painel',CORES.painel],['linha',CORES.linha],['texto',CORES.texto],['suave',CORES.suave],['acento',CORES.acento],['acento-texto',CORES.acentoTexto]])
    assert.match(claro,new RegExp(`--${token}: ${cor};`),token);
  assert.match(entrada,new RegExp(`--login-suave: ${CORES.noiteSuave};[^}]*--login-acento: ${CORES.noiteAcento};[^}]*${CORES.noite}`));
});

test('modelo escapa todo valor variável e só aceita link HTTPS',()=>{
  const {html,texto}=montarEmail({chip:'<b>',titulo:'"x"',texto:'a & b',acao:{rotulo:'Ir',url:'https://exemplo.com/?a=1&b="2"'}});
  assert.ok(!html.includes('<b>')&&html.includes('&lt;b&gt;'));
  assert.ok(html.includes('href="https://exemplo.com/?a=1&amp;b=&quot;2&quot;"'));
  assert.ok(html.includes(SITE+'/agente.png')&&html.includes(SITE+'/prumo.png'));
  assert.match(texto,/Ir: https:\/\/exemplo\.com/);
  assert.throws(()=>montarEmail({chip:'c',titulo:'t',texto:'x',acao:{rotulo:'r',url:'javascript:alert(1)'}}),/EMAIL_LINK_INVALID/);
});

test('código aparece em destaque e é o primeiro número de 6 dígitos do texto puro',()=>{
  for(const finalidade of ['CADASTRO','SENHA','ENTRADA']) for(const idioma of ['pt-BR','en']) {
    const m=mensagem({codigo:'482913',finalidade,idioma});
    assert.equal(/\b(\d{6})\b/.exec(m.texto)[1],'482913');
    assert.match(m.html,/letter-spacing:\.3em[^>]*>482913</);
    assert.match(m.assunto,/482913/);
  }
});

test('confirmação e recuperação levam botão, validade e saudação só com primeiro nome de letras',async()=>{
  const enviados=[];
  const c=criarAutenticacao({env:{BETTER_AUTH_URL:'https://auth.example.com',DATABASE_URL:'postgresql://teste:teste@127.0.0.1:5432/teste',BETTER_AUTH_SECRET:'z'.repeat(48),RESEND_API_KEY:'teste',PRUMO_EMAIL_REMETENTE:'teste@example.com'},enviar:async m=>{enviados.push(m);}});
  await c.auth.options.emailVerification.sendVerificationEmail({user:{email:'ana@example.com',name:'Ana Paula'},url:'https://auth.example.com/api/auth/verify-email?token=t'});
  await c.auth.options.emailAndPassword.sendResetPassword({user:{email:'ana@example.com',name:'www.golpe.com Clique'},token:'abc123'});
  await c.fechar();
  assert.equal(enviados[0].assunto,'Confirme seu e-mail no Prumo QA');
  assert.match(enviados[0].html,/Olá, Ana!/);
  assert.match(enviados[0].html,/>Confirmar e-mail</);
  assert.match(enviados[0].texto,/O link vale por 1 hora/);
  // Nome escolhido por quem cadastrou não pode virar link no e-mail de outra pessoa.
  assert.ok(!enviados[1].html.includes('golpe')&&!enviados[1].texto.includes('golpe'));
  assert.match(enviados[1].html,/href="https:\/\/auth\.example\.com\/recuperar-senha#token=abc123"/);
});

async function abrir(url){
  let status=0,cabecalhos={},conteudo='';
  const servico=criarServico({configurado:false,enviar:async()=>{},autenticacao:{atender:async()=>{throw Error('NUNCA');},checar:async()=>{}}});
  await servico({method:'GET',url},{headersSent:false,writeHead(c,h={}){status=c;cabecalhos=h;},end(v=''){conteudo=String(v);}});
  return {status,cabecalhos,conteudo};
}

test('página de confirmação só diz que confirmou quando o Better Auth não devolveu erro',async()=>{
  assert.match((await abrir('/conta-confirmada')).conteudo,/<h1>E-mail confirmado<\/h1>/);
  const recusada=await abrir('/conta-confirmada?error=TOKEN_EXPIRED');
  assert.equal(recusada.status,200);
  assert.ok(!recusada.conteudo.includes('E-mail confirmado</h1>'));
  assert.match(recusada.conteudo,/Este link não vale mais/);
  assert.ok(!recusada.conteudo.includes('TOKEN_EXPIRED'));
});

test('páginas dos e-mails usam o estilo comum e só carregam imagens do site oficial',async()=>{
  const estilo=await abrir('/paginas.css');
  assert.equal(estilo.status,200);
  assert.match(estilo.cabecalhos['Content-Type'],/^text\/css/);
  for(const rota of ['/conta-confirmada','/recuperar-senha']) {
    const r=await abrir(rota);
    assert.match(r.conteudo,/href="\/paginas\.css"/);
    assert.match(r.cabecalhos['Content-Security-Policy'],new RegExp(`style-src 'self'; img-src ${SITE};`));
    assert.ok(!/style=/.test(r.conteudo),'CSP sem unsafe-inline: nada de estilo embutido');
  }
});
