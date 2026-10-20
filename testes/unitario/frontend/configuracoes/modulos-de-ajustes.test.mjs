/** Contrato unitário de manutenção da tela Configurações. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Configurações mantém perfil, assistente e abas no bundle da interface', () => {
 const b=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8')).bundles.find(x=>x.destino==='dist/renderer/interfaces.js');
 const parts=[
  'frontend/configuracoes/ajustes-do-assistente.parte.js',
  'frontend/configuracoes/perfil-e-conta.parte.js',
  'frontend/configuracoes/aparencia-e-assistente.parte.js',
  'frontend/configuracoes/navegacao-dos-ajustes.parte.js'
 ];
 const i=b.origens.indexOf(parts[0]);
 assert.deepEqual(b.origens.slice(i,i+parts.length),parts);
 const code=parts.map(p=>fs.readFileSync(p,'utf8'));
 assert.ok(code.every(s=>s.startsWith('/** ')));
 assert.match(code[0],/function ajustesAssistente\(/);
 assert.match(code[1],/function salvarPerfil\(/);
 assert.match(code[2],/function desenharExternos\(/);
 assert.match(code[3],/mostrarPainel/);
 const expected=b.origens.map(p=>{ const s=fs.readFileSync(p,'utf8'); return s.slice(s.indexOf('\n')+1); }).join('');
 assert.equal(expected,fs.readFileSync(b.destino,'utf8'));
});

test('navegação compartilhada e preferências continuam carregadas na ordem correta', () => {
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 const scripts=['telas/compartilhado/mostrarEstadoWorker.js','telas/configuracoes/preferenciasDaJanela.js','telas/compartilhado/navegacaoDaJanela.js','telas/compartilhado/acompanharEventosWorker.js'];
 let anterior=-1;
 for(const script of scripts){ const indice=html.indexOf('src="'+script+'"'); assert.ok(indice>anterior,'Carregamento incorreto: '+script); anterior=indice; }
 const preferencias=fs.readFileSync('frontend/configuracoes/preferenciasDaJanela.js','utf8');
 const navegacao=fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js','utf8');
 assert.match(preferencias,/function montarControles\(/);
 assert.doesNotMatch(preferencias,/function montarSeletorProjeto\(/);
 assert.match(navegacao,/function montarSeletorProjeto\(/);
 assert.match(navegacao,/function iniciarMenu\(/);
 assert.doesNotMatch(navegacao,/function montarControles\(/);
});
