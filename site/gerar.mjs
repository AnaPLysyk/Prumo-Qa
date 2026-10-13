import fs from 'node:fs';
import { pagina } from './componentes/pagina.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fontes=[...fs.readdirSync(path.join(repo,'app/ajuda')).filter(n=>n.endsWith('.md')).map(n=>'app/ajuda/'+n),'docs/CICLO-QUALIDADE.md','docs/SEGURANCA.md','docs/SUPORTE.md','docs/ASSINATURA.md','docs/CONTRATOS.md','docs/SERVICOS.md','docs/AGENDAMENTOS.md'];
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

// Órbitas do agente com os MESMOS parâmetros do aplicativo (frontend/inicio/identidade/orbitas-v36.js), lidos da fonte única.
// O app desenha em canvas com JavaScript; o site não usa script, então vira SVG e os arcos giram por CSS
// (stroke-dashoffset). Sem a flexão das curvas, que depende de JavaScript.
function orbitasDoApp() {
  const fonte=fs.readFileSync(path.join(repo,'frontend/inicio/identidade/orbitas-v36.js'),'utf8');
  const m=/const orbitas = (\[[\s\S]*?\]);/.exec(fonte);if(!m)throw new Error('Parâmetros das órbitas não encontrados em orbitas-v36.js');
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

const nomesTela={'inicio':'Início com o Prumo Orchestrator e o chat local','testes':'Testes: casos do Qase e testes do código numa lista única','codigo':'Código dos testes, somente leitura, com o caso do Qase anotado','tickets':'Tickets do Jira e defeitos do Qase numa tabela','runs':'Runs preparadas no Prumo e runs do Qase','rastreabilidade':'Trilha do ticket ao defeito, com a origem de cada vínculo','agentes':'Agentes: Orchestrator, clientes MCP e especializações','inicio-claro':'Tema claro'};

export function gerarSite(out=path.join(repo,'site/public')) {
  fs.mkdirSync(out,{recursive:true});const orb=orbitasSvg();
  const pkg=JSON.parse(fs.readFileSync(path.join(repo,'package.json'),'utf8'));
  const versions=JSON.parse(fs.readFileSync(path.join(repo,'app/versoes.json'),'utf8')).versions;
  const published=versions.find(v=>v.status==='publicada');if(!published)throw new Error('Sem release oficial registrada');
  const docs=fontes.map(f=>{const body=fs.readFileSync(path.join(repo,f),'utf8').replaceAll('{{VERSAO}}',pkg.version).replace(/C:\\Users\\[^\\\s]+/g,'C:\\Users\\[perfil]');return {f,body,title:/^# (.+)$/m.exec(body)?.[1]??f};});
  const menu=[['index.html','Início'],['demo.html','Demonstração'],['tutoriais.html','Tutoriais'],['documentacao.html','Documentação'],['versoes.html','Download'],['suporte.html','Suporte']];
  const page=(arquivo,title,body)=>pagina({arquivo,title,body,menu,repoUrl,esc});
  const write=(n,title,body)=>fs.writeFileSync(path.join(out,n),page(n,title,body));
  const imagens=fs.existsSync(path.join(repo,'site/imagens'))?fs.readdirSync(path.join(repo,'site/imagens')).filter(n=>n.endsWith('.png')):[];
  for(const n of imagens)fs.copyFileSync(path.join(repo,'site/imagens',n),path.join(out,'captura-'+n));
  const tela=(id,alt)=>imagens.includes(id+'.png')?`<figure class="tela"><img src="captura-${id}.png" alt="${esc(alt)}" width="1280" height="800" loading="lazy"><figcaption>${esc(nomesTela[id]||alt)}</figcaption></figure>`:'';

  write('index.html','Do ticket à evidência',`<section class="hero"><div><span class="etiqueta">APP PARA WINDOWS · QUALIDADE DE SOFTWARE</span><h1>Do ticket à evidência.</h1><p class="lead">Testes, tickets, runs e relatórios do Jira, Qase e GitHub num só lugar. Você decide o que sai do seu computador.</p><div class="acoes"><a class="botao primario" href="versoes.html">Baixar a versão ${esc(published.version)}</a><a class="botao" href="demo.html">Ver a demonstração</a></div><p class="suave">Gratuito · dados locais · funciona sem IA</p></div><div class="orbita" role="img" aria-label="Prumo Orchestrator: a esfera do assistente com as três órbitas, igual ao aplicativo">${orb.svg}<span class="orbe"><img src="agente.png" alt="" width="290" height="290"></span></div></section>
  <section><h2>O que o Prumo faz</h2><div class="grade2"><div><h3>Liga o Qase ao código</h3><p>Mostra casos do Qase e testes do repositório lado a lado. Um caso só se liga a um teste por anotação no próprio código; nome parecido não liga nada.</p></div><div><h3>Conversa com Jira, Qase e GitHub</h3><p>Busca tickets e defeitos, monta planos e runs, publica resultados e abre Pull Requests, com prévia e a sua confirmação.</p></div><div><h3>Roda, agenda e mede</h3><p>Executa automações declaradas, repete na agenda pela bandeja do Windows e mostra as métricas que você escolher.</p></div><div><h3>Rastreia tudo</h3><p>Do ticket ao caso, do código à evidência e ao defeito. Cada ligação mostra de onde veio.</p></div><div><h3>Aprende só o que você aprova</h3><p>O assistente responde com os dados deste computador, sem modelo de IA. Todo aprendizado nasce rascunho e só vale depois da sua aprovação.</p></div><div><h3>Limita a IA</h3><p>Claude e Codex só propõem rascunhos. Cada permissão é conferida a cada chamada, e o Painel de atividades mostra só o que foi registrado.</p></div></div></section>
  <section><h2>Por dentro</h2>${tela('inicio','Tela inicial do Prumo QA com o Prumo Orchestrator, as três órbitas e o chat')}<div class="duas">${tela('testes','Visão geral de Testes com casos do Qase e testes do código')}${tela('codigo','Leitor de código dos testes com o caso do Qase anotado')}</div><div class="duas">${tela('tickets','Tabela com tickets do Jira e defeitos do Qase')}${tela('rastreabilidade','Trilha de rastreabilidade com a origem de cada vínculo')}</div>${tela('agentes','Tela de Agentes com o Orchestrator, Codex, Claude Code e as especializações')}</section>
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
  <article id="catalogo"><h2>Entender os testes do repositório</h2>${passos(['Em <strong>Projetos</strong>, crie um projeto e use <strong>Vincular pasta de automação</strong>.','Abra <strong>Testes › Visão geral</strong>: casos do Qase e testes do código aparecem numa lista única, com situação, nível e tags.','Em <strong>Testes › Código</strong>, abra um arquivo para ver cada teste com nível, tags, motivo da classificação e o caso do Qase.'])}</article>
  <article id="ligar"><h2>Ligar um caso do Qase ao teste</h2>${passos(['No próprio teste, anote o caso: <code>qase(31, …)</code>, <code>@qase-31</code> ou <code>Qase: SFQ-31</code>.','Em <strong>Testes</strong>, use <strong>Atualizar</strong>.','O caso passa a “caso com código”, e o detalhe dele abre o arquivo na linha do teste. Nome parecido não liga nada.'])}</article>
  <article id="conectar"><h2>Conectar Jira, Qase e GitHub</h2>${passos(['Em <strong>Conexões</strong>, configure a conta: o token fica cifrado pelo Windows.','Liste os recursos e vincule ao projeto.','Se quiser criar ou atualizar itens, habilite a <strong>escrita</strong> do serviço. Ela nasce desligada.'])}</article>
  <article id="run"><h2>Montar uma run e publicar no Qase</h2>${passos(['Em <strong>Testes › Runs</strong>, use <strong>Preparar run</strong> e escolha os casos.','Abra a run, use <strong>Criar run no Qase…</strong> e <strong>Executar automações…</strong>. Cada uma pede a sua autenticação do Windows.','<strong>Publicar resultados…</strong>: o Prumo confere a run no Qase depois de enviar.'])}${tela('runs','Lista de runs preparadas no Prumo e runs do Qase')}</article>
  <article id="agenda"><h2>Repetir sozinho</h2>${passos(['Em <strong>Agendamentos</strong>, crie uma rotina “Run do Qase”.','Aprove a política de publicação para a run (validade e número de usos).','Feche a janela: o Prumo continua na bandeja do Windows.'])}</article>
  <article id="agentes"><h2>Limitar o que a IA pode pedir</h2>${passos(['Em <strong>Agentes</strong>, abra uma especialização e use <strong>Configuração</strong>.','Bloqueie as capacidades que não quer expor. O bloqueio vale a cada chamada MCP.','A IA só propõe rascunhos; você revisa e publica.'])}</article>
  <article id="aprendizados"><h2>Aprovar o que o assistente aprendeu</h2>${passos(['Converse no <strong>Início</strong> ou no chat flutuante. O Prumo pergunta como chamar você e qual o seu papel.','Aprendizados vindos da conversa ou de uma IA nascem <strong>rascunho</strong>.','Aprove ou descarte no chat ou no <strong>Cérebro</strong> do agente. Só o aprovado passa a valer.'])}</article>
  <article id="painel"><h2>Acompanhar os agentes ao vivo</h2>${passos(['Abra <strong>Agentes › Painel de atividades</strong>.','Ligue <strong>Ao vivo</strong>: o painel consulta a cada 3 segundos com a aba visível.','Arraste para mover e use Ctrl + roda para aproximar. Toda linha corresponde a um registro gravado; nada é inferido.'])}</article>`);

  write('documentacao.html','Documentação',`<h1>Documentação</h1><p class="suave">Gerada dos mesmos documentos de ajuda e contratos usados pelo aplicativo.</p><ul class="indice">${docs.map(d=>`<li><a href="${nome(d.f)}">${esc(d.title)}</a></li>`).join('')}</ul>`);

  const lista=(title,arr)=>arr.length?`<h3>${title}</h3><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
  const inst=published.installer;
  const download=inst?`${repoUrl}/releases/download/v${published.version}/${encodeURIComponent(inst.file)}`:null;
  write('versoes.html','Versões e download',`<h1>Versões e download</h1><p>Última versão publicada registrada: <strong>${esc(published.version)}</strong>. Confira a página oficial antes de baixar.</p>
  <div class="acoes">${download?`<a class="botao primario" href="${esc(download)}">Baixar instalador ${esc(published.version)} (.exe)</a>`:''}<a class="botao" href="${esc(published.releaseUrl)}">Abrir release oficial ${esc(published.version)}</a><a class="botao" href="documentacao-03-instalar.html">Como instalar</a></div>
  <p class="suave">Este site está hospedado no Render. O instalador é baixado da release oficial do Prumo QA no GitHub.</p>
  ${inst?`<h2>Confira o arquivo</h2><p>Instalador <code>${esc(inst.file)}</code> · SHA-256:</p><p class="hash">${esc(inst.sha256)}</p><p class="suave">No PowerShell: <code>Get-FileHash .\\${esc(inst.file)} -Algorithm SHA256</code>. O resultado deve ser igual ao valor acima e ao arquivo <code>${esc(inst.file)}.sha256</code> da release.</p>`:`<p class="suave">O SHA-256 desta versão está no arquivo <code>.sha256</code> anexado à release.</p>`}
  <p class="limite">O instalador não é assinado. O SHA-256 detecta troca ou corrupção do arquivo; não prova a autoria. Não desative as proteções do Windows. Requisitos: Windows 10 ou 11 de 64 bits.</p>
  <h2>Instalar uma versão sem assinatura</h2><p>As primeiras versões do Prumo não têm assinatura digital, então o Windows avisa antes de executar. Confira o SHA-256 acima e, se for igual ao da release:</p>
  <ol><li><strong>“O Windows protegeu o computador”</strong> (SmartScreen): clique em <strong>Mais informações</strong> e depois em <strong>Executar assim mesmo</strong>.</li><li><strong>Arquivo bloqueado por ter vindo da internet:</strong> botão direito no instalador › <strong>Propriedades</strong> › marque <strong>Desbloquear</strong> › <strong>OK</strong>, e execute de novo.</li><li><strong>Pelo botão direito:</strong> botão direito no instalador › <strong>Executar como administrador</strong> e confirme o aviso. Use só se a sua própria conta for administradora: com outra conta, o Prumo é instalado no perfil dessa outra conta.</li><li><strong>Smart App Control ligado:</strong> o Windows bloqueia sem opção de executar. Não desligue essa proteção por causa do Prumo; aguarde uma versão assinada ou fale com quem administra o computador.</li></ol>
  <p class="suave">A instalação é por usuário e preserva seus dados ao atualizar. Passo a passo completo em <a href="documentacao-03-instalar.html">Como instalar</a>.</p>
  <h2>Histórico</h2>${versions.map(v=>`<details><summary>${esc(v.version)} · ${esc(v.title)} · ${esc(v.status==='publicada'?'publicada':v.status==='repositorio'?'código, sem release':'planejada')}</summary><p>${esc(v.objective)}</p>${lista('Funcionalidades',v.features)}${lista('Correções',v.fixes)}${lista('Compatibilidade',v.compatibility)}${lista('Limitações',v.limitations)}<p>${esc(v.migration)}</p>${v.status==='publicada'?`<p><a href="${esc(v.releaseUrl)}">Release oficial</a></p>`:''}</details>`).join('')}`);

  const statuses=JSON.parse(fs.readFileSync(path.join(repo,'app/suporte-status.json'),'utf8'));
  write('suporte.html','Suporte',`<h1>Suporte pelo GitHub</h1><p>Prepare e revise o relato no aplicativo, exporte em Markdown ou abra o formulário oficial. O aplicativo não publica a issue por você.</p><p class="limite">Issues são públicas. Não inclua senhas, tokens, código privado ou dados pessoais. Não há e-mail de suporte.</p><div class="acoes"><a class="botao" href="${repoUrl}/issues/new?template=bug.yml">Relatar bug</a><a class="botao" href="${repoUrl}/issues/new?template=melhoria.yml">Pedir melhoria</a><a class="botao" href="${repoUrl}/issues/new?template=sugestao.yml">Enviar sugestão</a></div><h2>Acompanhe seu chamado</h2><p>O número é emitido pelo GitHub. Respostas e resolução ficam nos comentários.</p>${statuses.map(s=>`<div class="status"><h3>${esc(s.nome)}</h3><p>${esc(s.explicacao)}</p></div>`).join('')}<p><a href="${repoUrl}/issues">Consultar chamados oficiais</a> · <a href="documentacao-suporte.html">Como funciona o suporte</a></p>`);

  for(const d of docs)write(nome(d.f),d.title,`<article>${markdown(d.body,d.f)}</article>`);
  fs.writeFileSync(path.join(out,'estilo.css'),css+'\n'+orb.css);fs.copyFileSync(path.join(repo,'assets/prumo-icon.png'),path.join(out,'prumo.png'));
  // O agente do site é a MESMA imagem usada pelo aplicativo no Início, no chat e em Agentes.
  fs.copyFileSync(path.join(repo,'assets/interfaces-v36/robo-original.png'),path.join(out,'agente.png'));
  // Commit que gerou este site (Render informa RENDER_GIT_COMMIT): o CI espera ESTE commit no ar, não só a versão anunciada.
  fs.writeFileSync(path.join(out,'build.txt'),(process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||'local')+'\n');
  return {pages:docs.length+6,output:out,version:pkg.version,published:published.version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(gerarSite(),null,2));
