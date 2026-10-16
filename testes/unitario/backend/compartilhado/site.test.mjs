import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gerarSite,markdown } from '../../../../site/gerar.mjs';
import { gerarSite as gerarSiteModular, markdown as markdownModular } from '../../../../site/gerar.mjs';

test('entrada anterior reexporta a mesma implementação modular do site',()=>{
  assert.equal(gerarSite,gerarSiteModular);
  assert.equal(markdown,markdownModular);
});
test('site reproduzível, links internos resolvidos e downloads apenas de releases publicadas',t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-site-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
  const r=gerarSite(out);assert.ok(r.pages>15);
  const snapshot=()=>fs.readdirSync(out).map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(out,n))).digest('hex')]);
  const antes=snapshot();gerarSite(out);assert.deepEqual(snapshot(),antes);
  for(const n of fs.readdirSync(out).filter(n=>n.endsWith('.html'))){
    const html=fs.readFileSync(path.join(out,n),'utf8');assert.match(html,/<html lang="pt-BR">/);assert.doesNotMatch(html,/<script|C:\\Users\\DELL|file:\/\//i);
    for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(href.startsWith('https:'))continue;const [arquivo,fragmento]=href.split('#');const alvo=path.join(out,arquivo||n);assert.ok(fs.existsSync(alvo),`${n}: ${href}`);if(fragmento)assert.ok(fs.readFileSync(alvo,'utf8').includes(`id="${fragmento}"`),`${n}: âncora ${href}`);}
  }
  const versoes=JSON.parse(fs.readFileSync('docs/catalogo/versoes.json','utf8')).versions;const html=fs.readFileSync(path.join(out,'versoes.html'),'utf8');
  for(const v of versoes.filter(v=>v.status!=='publicada'))assert.ok(!html.includes(`/releases/tag/v${v.version}`));
});
test('documentos são escapados e nunca viram HTML ou URL executável',()=>{
  const html=markdown('# Teste\n<script>alert(1)</script>\n[texto](javascript:alert)\n```js\n<img onerror=alert(1)>\n```');
  assert.doesNotMatch(html,/<script|<img|href="javascript:/);assert.match(html,/&lt;script&gt;/);
});
test('página de contratos explica o catálogo sem alterar a fonte gerada',t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-site-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));gerarSite(out);
  const html=fs.readFileSync(path.join(out,'documentacao-contratos.html'),'utf8');
  assert.match(html,/Este catálogo mostra como a janela do Prumo/);
  assert.match(html,/Cada linha explica quais dados uma operação recebe e o que ela pode fazer/);
  assert.match(html,/<summary>Ver contratos técnicos completos<\/summary>/);
  assert.match(html,/prumo:interface:exportar/);
});
test('site anuncia como disponível a última versão marcada como publicada no catálogo (não uma anterior)',t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-site-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));gerarSite(out);
  const versoes=JSON.parse(fs.readFileSync('docs/catalogo/versoes.json','utf8')).versions;const publicada=versoes.find(v=>v.status==='publicada');
  for(const pagina of ['versoes.html','index.html']){const html=fs.readFileSync(path.join(out,pagina),'utf8');
    assert.ok(html.includes(`<strong>${publicada.version}</strong>`)||html.includes(`v${publicada.version}`)||html.includes(publicada.version),`${pagina} deve citar ${publicada.version}`);
    for(const velha of versoes.filter(v=>v.status==='publicada'&&v.version!==publicada.version))assert.ok(!html.includes(`Baixe a versão <strong>${velha.version}</strong>`),`${pagina} não pode anunciar ${velha.version}`);}
  const html=fs.readFileSync(path.join(out,'versoes.html'),'utf8');assert.match(html,new RegExp(`Baixe a versão <strong>${publicada.version.replaceAll('.','\.')}</strong>`));
  assert.ok(html.includes(`/releases/tag/v${publicada.version}`));
});
test('downloads mostram a marca do sistema e o formato em cada instalador disponível',t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-site-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
  const download=path.join(out,'download');fs.mkdirSync(download);
  fs.writeFileSync(path.join(download,'instaladores.json'),JSON.stringify({instaladores:[
    {sistema:'Windows',detalhe:'64 bits',arquivo:'Prumo-QA-Setup.exe'},
    {sistema:'macOS',detalhe:'Apple Silicon',arquivo:'Prumo-QA-arm64.dmg'},
    {sistema:'Linux',detalhe:'AppImage',arquivo:'Prumo-QA.AppImage'},
    {sistema:'Linux',detalhe:'Debian',arquivo:'Prumo-QA.deb'}
  ]}));
  const anterior=process.env.PRUMO_SITE_HOSPEDA_INSTALADOR;process.env.PRUMO_SITE_HOSPEDA_INSTALADOR='1';
  try {
    gerarSite(out);
  } finally {
    if(anterior===undefined)delete process.env.PRUMO_SITE_HOSPEDA_INSTALADOR;
    else process.env.PRUMO_SITE_HOSPEDA_INSTALADOR=anterior;
  }
  const html=fs.readFileSync(path.join(out,'versoes.html'),'utf8');
  const cartoes=[...html.matchAll(/<article class="download-cartao[^"]*"[^>]*>([\s\S]*?)<\/article>/g)].map(([,cartao])=>cartao);
  assert.equal(cartoes.length,3);
  for(const [marca,plataforma] of [['marca-windows','Windows'],['marca-apple','macOS'],['marca-linux','Linux']]){
    assert.equal(cartoes.filter(cartao=>cartao.includes(`download-icone ${marca}`)&&cartao.includes(`<h3>${plataforma}</h3>`)).length,1,`${plataforma} deve aparecer uma vez com o ícone ${marca}`);
  }
  const linux=cartoes.find(cartao=>cartao.includes('<h3>Linux</h3>'));
  assert.ok(linux?.includes('Qualquer distribuição')&&linux.includes('APPIMAGE')&&linux.includes('Debian / Ubuntu')&&linux.includes('DEB'),'Linux deve agrupar as opções AppImage e DEB');
  const mac=cartoes.find(cartao=>cartao.includes('<h3>macOS</h3>'));
  assert.ok(mac?.includes('Apple Silicon')&&mac.includes('DMG'),'macOS deve exibir a arquitetura e o formato');
  assert.match(html,/class="download-link"[^>]*aria-label="Baixar Prumo-QA-Setup\.exe"[^>]*><svg viewBox="0 0 20 20"/);
  assert.equal((html.match(/class="download-opcao"/g)??[]).length,4);
  assert.doesNotMatch(html,/Baixar para (Windows|macOS|Linux)|Última versão publicada registrada/);
  assert.match(html,/<summary>Conferir se o arquivo está correto<\/summary>/);
  assert.match(html,/<summary>Se o Windows mostrar um aviso<\/summary>/);
});
