import fs from 'node:fs';
import { pagina } from './componentes/pagina.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fontes=[...fs.readdirSync(path.join(repo,'docs/ajuda')).filter(n=>n.endsWith('.md')).map(n=>'docs/ajuda/'+n),'docs/CICLO-QUALIDADE.md','docs/SEGURANCA.md','docs/SUPORTE.md','docs/ASSINATURA.md','docs/CONTRATOS.md','docs/SERVICOS.md','docs/AGENDAMENTOS.md'];
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
const css=fs.readFileSync(new URL('./estilos/base.css',import.meta.url),'utf8');

// Órbitas do agente com os MESMOS parâmetros do aplicativo (frontend/inicio/identidade/orbitas.js), lidos da fonte única.
// O app desenha em canvas com JavaScript; o site não usa script, então vira SVG e os arcos giram por CSS
// (stroke-dashoffset). Sem a flexão das curvas, que depende de JavaScript.
function orbitasDoApp() {
  const fonte=fs.readFileSync(path.join(repo,'frontend/inicio/identidade/orbitas.js'),'utf8');
  const m=/const orbitas = (\[[\s\S]*?\]);/.exec(fonte);if(!m)throw new Error('Parâmetros das órbitas não encontrados em orbitas.js');
  const json=m[1].replace(/([{,]\s*)([a-zA-Z]+):/g,'$1"$2":').replace(/(:\s*)(-?)\./g,'$1$20.');
  return JSON.parse(json);
}
function orbitasSvg() {
  const W=620,H=362,cx=W/2,cy=H/2,r=n=>Math.round(n*100)/100,TAU=Math.PI*2;
  const nomeCor=c=>c[0]>235&&c[1]>230?'branco':c[0]>c[2]?'vermelho':'azul';
  const regras=[],grupos=[];
  orbitasDoApp().forEach((o,i)=>{
    const rx=r(W*o.rx),ry=r(H*o.ry),giro=r(o.tilt*180/Math.PI),dur=r(TAU/Math.abs(o.speed)/1000),sentido=o.speed>0?-100:100;
    const elipse=(cls,extra='')=>`<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${extra}/>`;
    const arcos=[[o.colorA,o.lenA,o.phase,o.alpha,o.width+.55],[o.colorB,o.lenB,o.phase+Math.PI,o.alpha*.78,o.width+.2],[o.colorA,.07,o.phase+i*.85,.88,o.width+.85]];
    const partes=[elipse(`trilha c-${nomeCor(o.colorA)}`,` stroke-opacity="${o.trackAlpha}" stroke-width="${r(o.width*2)}"${o.dotted?' stroke-dasharray="8 10"':''}`)];
    arcos.forEach(([cor,len,fase,alfa,larg],k)=>{
      const id=`a${i}${k}`,d=r(-fase/TAU*100%100),l=r(len*100);
      regras.push(`.${id}{stroke-dasharray:${l} ${r(100-l)};animation:${id} ${dur}s linear infinite}@keyframes ${id}{from{stroke-dashoffset:${d}}to{stroke-dashoffset:${r(d+sentido)}}}`);
      partes.push(elipse(`${id} c-${nomeCor(cor)}`,` pathLength="100" stroke-opacity="${r(alfa)}" stroke-width="${r(larg*2)}"`));
    });
    // Partículas: no app, a órbita i leva as partículas de cor i (vermelho, azul, branco), um pouco mais rápidas que o arco.
    const corP=['vermelho','azul','branco'][i%3],velP=o.speed+.000135,durP=r(TAU/Math.abs(velP)/1000);
    regras.push(`.p${i}{stroke-dasharray:0 10;animation:p${i} ${durP}s linear infinite}@keyframes p${i}{from{stroke-dashoffset:0}to{stroke-dashoffset:${velP>0?-100:100}}}`);
    partes.push(elipse(`p${i} c-${corP}`,` pathLength="100" stroke-opacity=".42" stroke-width="2.6"`));
    grupos.push(`<g transform="rotate(${giro} ${cx} ${cy})">${partes.join('')}</g>`);
  });
  return {svg:`<svg class="orbitas" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${grupos.join('')}</svg>`,css:regras.join('\n')};
}

const nomesTela={'inicio':'Início: o Orchestrator e o chat local','testes':'Testes › Repositório: Qase e código numa lista','codigo':'Testes › IDE: o teste e o caso do Qase ligado','tickets':'Tickets: Jira e defeitos do Qase','runs':'Testes › Runs: do Prumo e do Qase','agentes':'Agentes: Orchestrator, clientes MCP e especializações','inicio-claro':'Tema claro'};

export function gerarSite(out=path.join(repo,'site/public')) {
  fs.mkdirSync(out,{recursive:true});const orb=orbitasSvg();
  const pkg=JSON.parse(fs.readFileSync(path.join(repo,'package.json'),'utf8'));
  const versions=JSON.parse(fs.readFileSync(path.join(repo,'docs/catalogo/versoes.json'),'utf8')).versions;
  const published=versions.find(v=>v.status==='publicada');if(!published)throw new Error('Sem release oficial registrada');
  const docs=fontes.map(f=>{const body=fs.readFileSync(path.join(repo,f),'utf8').replaceAll('{{VERSAO}}',pkg.version).replace(/C:\\Users\\[^\\\s]+/g,'C:\\Users\\[perfil]');return {f,body,title:/^# (.+)$/m.exec(body)?.[1]??f};});
  const menu=[['index.html','Início'],['demo.html','Demonstração'],['tutoriais.html','Tutoriais'],['documentacao.html','Documentação'],['versoes.html','Download'],['suporte.html','Suporte']];
  const page=(arquivo,title,body)=>pagina({arquivo,title,body,menu,repoUrl,esc});
  const write=(n,title,body)=>fs.writeFileSync(path.join(out,n),page(n,title,body));
  const imagens=fs.existsSync(path.join(repo,'site/imagens'))?fs.readdirSync(path.join(repo,'site/imagens')).filter(n=>n.endsWith('.png')):[];
  for(const n of imagens)fs.copyFileSync(path.join(repo,'site/imagens',n),path.join(out,'captura-'+n));
  const tela=(id,alt)=>imagens.includes(id+'.png')?`<figure class="tela"><img src="captura-${id}.png" alt="${esc(alt)}" width="1280" height="800" loading="lazy"><figcaption>${esc(nomesTela[id]||alt)}</figcaption></figure>`:'';

  write('index.html','Do ticket à evidência',`<section class="hero"><div><span class="etiqueta">WINDOWS, MACOS E LINUX · QUALIDADE DE SOFTWARE</span><h1>Do ticket à evidência.</h1><p class="lead">O Prumo reúne testes, tickets, execuções e relatórios do Jira, Qase e GitHub. As conexões podem consultar esses serviços; para enviar alterações, você precisa habilitar a escrita e confirmar cada operação.</p><div class="acoes"><a class="botao primario" href="versoes.html">Baixar a versão ${esc(published.version)}</a><a class="botao" href="demo.html">Ver a demonstração</a></div><p class="suave">Dados no computador · IA opcional</p></div><div class="orbita" role="img" aria-label="Prumo Orchestrator: a esfera do assistente com as três órbitas, igual ao aplicativo">${orb.svg}<span class="orbe"><img src="agente.png" alt="" width="290" height="290"></span></div></section>
  <section><h2>O que o Prumo faz</h2><div class="grade2"><div><h3>Liga o Qase ao código</h3><p>Casos do Qase e testes do código numa lista só. A ligação vem de anotação no código ou de vínculo declarado, nunca de nome parecido.</p></div><div><h3>Fala com Jira, Qase e GitHub</h3><p>Importa projetos do Qase, lê tickets e issues, monta runs, publica resultados e bugs e abre Pull Request em rascunho.</p></div><div><h3>Roda, agenda e mede</h3><p>Executa as automações declaradas, repete na agenda e mostra métricas.</p></div><div><h3>Mostra de onde veio</h3><p>Cada ligação entre ticket, caso, código e evidência diz a origem.</p></div><div><h3>Aprende só o que você aprova</h3><p>Responde com os dados deste computador, sem modelo de IA. Claude Code ou Codex, só se você autorizar.</p></div><div><h3>Limita a IA</h3><p>Por MCP, a IA lê o contexto liberado e propõe rascunhos. Executar teste exige a sua autorização.</p></div></div></section>
  <section><h2>Por dentro</h2>${tela('inicio','Tela inicial do Prumo QA com o Prumo Orchestrator, as três órbitas e o chat')}<div class="duas">${tela('testes','Testes › Repositório com casos do Qase e testes do código')}${tela('codigo','Testes › IDE: editor com o teste aberto e o caso do Qase ligado')}</div><div class="duas">${tela('tickets','Tabela com tickets do Jira e defeitos do Qase')}</div>${tela('agentes','Tela de Agentes com o Orchestrator, Codex, Claude Code e as especializações')}</section>
  <section><h2>Como funciona</h2><ol class="passos"><li><strong>Vincule</strong>o repositório e as contas</li><li><strong>Entenda</strong>os testes e os vínculos</li><li><strong>Execute</strong>com a confirmação do seu sistema</li><li><strong>Publique</strong>o resultado, conferido no serviço</li></ol></section>
  <section><h2>Seguro por padrão</h2><div class="grade2"><div><h3>Escrita desligada</h3><p>Até você habilitar, por projeto e serviço, nada é criado fora daqui.</p></div><div><h3>Prévia e confirmação</h3><p>Cada envio pede confirmação do sistema, não duplica e não apaga nada.</p></div><div><h3>Credenciais protegidas</h3><p>Tokens ficam no cofre do sistema quando há suporte.</p></div></div><p class="limite">As integrações foram testadas com contas reais, mas cada conta tem plano e permissões próprios. O instalador não é assinado: confira o SHA-256.</p></section>`);

  write('demo.html','Demonstração',`<h1>Demonstração</h1><p class="suave">Montei esta prévia com dados fictícios, sem rede nem JavaScript.</p>
  <div class="demo"><input class="aba" type="radio" name="aba" id="d1" checked><input class="aba" type="radio" name="aba" id="d2"><input class="aba" type="radio" name="aba" id="d3"><input class="aba" type="radio" name="aba" id="d4">
  <div class="abas"><label for="d1">Repositório</label><label for="d2">Revisão</label><label for="d3">Execução</label><label for="d4">Agentes</label></div>
  <div class="paineis">
  <div class="painel p1"><input class="aba" type="radio" name="f" id="f-todos" checked><input class="aba" type="radio" name="f" id="f-smoke"><input class="aba" type="radio" name="f" id="f-reg"><div class="filtros"><label for="f-todos">Todos · 4</label><label for="f-smoke">Smoke · 1</label><label for="f-reg">Regressão · 1</label></div>
    <table><tbody><tr class="t-s"><td>Checkout</td><td>paga com cartão</td><td><span class="tipo t-smoke">Smoke</span></td></tr><tr class="t-r"><td>Checkout</td><td>recusa cartão vencido</td><td><span class="tipo t-regressao">Regressão</span></td></tr><tr><td>Login</td><td>entra com senha válida</td><td><span class="tipo t-funcional">Funcional</span></td></tr><tr><td>Preço</td><td>aplica desconto progressivo</td><td><span class="tipo t-unitario">Unitário</span></td></tr></tbody></table>
    <p class="suave">Nível inferido por tag, caminho e conteúdo, com motivo e confiança.</p></div>
  <div class="painel p2 revisao"><h3>Proposta: “Login rejeita senha incorreta”</h3><label><input id="c1" type="checkbox"> Conferi duplicidade</label><label><input id="c2" type="checkbox"> O requisito está informado e coberto</label><label><input id="c3" type="checkbox"> Avaliei o risco</label><label><input id="c4" type="checkbox"> Avaliei a cobertura</label><div class="falta">Marque as quatro revisões para publicar.</div><div class="pronto">Pronto. Antes de publicar no Qase, o sistema pede a sua confirmação.</div></div>
  <div class="painel p3 run"><h3>Regressão da sprint 42</h3><input type="checkbox" id="r-exec"><input type="checkbox" id="r-pub"><label class="bt" for="r-exec">Executar automações…</label><div class="res"><table><tbody><tr><td>Caso 31 · paga com cartão</td><td class="ok">PASS</td></tr><tr><td>Caso 32 · recusa cartão vencido</td><td class="fail">FAIL</td></tr><tr><td>Caso 33 · cupom expirado</td><td>NOT_RUN</td></tr></tbody></table><label class="bt" for="r-pub">Publicar resultados…</label></div><div class="pub"><p class="ok">2 resultados publicados e conferidos na run. NOT_RUN nunca é enviado.</p></div></div>
  <div class="painel p4 politica"><h3>Permissões da IA</h3><input type="checkbox" id="pol"><label class="chave" for="pol"><span class="trilho"></span> Bloquear “Propor bugs (rascunho)”</label><div class="perm"><strong class="ok">PERMITIDO</strong> · a IA cria só um rascunho local de bug.</div><div class="bloq"><strong class="fail">BLOQUEADO</strong> · a chamada é recusada com POLICY_BLOCKED.</div></div>
  </div></div>`);

  const passos=(l)=>`<ol>${l.map(x=>`<li>${x}</li>`).join('')}</ol>`;
  write('tutoriais.html','Tutoriais',`<h1>Tutoriais</h1><p class="suave">Todo passo aqui existe no aplicativo. Os detalhes estão na <a href="documentacao.html">documentação</a>.</p>
  <article id="catalogo"><h2>Entender os testes do repositório</h2>${passos(['<strong>Projetos › Criar projeto manual</strong>, depois <strong>Vincular repositório local…</strong> ou <strong>Escolher repositório do GitHub…</strong>.','<strong>Testes › Repositório</strong>: casos do Qase e testes do código, com situação, nível e tags.','<strong>Testes › IDE</strong>: o arquivo, com nível e motivo de cada teste.'])}</article>
  <article id="ligar"><h2>Ligar um caso do Qase ao teste</h2>${passos(['Anote no teste: <code>qase(31, …)</code>, <code>@qase-31</code> ou <code>Qase: SFQ-31</code>.','<strong>Testes › Repositório › Atualizar</strong>: o caso vira “Caso com código”.'])}</article>
  <article id="conectar"><h2>Conectar Jira, Qase e GitHub</h2>${passos(['<strong>Conexões › Conectar</strong>, na linha do serviço. O formulário diz as permissões do token.','No Qase, escolha os projetos e <strong>Adicionar ao Prumo</strong>. Projeto existente: <strong>Listar recursos disponíveis</strong>.','Para publicar: <strong>Habilitar escrita…</strong>, por projeto e serviço.'])}</article>
  <article id="destino"><h2>Mandar um bug para o lugar certo</h2>${passos(['<strong>Tickets › Novo rascunho local</strong>.','<strong>Destino da publicação</strong>: local, Jira, Defeitos Qase ou GitHub Issues.','<strong>Confirmar destino…</strong>: o Prumo envia e confere no serviço.'])}</article>
  <article id="run"><h2>Montar uma run e publicar no Qase</h2>${passos(['<strong>Testes › Runs › Preparar run</strong> e escolha os casos.','Na run: <strong>Criar run no Qase…</strong>, <strong>Executar automações…</strong> e <strong>Publicar resultados…</strong>, cada um com confirmação do sistema.'])}${tela('runs','Lista de runs preparadas no Prumo e runs do Qase')}</article>
  <article id="agenda"><h2>Repetir sozinho</h2>${passos(['<strong>Agendamentos › Nova rotina</strong> do tipo <strong>Run do Qase</strong>.','Na aba <strong>Publicação</strong> da run, aprove a política. Sem ela, o resultado fica local.'])}</article>
  <article id="agentes"><h2>Limitar o que a IA pode pedir</h2>${passos(['Em <strong>Agentes</strong>, abra uma especialização.','Em <strong>Permissões</strong>, bloqueie o que quiser e salve.'])}</article>
  <article id="aprendizados"><h2>Aprovar o que o assistente aprendeu</h2>${passos(['Converse no <strong>Início</strong> ou no chat flutuante.','Aprove ou descarte os rascunhos no chat ou no <strong>Cérebro</strong> do agente.'])}</article>
  <article id="painel"><h2>Acompanhar os agentes ao vivo</h2>${passos(['<strong>Agentes › Painel de atividades › Ao vivo</strong>.','Arraste para mover, Ctrl + roda para aproximar.'])}</article>`);

  write('documentacao.html','Documentação',`<h1>Documentação</h1><p class="suave">Os mesmos textos da Ajuda do aplicativo, mais os documentos de segurança, contratos e serviços do projeto.</p><ul class="indice">${docs.map(d=>`<li><a href="${nome(d.f)}">${esc(d.title)}</a></li>`).join('')}</ul>`);

  const lista=(title,arr)=>arr.length?`<h3>${title}</h3><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
  const inst=published.installer;
  const download=inst?`${repoUrl}/releases/download/v${published.version}/${encodeURIComponent(inst.file)}`:null;
  // Render: o build traz os instaladores conferidos para site/public/download (site/baixar-instalador.mjs); fora dele o botão aponta para a release.
  const hospedado=process.env.PRUMO_SITE_HOSPEDA_INSTALADOR==='1';
  const lista_=path.join(out,'download','instaladores.json');
  const entregues=hospedado&&fs.existsSync(lista_)?JSON.parse(fs.readFileSync(lista_,'utf8')).instaladores:[];
  const marcas={
    windows:['marca-windows','<svg viewBox="0 0 32 32" focusable="false"><path d="M2 5.4 14 3.7v11.1H2V5.4Zm14-2 14-2v13.4H16V3.4ZM2 16.8h12v11.1L2 26.2V16.8Zm14 0h14v13.4l-14-2V16.8Z"/></svg>'],
    macos:['marca-apple','<svg viewBox="0 0 32 32" focusable="false"><path d="M22.7 17.1c0-3.1 2.5-4.6 2.6-4.7a5.7 5.7 0 0 0-4.5-2.4c-1.9-.2-3.7 1.1-4.7 1.1s-2.5-1.1-4.1-1.1a6.1 6.1 0 0 0-5.1 3.1c-2.2 3.8-.6 9.4 1.5 12.5 1 1.5 2.2 3.2 3.7 3.1 1.5-.1 2.1-1 4-1s2.5 1 4 1 2.6-1.5 3.6-3.1a13.7 13.7 0 0 0 1.6-3.3 5.2 5.2 0 0 1-2.6-5.2ZM19.6 8a5.5 5.5 0 0 0 1.3-4 5.7 5.7 0 0 0-3.7 1.9 5.1 5.1 0 0 0-1.3 3.9 4.8 4.8 0 0 0 3.7-1.8Z"/></svg>'],
    linux:['marca-linux','<svg viewBox="0 0 32 32" focusable="false"><path d="M16 2c-5 0-7 4-7 9v5c-2 2-4 5-5 9-.4 2 1 3 3 2l5-3h8l5 3c2 1 3.4 0 3-2-1-4-3-7-5-9v-5c0-5-2-9-7-9Z"/><path class="pinguino-peito" d="M11 15c1-2 3-3 5-3s4 1 5 3v8H11v-8Z"/><path class="pinguino-olho" d="M12 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/><path class="pinguino-bico" d="m13 12 3-2 3 2-3 2-3-2Zm-3 14-3 2h6l1-2h-4Zm8 0 1 2h6l-3-2h-4Z"/></svg>']
  };
  const iconeMarca=sistema=>marcas[String(sistema).toLowerCase()]??['marca-generica','<svg viewBox="0 0 32 32" focusable="false"><path d="M7 3h12l7 7v19H7V3Zm12 1v7h7M11 17h10m-10 4h10m-10 4h7"/></svg>'];
  const detalhesInstalador=(sistema,item,arquivo)=>{
    const extensao=path.extname(arquivo).slice(1).toUpperCase();
    if(sistema==='Windows')return 'Windows 10 ou 11 · 64 bits';
    if(sistema==='macOS')return item.detalhe.replace(/\s*\(M1 ou mais novo\)/,'');
    if(extensao==='APPIMAGE')return 'Qualquer distribuição · 64 bits';
    if(extensao==='DEB')return 'Debian / Ubuntu · 64 bits';
    return item.detalhe;
  };
  const disponiveis=entregues.length
    ?entregues.map(i=>({...i,url:`download/${encodeURIComponent(i.arquivo)}`} ))
    :download?[{sistema:'Windows',detalhe:'Windows 10/11 · 64 bits',arquivo:inst.file,url:download}]:[];
  const sistemas=[...new Set(disponiveis.map(i=>i.sistema))];
  const cartoes=sistemas.map((sistema,k)=>{
    const [marca,svg]=iconeMarca(sistema);
    const opcoes=disponiveis.filter(i=>i.sistema===sistema).map(i=>{
      const extensao=path.extname(i.arquivo).slice(1).toUpperCase()||'ARQUIVO';
      return `<div class="download-opcao"><span>${esc(detalhesInstalador(sistema,i,i.arquivo))}</span><span class="download-formato">${esc(extensao)}</span><a class="download-link" href="${esc(i.url)}" title="Baixar ${esc(i.arquivo)}" aria-label="Baixar ${esc(i.arquivo)}"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 2.5v10m-4-4 4 4 4-4M3.5 14v3h13v-3"/></svg></a></div>`;
    }).join('');
    return `<article class="download-cartao${k===0?' destaque':''}"><header class="download-cabecalho"><span class="download-icone ${marca}" aria-hidden="true">${svg}</span><h3>${esc(sistema)}</h3></header><div class="download-opcoes">${opcoes}</div></article>`;
  }).join('');
  const hashes=entregues.length>1?`<div class="tabela"><table><tbody>${entregues.map(i=>`<tr><td><code>${esc(i.arquivo)}</code></td><td class="hash">${esc(i.sha256)}</td></tr>`).join('')}</tbody></table></div>`:'';
  const conferir=inst
    ?`<details><summary>Conferir se o arquivo está correto</summary><p>Compare o código abaixo com o arquivo <code>${esc(inst.file)}.sha256</code> da versão no GitHub.</p>${hashes||`<p class="hash">${esc(inst.sha256)}</p>`}<p>No PowerShell, use: <code>Get-FileHash .\\${esc(inst.file)} -Algorithm SHA256</code>.</p><p class="suave">O instalador do Windows não tem assinatura digital. Essa conferência ajuda a identificar alterações, mas não confirma quem criou o arquivo.</p></details>`
    :`<details><summary>Conferir os arquivos</summary><p>Os códigos de conferência estão nos arquivos <code>.sha256</code> da versão no GitHub.</p>${hashes}</details>`;
  const outrosSistemas=`<details><summary>Instruções para macOS e Linux</summary><ul><li><strong>macOS:</strong> abra o arquivo .dmg e arraste o Prumo QA para Aplicativos. Na primeira vez, clique com o botão direito no app e escolha <strong>Abrir</strong>.</li><li><strong>Linux:</strong> no AppImage, permita a execução e abra o arquivo. No Debian ou Ubuntu, instale o arquivo .deb. Para credenciais e aprovações, podem ser necessários <code>gnome-keyring</code>, <code>policykit-1</code> e <code>zenity</code>.</li></ul></details>`;
  write('versoes.html','Versões e download',`<h1>Versões e download</h1><p>Baixe a versão <strong>${esc(published.version)}</strong> do Prumo QA.</p>
  <div class="acoes"><a class="botao" href="${esc(published.releaseUrl)}">Ver release oficial</a><a class="botao" href="documentacao-03-instalar.html">Como instalar</a></div>
  <h2>Escolha seu sistema</h2><div class="download-grade">${cartoes}</div>
  ${conferir}
  <p class="suave">Confira os requisitos do macOS em <a href="documentacao-03-instalar.html">Como instalar</a>.</p>
  ${outrosSistemas}
  <details><summary>Se o Windows mostrar um aviso</summary><p>O instalador não tem assinatura digital. Confira o SHA-256 antes de abrir. Se o SmartScreen avisar, escolha <strong>Mais informações</strong> e depois <strong>Executar assim mesmo</strong>.</p><p>Se o arquivo estiver bloqueado, clique nele com o botão direito, abra <strong>Propriedades</strong> e marque <strong>Desbloquear</strong>. Não desative o Smart App Control.</p></details>
  <p class="suave">A instalação é por usuário e mantém seus dados ao atualizar.</p>
  <h2>Histórico</h2>${versions.map(v=>`<details><summary>${esc(v.version)} · ${esc(v.title)} · ${esc(v.status==='publicada'?'publicada':v.status==='repositorio'?'código, sem release':'planejada')}</summary><p>${esc(v.objective)}</p>${lista('Funcionalidades',v.features)}${lista('Correções',v.fixes)}${lista('Compatibilidade',v.compatibility)}${lista('Limitações',v.limitations)}<p>${esc(v.migration)}</p>${v.status==='publicada'?`<p><a href="${esc(v.releaseUrl)}">Release oficial</a></p>`:''}</details>`).join('')}`);

  const statuses=JSON.parse(fs.readFileSync(path.join(repo,'docs/catalogo/suporte-status.json'),'utf8'));
  write('suporte.html','Suporte',`<h1>Suporte pelo GitHub</h1><p>Você escreve e revisa o relato no aplicativo, depois exporta em Markdown ou abre o formulário oficial. Quem envia a issue é você.</p><p class="limite">Issues são públicas: não inclua senhas, tokens, código privado ou dados pessoais. Não há suporte por e-mail.</p><div class="acoes"><a class="botao" href="${repoUrl}/issues/new?template=bug.yml">Relatar bug</a><a class="botao" href="${repoUrl}/issues/new?template=melhoria.yml">Pedir melhoria</a><a class="botao" href="${repoUrl}/issues/new?template=sugestao.yml">Enviar sugestão</a></div><h2>Acompanhe seu chamado</h2><p>O GitHub dá o número; respostas e resolução ficam nos comentários.</p>${statuses.map(s=>`<div class="status"><h3>${esc(s.nome)}</h3><p>${esc(s.explicacao)}</p></div>`).join('')}<p><a href="${repoUrl}/issues">Consultar chamados oficiais</a> · <a href="documentacao-suporte.html">Como funciona o suporte</a></p>`);

  for(const d of docs){
    const contrato=d.f==='docs/CONTRATOS.md';
    const introducao=contrato
      ?'<p class="suave">Este catálogo mostra como a janela do Prumo, o processo principal e os agentes se comunicam. Cada linha explica quais dados uma operação recebe e o que ela pode fazer.</p>'
      :'';
    const conteudo=markdown(d.body,d.f);
    const artigo=contrato
      ?`<details><summary>Ver contratos técnicos completos</summary><article>${conteudo}</article></details>`
      :`<article>${conteudo}</article>`;
    write(nome(d.f),d.title,`${introducao}${artigo}`);
  }
  fs.writeFileSync(path.join(out,'estilo.css'),css+'\n'+orb.css);fs.copyFileSync(path.join(repo,'assets/prumo-icon.png'),path.join(out,'prumo.png'));
  // O agente do site é a MESMA imagem usada pelo aplicativo no Início, no chat e em Agentes.
  fs.copyFileSync(path.join(repo,'assets/agentes/robo-original.png'),path.join(out,'agente.png'));
  // Commit que gerou este site (Render informa RENDER_GIT_COMMIT): o CI espera ESTE commit no ar, não só a versão anunciada.
  fs.writeFileSync(path.join(out,'build.txt'),(process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||'local')+'\n');
  return {pages:docs.length+6,output:out,version:pkg.version,published:published.version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(gerarSite(),null,2));
