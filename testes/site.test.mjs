import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gerarSite,markdown } from '../scripts/gerar-site.mjs';
import { gerarSite as gerarSiteModular, markdown as markdownModular } from '../site/gerar.mjs';

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
  const versoes=JSON.parse(fs.readFileSync('app/versoes.json','utf8')).versions;const html=fs.readFileSync(path.join(out,'versoes.html'),'utf8');
  for(const v of versoes.filter(v=>v.status!=='publicada'))assert.ok(!html.includes(`/releases/tag/v${v.version}`));
});
test('documentos são escapados e nunca viram HTML ou URL executável',()=>{
  const html=markdown('# Teste\n<script>alert(1)</script>\n[texto](javascript:alert)\n```js\n<img onerror=alert(1)>\n```');
  assert.doesNotMatch(html,/<script|<img|href="javascript:/);assert.match(html,/&lt;script&gt;/);
});
test('site anuncia como disponível a última versão marcada como publicada no catálogo (não uma anterior)',t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-site-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));gerarSite(out);
  const versoes=JSON.parse(fs.readFileSync('app/versoes.json','utf8')).versions;const publicada=versoes.find(v=>v.status==='publicada');
  for(const pagina of ['versoes.html','index.html']){const html=fs.readFileSync(path.join(out,pagina),'utf8');
    assert.ok(html.includes(`<strong>${publicada.version}</strong>`)||html.includes(`v${publicada.version}`)||html.includes(publicada.version),`${pagina} deve citar ${publicada.version}`);
    for(const velha of versoes.filter(v=>v.status==='publicada'&&v.version!==publicada.version))assert.ok(!html.includes(`Última versão publicada registrada: <strong>${velha.version}</strong>`),`${pagina} não pode anunciar ${velha.version}`);}
  const html=fs.readFileSync(path.join(out,'versoes.html'),'utf8');assert.match(html,new RegExp(`Última versão publicada registrada: <strong>${publicada.version.replaceAll('.','\.')}</strong>`));
  assert.ok(html.includes(`/releases/tag/v${publicada.version}`));
});
