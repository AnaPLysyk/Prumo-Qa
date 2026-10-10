import fs from 'node:fs';
const estados=JSON.parse(fs.readFileSync(new URL('../app/suporte-status.json',import.meta.url),'utf8'));
const luminancia=hex=>[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
fs.writeFileSync(new URL('../app/renderer/status.css',import.meta.url),'/* Gerado de app/suporte-status.json; não editar à mão. */\n'+estados.map(s=>`.status-${s.id} { background: #${s.cor}; color: ${luminancia(s.cor)>0.179?'#000000':'#ffffff'}; border-color: #${s.cor}; }`).join('\n')+'\n');
