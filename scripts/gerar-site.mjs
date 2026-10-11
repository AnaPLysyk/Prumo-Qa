import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fontes=[...fs.readdirSync(path.join(repo,'app/ajuda')).filter(n=>n.endsWith('.md')).map(n=>'app/ajuda/'+n),'docs/SEGURANCA.md','docs/SUPORTE.md','docs/ASSINATURA.md','docs/CONTRATOS.md','docs/SERVICOS.md','docs/AGENDAMENTOS.md'];
const nome=f=>'documentacao-'+path.basename(f,'.md').toLowerCase()+'.html';
const repoUrl='https://github.com/AnaPLysyk/Prumo-Qa';
function destino(href,origem) {
  if(/^https:\/\//.test(href))return href;
  if(href.startsWith('#'))return href;
  const f=path.posix.normalize(path.posix.join(path.posix.dirname(origem),href));
  if(fontes.includes(f))return nome(f);
  if(!f.startsWith('../')&&!path.posix.isAbsolute(f))return repoUrl+'/blob/main/'+f;
  return 'documentacao.html';
}
function inline(s,origem) {
  return esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,t,url)=>`<a href="${esc(destino(url.replaceAll('&amp;','&'),origem))}">${t}</a>`).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
}
export function markdown(s,origem='README.md') {
  const out=[];let code=null,list=false,table=false;
  const fechar=()=>{if(list){out.push('</ul>');list=false;}if(table){out.push('</tbody></table></div>');table=false;}};
  for(const linha of s.split(/\r?\n/)) {
    if(linha.startsWith('```')){if(code!==null){out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');code=null;}else{fechar();code=[];}continue;}
    if(code!==null){code.push(linha);continue;}
    if(/^\|/.test(linha)) {if(/^\|[\s:|-]+\|$/.test(linha))continue;if(list){out.push('</ul>');list=false;}const cells=linha.replace(/^\||\|$/g,'').split('|');if(!table){out.push('<div class="tabela"><table><tbody>');table=true;}out.push('<tr>'+cells.map(c=>'<td>'+inline(c.trim(),origem)+'</td>').join('')+'</tr>');continue;}
    if(/^[-*] /.test(linha)||/^\d+\. /.test(linha)){if(table){out.push('</tbody></table></div>');table=false;}if(!list){out.push('<ul>');list=true;}out.push('<li>'+inline(linha.replace(/^(?:[-*]|\d+\.) /,''),origem)+'</li>');continue;}
    fechar();const h=/^(#{1,6}) (.*)$/.exec(linha);
    if(h)out.push(`<h${h[1].length}>${inline(h[2],origem)}</h${h[1].length}>`);
    else if(linha.trim()&&linha!=='---')out.push('<p>'+inline(linha,origem)+'</p>');
  }
  fechar();if(code!==null)out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');return out.join('\n');
}

// Mesma identidade do aplicativo (Quality Control): tokens, esfera, tipografia. Sem JavaScript: a demonstração usa CSS puro.
const css=`:root{color-scheme:dark;--fundo:#040712;--fundo2:#070d1d;--painel:#0a1122;--linha:#1c2742;--texto:#f3f6fc;--suave:#9aa8c2;--acento:#6ea8ff;--acento-texto:#04101f;--ok:#54d39b;--falha:#ff7b8c;--aviso:#e8b84a;--azul:116,173,255;--vermelho:255,82,108;--halo:rgba(37,99,235,.18)}
@media (prefers-color-scheme:light){:root{color-scheme:light;--fundo:#f5f8fc;--fundo2:#eef3fb;--painel:#fff;--linha:#cfd9ea;--texto:#14233d;--suave:#465875;--acento:#1f56b8;--acento-texto:#fff;--ok:#0f6b4a;--falha:#b3243b;--aviso:#7a5200;--azul:43,98,184;--vermelho:181,70,96;--halo:rgba(81,130,214,.16)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(60rem 36rem at 85% -8%,var(--halo),transparent 62%),var(--fundo);color:var(--texto);font:16px/1.65 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--acento);text-underline-offset:4px}a:hover{filter:brightness(1.15)}:focus-visible{outline:3px solid var(--acento);outline-offset:4px;border-radius:6px}
.pular{position:absolute;left:12px;top:-100px}.pular:focus{top:12px;background:var(--painel);padding:10px 14px;z-index:9;border-radius:8px}
header.topo{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:12px max(20px,calc((100vw - 1120px)/2));background:color-mix(in srgb,var(--fundo) 82%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid color-mix(in srgb,var(--linha) 70%,transparent)}
.marca{display:flex;align-items:center;gap:10px;font-weight:600;color:var(--texto);text-decoration:none}.marca img{width:28px;height:28px;border-radius:50%}
nav{display:flex;gap:6px 22px;flex-wrap:wrap;margin-left:auto}nav a{color:var(--suave);text-decoration:none;font-size:14.5px;padding:4px 0;border-bottom:2px solid transparent}nav a:hover,nav a[aria-current=page]{color:var(--texto);border-bottom-color:var(--acento)}
main,footer{max-width:1120px;margin:0 auto;padding:0 20px}main{padding-top:36px;padding-bottom:64px;outline:none}
h1{font-size:clamp(2rem,4.4vw,3.2rem);line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;font-weight:650}h2{font-size:1.5rem;letter-spacing:-.01em;margin:56px 0 14px;font-weight:600}h3{font-size:1.05rem;margin:22px 0 6px}
p{max-width:68ch}.lead{font-size:1.18rem;color:var(--suave);max-width:46ch}.suave{color:var(--suave)}
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:40px;align-items:center;min-height:460px;padding:24px 0 8px}
.etiqueta{font-size:12px;letter-spacing:.14em;color:var(--acento);font-weight:600}
.acoes{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 8px}.botao{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;border-radius:999px;border:1px solid var(--linha);color:var(--texto);text-decoration:none;font-weight:600;transition:border-color .2s,background .2s,transform .15s}.botao:hover{border-color:var(--acento);background:rgba(var(--azul),.1)}.botao.primario{background:var(--acento);color:var(--acento-texto);border-color:var(--acento)}.botao.primario:hover{filter:brightness(1.1);background:var(--acento)}
.orbita{position:relative;display:grid;place-items:center;aspect-ratio:1;max-width:460px;width:100%;margin:0 auto}.orbita img{width:44%;border-radius:50%;position:relative;z-index:1;filter:drop-shadow(0 20px 40px rgba(var(--azul),.35))}
.anel{position:absolute;border:1px solid rgba(var(--azul),.35);border-radius:50%;inset:6% 0;animation:giro 26s linear infinite}.anel.b{inset:0 14%;border-color:rgba(var(--vermelho),.28);animation-duration:34s;animation-direction:reverse}.anel.c{inset:16% 4%;animation-duration:44s}
.anel::after{content:"";position:absolute;top:-4px;left:50%;width:8px;height:8px;border-radius:50%;background:var(--acento);box-shadow:0 0 14px var(--acento)}.anel.b::after{background:rgb(var(--vermelho));box-shadow:0 0 14px rgb(var(--vermelho))}
@keyframes giro{to{transform:rotate(360deg)}}
.grade2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:30px 48px;margin-top:8px}.grade2 h3{margin-top:0}.grade2 p{color:var(--suave);margin:4px 0 0}
.tela{margin:34px 0}.tela img{width:100%;height:auto;border-radius:16px;border:1px solid var(--linha);box-shadow:0 30px 80px -40px rgba(var(--azul),.6);display:block}.tela figcaption{color:var(--suave);font-size:14px;margin-top:10px}
.duas{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:26px}
.passos{counter-reset:p;list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:26px}.passos li{counter-increment:p;color:var(--suave)}.passos li::before{content:counter(p);display:block;font-size:2.2rem;font-weight:650;color:var(--acento);line-height:1;margin-bottom:6px}.passos strong{color:var(--texto);display:block}
.limite{border-left:3px solid var(--aviso);padding:4px 0 4px 16px;color:var(--suave)}
.hash{max-width:none;font-family:Consolas,"Cascadia Mono",monospace;font-size:13.5px;word-break:break-all;padding:12px 14px;border:1px solid var(--linha);border-radius:12px;background:color-mix(in srgb,var(--painel) 70%,transparent)}
pre{overflow:auto;padding:14px;border:1px solid var(--linha);border-radius:12px;background:color-mix(in srgb,var(--painel) 70%,transparent);font-size:13.5px}code{font-family:Consolas,"Cascadia Mono",monospace;font-size:.92em}
details{border-bottom:1px solid color-mix(in srgb,var(--linha) 70%,transparent);padding:12px 0}summary{cursor:pointer;font-weight:600}
article{max-width:78ch}article h1{font-size:2rem}article h2{margin-top:36px}.tabela{overflow:auto}table{border-collapse:collapse}td,th{padding:8px 12px;border-bottom:1px solid var(--linha);text-align:left;vertical-align:top}
.indice{list-style:none;padding:0;columns:2 280px;column-gap:40px}.indice li{padding:5px 0;break-inside:avoid}
.status{border-left:3px solid var(--linha);padding:2px 0 2px 14px;margin:14px 0}
footer{border-top:1px solid var(--linha);padding:28px 20px 48px;color:var(--suave);font-size:14px}
/* Demonstração interativa (sem JavaScript) */
.demo{border:1px solid var(--linha);border-radius:18px;background:color-mix(in srgb,var(--painel) 80%,transparent);overflow:hidden;box-shadow:0 30px 80px -44px rgba(var(--azul),.7)}
.demo input.aba{position:absolute;opacity:0;pointer-events:none}
.demo .abas{display:flex;gap:4px;padding:10px 12px;border-bottom:1px solid var(--linha);flex-wrap:wrap}.demo .abas label{padding:6px 16px;border-radius:999px;cursor:pointer;color:var(--suave);font-size:14px;transition:background .2s,color .2s}
.demo .painel{display:none;padding:22px 24px;animation:entra .3s ease both}@keyframes entra{from{opacity:0;transform:translateY(6px)}}
#d1:checked~.abas label[for=d1],#d2:checked~.abas label[for=d2],#d3:checked~.abas label[for=d3],#d4:checked~.abas label[for=d4]{background:var(--acento);color:var(--acento-texto)}
#d1:checked~.paineis .p1,#d2:checked~.paineis .p2,#d3:checked~.paineis .p3,#d4:checked~.paineis .p4{display:block}
.demo input:focus-visible+*,.demo input:focus-visible~.abas label{outline:2px solid var(--acento)}
.demo table{width:100%;font-size:14.5px}.tipo{display:inline-block;font-size:11.5px;font-weight:600;padding:1px 10px;border-radius:999px;border:1px solid var(--c,var(--linha));color:var(--c,var(--suave))}.t-smoke{--c:#9aa8c2}.t-funcional{--c:#34d3b0}.t-regressao{--c:#f0b84a}.t-unitario{--c:#6ea8ff}.t-integracao{--c:#a78bfa}
.filtros{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}.filtros label{padding:3px 14px;border:1px solid var(--linha);border-radius:999px;cursor:pointer;font-size:13px;color:var(--suave)}.filtros input{position:absolute;opacity:0}
#f-todos:checked~.filtros label[for=f-todos],#f-smoke:checked~.filtros label[for=f-smoke],#f-reg:checked~.filtros label[for=f-reg]{border-color:var(--acento);color:var(--texto);background:rgba(var(--azul),.12)}
#f-smoke:checked~table tr.t-r,#f-reg:checked~table tr.t-s{display:none}
.revisao label{display:flex;gap:10px;align-items:center;padding:4px 0;cursor:pointer}.revisao .pronto,.revisao .falta{margin-top:12px;padding:10px 14px;border-radius:12px;font-size:14.5px}.revisao .pronto{display:none;border:1px solid var(--ok);color:var(--ok)}.revisao .falta{border:1px solid var(--linha);color:var(--suave)}
.revisao:has(#c1:checked):has(#c2:checked):has(#c3:checked):has(#c4:checked) .pronto{display:block}.revisao:has(#c1:checked):has(#c2:checked):has(#c3:checked):has(#c4:checked) .falta{display:none}
.run input{position:absolute;opacity:0}.run label.bt{display:inline-block;padding:8px 20px;border-radius:999px;border:1px solid var(--linha);cursor:pointer;margin:0 8px 8px 0;font-weight:600}.run label.bt:hover{border-color:var(--acento)}
.run .res,.run .pub{display:none;margin-top:12px}#r-exec:checked~.res{display:block}#r-pub:checked~.pub{display:block}#r-exec:checked~label[for=r-exec]{background:var(--acento);color:var(--acento-texto)}
.ok{color:var(--ok);font-weight:600}.fail{color:var(--falha);font-weight:600}
.politica input{position:absolute;opacity:0}.politica label.chave{display:flex;align-items:center;gap:12px;cursor:pointer;padding:6px 0}.politica .trilho{width:42px;height:24px;border-radius:99px;background:color-mix(in srgb,var(--linha) 90%,transparent);position:relative;transition:background .2s}.politica .trilho::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--texto);transition:transform .2s}
#pol:checked~label .trilho{background:var(--falha)}#pol:checked~label .trilho::after{transform:translateX(18px)}.politica .perm,.politica .bloq{margin-top:10px;padding:10px 14px;border-radius:12px;border:1px solid var(--linha);font-size:14.5px}.politica .bloq{display:none;border-color:var(--falha)}#pol:checked~.perm{display:none}#pol:checked~.bloq{display:block}
@media (max-width:820px){.hero{grid-template-columns:1fr;min-height:0}.orbita{max-width:300px;order:-1}nav{margin-left:0}}
@media (prefers-reduced-motion:reduce){.anel,.demo .painel{animation:none}html{scroll-behavior:auto}}`;

const nomesTela={'inicio':'Início com o assistente local','catalogo':'Catálogo de testes por feature, com tipo e confiança','tickets':'Busca de tickets do Jira','execucoes-plano':'Plano e execução','metricas':'Métricas por módulos','agentes':'Agentes e permissões','inicio-claro':'Tema claro'};

export function gerarSite(out=path.join(repo,'site/public')) {
  fs.mkdirSync(out,{recursive:true});
  const pkg=JSON.parse(fs.readFileSync(path.join(repo,'package.json'),'utf8'));
  const versions=JSON.parse(fs.readFileSync(path.join(repo,'app/versoes.json'),'utf8')).versions;
  const published=versions.find(v=>v.status==='publicada');if(!published)throw new Error('Sem release oficial registrada');
  const docs=fontes.map(f=>{const body=fs.readFileSync(path.join(repo,f),'utf8').replaceAll('{{VERSAO}}',pkg.version).replace(/C:\\Users\\[^\\\s]+/g,'C:\\Users\\[perfil]');return {f,body,title:/^# (.+)$/m.exec(body)?.[1]??f};});
  const menu=[['index.html','Início'],['demo.html','Demonstração'],['tutoriais.html','Tutoriais'],['documentacao.html','Documentação'],['versoes.html','Download'],['suporte.html','Suporte']];
  const page=(arquivo,title,body)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Prumo QA: testes, tickets, runs e evidências do Jira, Qase e GitHub num só app para Windows."><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>${esc(title)} · Prumo QA</title><link rel="icon" href="prumo.png"><link rel="stylesheet" href="estilo.css"></head><body><a class="pular" href="#conteudo">Pular para o conteúdo</a><header class="topo"><a class="marca" href="index.html"><img src="prumo.png" alt="">Prumo QA</a><nav aria-label="Principal">${menu.map(([h,t])=>`<a href="${h}"${h===arquivo?' aria-current="page"':''}>${t}</a>`).join('')}</nav></header><main id="conteudo" tabindex="-1">${body}</main><footer>App local para Windows. Este site só informa: não lê arquivos nem executa testes. <a href="documentacao-seguranca.html">Segurança</a> · <a href="documentacao-11-privacidade.html">Privacidade</a> · <a href="${repoUrl}">Repositório oficial</a></footer></body></html>`;
  const write=(n,title,body)=>fs.writeFileSync(path.join(out,n),page(n,title,body));
  const imagens=fs.existsSync(path.join(repo,'site/imagens'))?fs.readdirSync(path.join(repo,'site/imagens')).filter(n=>n.endsWith('.png')):[];
  for(const n of imagens)fs.copyFileSync(path.join(repo,'site/imagens',n),path.join(out,'captura-'+n));
  const tela=(id,alt)=>imagens.includes(id+'.png')?`<figure class="tela"><img src="captura-${id}.png" alt="${esc(alt)}" width="1280" height="800" loading="lazy"><figcaption>${esc(nomesTela[id]||alt)}</figcaption></figure>`:'';

  write('index.html','Do ticket à evidência',`<section class="hero"><div><span class="etiqueta">APP PARA WINDOWS · QUALIDADE DE SOFTWARE</span><h1>Do ticket à evidência.</h1><p class="lead">Testes, tickets, runs e relatórios do Jira, Qase e GitHub num só lugar. Você decide o que sai do seu computador.</p><div class="acoes"><a class="botao primario" href="versoes.html">Baixar a versão ${esc(published.version)}</a><a class="botao" href="demo.html">Ver a demonstração</a></div><p class="suave">Gratuito · dados locais · funciona sem IA</p></div><div class="orbita" aria-hidden="true"><span class="anel"></span><span class="anel b"></span><span class="anel c"></span><img src="prumo.png" alt=""></div></section>
  <section><h2>O que o Prumo faz</h2><div class="grade2"><div><h3>Entende os testes do código</h3><p>Lê o repositório, agrupa por feature e classifica cada teste: unitário, integração, funcional, regressão, smoke.</p></div><div><h3>Conversa com Jira, Qase e GitHub</h3><p>Busca tickets, monta planos e execuções, publica resultados e abre Pull Requests, com prévia e a sua confirmação.</p></div><div><h3>Roda e agenda</h3><p>Executa automações declaradas e repete na agenda, na bandeja do Windows, mesmo com a janela fechada.</p></div><div><h3>Rastreia tudo</h3><p>Do ticket ao caso, da run à evidência. Cada ligação mostra de onde veio.</p></div><div><h3>Limita a IA</h3><p>Claude e Codex só propõem rascunhos. Cada permissão é conferida a cada chamada.</p></div><div><h3>Mostra as métricas que você escolher</h3><p>Módulos, números, barras ou rosca. Sem porcentagem inventada de qualidade.</p></div></div></section>
  <section><h2>Por dentro</h2>${tela('inicio','Tela inicial do Prumo QA com a esfera, o assistente e o menu lateral')}${tela('catalogo','Catálogo de testes agrupado por feature com tipo e confiança')}<div class="duas">${tela('tickets','Busca de tickets do Jira com filtros')}${tela('metricas','Métricas com módulos escolhíveis')}</div></section>
  <section><h2>Como funciona</h2><ol class="passos"><li><strong>Vincule</strong>a pasta do repositório e as contas</li><li><strong>Entenda</strong>o catálogo e os vínculos</li><li><strong>Execute</strong>com a sua autenticação do Windows</li><li><strong>Publique</strong>o resultado, conferido no serviço</li></ol></section>
  <section><h2>Seguro por padrão</h2><div class="grade2"><div><h3>Escrita desligada</h3><p>Nada é criado em serviço externo até você habilitar, por projeto.</p></div><div><h3>Sempre com prévia</h3><p>Cada operação pede confirmação do Windows e não duplica se repetir.</p></div><div><h3>Credenciais protegidas</h3><p>Ficam cifradas pelo Windows e nunca chegam à IA.</p></div></div><p class="limite">O instalador não é assinado. Confira o SHA-256 na página de download. As escritas foram validadas com serviços simulados; contas reais ainda não foram exercitadas.</p></section>`);

  write('demo.html','Demonstração',`<h1>Demonstração</h1><p class="suave">Dados fictícios. Nada é enviado: esta página não usa rede nem JavaScript.</p>
  <div class="demo"><input class="aba" type="radio" name="aba" id="d1" checked><input class="aba" type="radio" name="aba" id="d2"><input class="aba" type="radio" name="aba" id="d3"><input class="aba" type="radio" name="aba" id="d4">
  <div class="abas"><label for="d1">Catálogo</label><label for="d2">Revisão</label><label for="d3">Execução</label><label for="d4">Agentes</label></div>
  <div class="paineis">
  <div class="painel p1"><input class="aba" type="radio" name="f" id="f-todos" checked><input class="aba" type="radio" name="f" id="f-smoke"><input class="aba" type="radio" name="f" id="f-reg"><div class="filtros"><label for="f-todos">Todos · 4</label><label for="f-smoke">Smoke · 1</label><label for="f-reg">Regressão · 1</label></div>
    <table><tbody><tr class="t-s"><td>Checkout</td><td>paga com cartão</td><td><span class="tipo t-smoke">Smoke</span></td></tr><tr class="t-r"><td>Checkout</td><td>recusa cartão vencido</td><td><span class="tipo t-regressao">Regressão</span></td></tr><tr><td>Login</td><td>entra com senha válida</td><td><span class="tipo t-funcional">Funcional</span></td></tr><tr><td>Preço</td><td>aplica desconto progressivo</td><td><span class="tipo t-unitario">Unitário</span></td></tr></tbody></table>
    <p class="suave">Tipo inferido por tag, caminho e conteúdo. Cada teste mostra o motivo e a confiança.</p></div>
  <div class="painel p2 revisao"><h3>Proposta: “Login rejeita senha incorreta”</h3><label><input id="c1" type="checkbox"> Conferi duplicidade</label><label><input id="c2" type="checkbox"> O requisito está coberto</label><label><input id="c3" type="checkbox"> Avaliei o risco</label><label><input id="c4" type="checkbox"> Avaliei a cobertura</label><div class="falta">Marque as quatro revisões para publicar.</div><div class="pronto">Pronto. O Windows pedirá a sua confirmação antes de publicar no Qase.</div></div>
  <div class="painel p3 run"><h3>Regressão da sprint 42</h3><input type="checkbox" id="r-exec"><input type="checkbox" id="r-pub"><label class="bt" for="r-exec">Executar automações</label><div class="res"><table><tbody><tr><td>Caso 31 · paga com cartão</td><td class="ok">PASS</td></tr><tr><td>Caso 32 · recusa cartão vencido</td><td class="fail">FAIL</td></tr><tr><td>Caso 33 · cupom expirado</td><td>NOT_RUN</td></tr></tbody></table><label class="bt" for="r-pub">Publicar no Qase</label></div><div class="pub"><p class="ok">2 resultados publicados e conferidos na run. NOT_RUN nunca é enviado.</p></div></div>
  <div class="painel p4 politica"><h3>Permissões da IA</h3><input type="checkbox" id="pol"><label class="chave" for="pol"><span class="trilho"></span> Bloquear “Propor bugs”</label><div class="perm"><strong class="ok">PERMITIDO</strong> · a IA pode criar um rascunho local de bug.</div><div class="bloq"><strong class="fail">BLOQUEADO</strong> · a chamada é recusada com POLICY_BLOCKED.</div></div>
  </div></div>`);

  const passos=(l)=>`<ol>${l.map(x=>`<li>${x}</li>`).join('')}</ol>`;
  write('tutoriais.html','Tutoriais',`<h1>Tutoriais</h1><p class="suave">Cada passo existe no aplicativo. Os guias completos estão na <a href="documentacao.html">documentação</a>.</p>
  <article id="catalogo"><h2>Entender os testes do repositório</h2>${passos(['Em <strong>Projetos</strong>, crie um projeto e use <strong>Vincular pasta de automação</strong>.','Abra <strong>Testes › Catálogo</strong>.','Filtre por tipo ou busque uma feature. Passe o mouse no tipo para ver o motivo e a confiança.'])}</article>
  <article id="conectar"><h2>Conectar Jira, Qase e GitHub</h2>${passos(['Em <strong>Conexões</strong>, configure a conta: o token fica cifrado pelo Windows.','Liste os recursos e vincule ao projeto.','Se quiser criar ou atualizar itens, habilite a <strong>escrita</strong> do serviço. Ela nasce desligada.'])}</article>
  <article id="run"><h2>Montar uma execução e publicar no Qase</h2>${passos(['Em <strong>Testes › Planos e execuções</strong>, marque os cenários e prepare a execução.','Crie a run no Qase e use <strong>Executar automações</strong>. Cada uma pede a sua autenticação do Windows.','<strong>Publicar resultados</strong>: o Prumo confere a run no Qase depois de enviar.'])}</article>
  <article id="agenda"><h2>Repetir sozinho</h2>${passos(['Em <strong>Agendamentos</strong>, crie uma rotina “Run do Qase”.','Aprove a política de publicação para a run (validade e número de usos).','Feche a janela: o Prumo continua na bandeja do Windows.'])}</article>
  <article id="agentes"><h2>Limitar o que a IA pode pedir</h2>${passos(['Em <strong>Agentes</strong>, escolha as especializações do projeto.','Bloqueie as capacidades que não quer expor.','A IA só propõe rascunhos; você revisa e publica.'])}</article>`);

  write('documentacao.html','Documentação',`<h1>Documentação</h1><p class="suave">Gerada dos mesmos documentos de ajuda e contratos usados pelo aplicativo.</p><ul class="indice">${docs.map(d=>`<li><a href="${nome(d.f)}">${esc(d.title)}</a></li>`).join('')}</ul>`);

  const lista=(title,arr)=>arr.length?`<h3>${title}</h3><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
  const inst=published.installer;
  write('versoes.html','Versões e download',`<h1>Versões e download</h1><p>Última versão publicada registrada: <strong>${esc(published.version)}</strong>. Confira a página oficial antes de baixar.</p>
  <div class="acoes"><a class="botao primario" href="${esc(published.releaseUrl)}">Abrir release oficial ${esc(published.version)}</a><a class="botao" href="documentacao-03-instalar.html">Como instalar</a></div>
  ${inst?`<h2>Confira o arquivo</h2><p>Instalador <code>${esc(inst.file)}</code> · SHA-256:</p><p class="hash">${esc(inst.sha256)}</p><p class="suave">No PowerShell: <code>Get-FileHash .\\${esc(inst.file)} -Algorithm SHA256</code>. O resultado deve ser igual ao valor acima e ao arquivo <code>${esc(inst.file)}.sha256</code> da release.</p>`:`<p class="suave">O SHA-256 desta versão está no arquivo <code>.sha256</code> anexado à release.</p>`}
  <p class="limite">O instalador não é assinado. O SHA-256 detecta troca ou corrupção do arquivo; não prova a autoria. Não desative as proteções do Windows. Requisitos: Windows 10 ou 11 de 64 bits.</p>
  <h2>Histórico</h2>${versions.map(v=>`<details><summary>${esc(v.version)} · ${esc(v.title)} · ${esc(v.status==='publicada'?'publicada':v.status==='repositorio'?'código, sem release':'planejada')}</summary><p>${esc(v.objective)}</p>${lista('Funcionalidades',v.features)}${lista('Correções',v.fixes)}${lista('Compatibilidade',v.compatibility)}${lista('Limitações',v.limitations)}<p>${esc(v.migration)}</p>${v.status==='publicada'?`<p><a href="${esc(v.releaseUrl)}">Release oficial</a></p>`:''}</details>`).join('')}`);

  const statuses=JSON.parse(fs.readFileSync(path.join(repo,'app/suporte-status.json'),'utf8'));
  write('suporte.html','Suporte',`<h1>Suporte pelo GitHub</h1><p>Prepare e revise o relato no aplicativo, exporte em Markdown ou abra o formulário oficial. O aplicativo não publica a issue por você.</p><p class="limite">Issues são públicas. Não inclua senhas, tokens, código privado ou dados pessoais. Não há e-mail de suporte.</p><div class="acoes"><a class="botao" href="${repoUrl}/issues/new?template=bug.yml">Relatar bug</a><a class="botao" href="${repoUrl}/issues/new?template=melhoria.yml">Pedir melhoria</a><a class="botao" href="${repoUrl}/issues/new?template=sugestao.yml">Enviar sugestão</a></div><h2>Acompanhe seu chamado</h2><p>O número é emitido pelo GitHub. Respostas e resolução ficam nos comentários.</p>${statuses.map(s=>`<div class="status"><h3>${esc(s.nome)}</h3><p>${esc(s.explicacao)}</p></div>`).join('')}<p><a href="${repoUrl}/issues">Consultar chamados oficiais</a> · <a href="documentacao-suporte.html">Como funciona o suporte</a></p>`);

  for(const d of docs)write(nome(d.f),d.title,`<article>${markdown(d.body,d.f)}</article>`);
  fs.writeFileSync(path.join(out,'estilo.css'),css);fs.copyFileSync(path.join(repo,'assets/prumo-icon.png'),path.join(out,'prumo.png'));
  return {pages:docs.length+6,output:out,version:pkg.version,published:published.version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(gerarSite(),null,2));
