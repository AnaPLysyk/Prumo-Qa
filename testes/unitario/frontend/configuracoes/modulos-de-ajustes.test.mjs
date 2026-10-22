/** Configurações: tela unificada sem misturar preferências globais ou navegação lateral. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Configurações mantém perfil, assistente e aparência na fonte da tela', () => {
  const b = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8')).bundles.find(x => x.destino === 'dist/renderer/interfaces.js');
  const fonte = 'frontend/configuracoes/tela-configuracoes.parte.js';
  assert.ok(b.origens.includes(fonte));
  const codigo = fs.readFileSync(fonte, 'utf8');
  assert.match(codigo, /^\/\*\* /);
  for (const trecho of [/function montarPainelConfiguracoes\(/, /data-painel': 'aparencia'/, /tr\('Aparência'\)/]) assert.match(codigo, trecho);
  assert.doesNotMatch(codigo, /Meu perfil|Assistente|perfilObter|assistenteAgentes/);
  const esperado = b.origens.map(p => { const s=fs.readFileSync(p,'utf8'); return s.slice(s.indexOf('\n')+1); }).join('');
  assert.equal(esperado, fs.readFileSync(b.destino,'utf8'));
  assert.doesNotMatch(codigo, /Ajustes deste computador/);
  assert.doesNotMatch(codigo, /secao\('Conta'/);
});

test('navegação compartilhada e preferências permanecem módulos distintos da tela', () => {
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
  const scripts = ['telas/compartilhado/workerDaJanela.js','telas/configuracoes/preferenciasDaJanela.js','telas/compartilhado/navegacaoDaJanela.js'];
  let anterior=-1;
  for (const script of scripts) { const i=html.indexOf('src="'+script+'"'); assert.ok(i>anterior,script); anterior=i; }
  const preferencias=fs.readFileSync('frontend/configuracoes/preferenciasDaJanela.js','utf8');
  const navegacao=fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js','utf8');
  assert.match(preferencias,/function montarControles\(/);
  assert.doesNotMatch(preferencias,/function montarSeletorProjeto\(/);
  assert.match(navegacao,/function montarSeletorProjeto\(/);
  assert.match(navegacao,/function iniciarMenu\(/);
  assert.doesNotMatch(navegacao,/function montarControles\(/);
});

test('menu superior mantém conta e configurações separadas', () => {
  const login = fs.readFileSync('frontend/login/entrarNaConta.js', 'utf8');
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  const navegacao = fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js', 'utf8');
  assert.match(login, /id: 'conta-menu'/);
  assert.match(login, /id: 'conta-botao'/);
  assert.match(login, /id: 'conta-minha'/);
  assert.match(html, /id="ajustes"/);
  assert.match(html, /id="controles"/);
  assert.match(navegacao, /pop\.hidden = !v/);
  assert.match(navegacao, /if \(!pop\.hidden && !pop\.contains\(ev\.target\)\) abrir\(false\)/);
});
