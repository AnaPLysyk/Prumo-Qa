/** Contrato de manutenção: uma fonte por tela, partes declaradas e API HTTP visível na documentação. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gerarMapaDoAplicativo } from '../../../../docs/geradores/gerar-mapa-do-aplicativo.mjs';

const modulos=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8')).bundles;
function arquivosEm(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?arquivosEm(path.join(dir,e.name)):
    e.isFile()?[path.join(dir,e.name).split(path.sep).join('/')]:[]);
}
test('cada fragmento visual tem uma unica tela e um unico bundle gerado',()=>{
  const origens=modulos.flatMap(b=>b.origens);
  assert.equal(new Set(origens).size,origens.length,'fragmento repetido em dois bundles');
  for(const origem of origens){
    assert.match(origem,/^frontend\/(?:[a-z-]+\/)+[\w.-]+\.parte\.(?:js|css)$/);
    assert.ok(fs.existsSync(origem),origem);
    assert.match(fs.readFileSync(origem,'utf8'),/^\/\*\* /,'arquivo precisa dizer o que faz');
  }
  const partes=arquivosEm('frontend').filter(f=>/\.parte\.(?:js|css)$/.test(f));
  assert.deepEqual(partes.filter(f=>!origens.includes(f)),[],'parte sem destino no Electron');
  const telas=new Set(fs.readdirSync('frontend',{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name));
  for(const origem of origens)assert.ok(telas.has(origem.split('/')[1]),origem);
  assert.ok(modulos.every(b=>b.destino.startsWith('dist/renderer/')),'bundle gerado fora de dist');
});
test('documentacao viva lista a API HTTP dentro das pastas de login, suporte e aplicativo',()=>{
  const mapa=gerarMapaDoAplicativo();
  for(const [tela,arquivo] of [
    ['login','backend/login/servidor/autenticacao.mjs'],
    ['suporte','backend/suporte/servidor/chamados.mjs'],
    ['aplicativo','backend/aplicativo/servidor/servidor.mjs']
  ]){
    const m=mapa.telas.find(t=>t.id===tela);
    assert.ok(m,'tela sem mapa: '+tela);
    assert.ok(m.backend.servidor.some(a=>a.caminho===arquivo),'API HTTP nao aparece em '+tela);
    assert.ok(!m.backend.outros.some(a=>a.caminho===arquivo),'API HTTP misturada com outros em '+tela);
  }
});
test('toda fonte visual tem entrada declarada ou pertence à página de recuperação',()=>{
  const recursos=new Set(JSON.parse(fs.readFileSync('frontend/recursos.json','utf8')).recursos.map(r=>r.fonte));
  const partes=new Set(modulos.flatMap(b=>b.origens));
  const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
  const scripts=new Set([...html.matchAll(/(?:src|href)="telas\/([^"]+)"/g)].map(x=>'frontend/'+x[1]));
  const arquivos=arquivosEm('frontend').filter(x=>/\.(?:js|css|html)$/.test(x));
  const semEntrada=arquivos.filter(x=>!recursos.has(x)&&!partes.has(x)&&!scripts.has(x)&&!x.includes('/web/'));
  assert.deepEqual(semEntrada,[],'fonte sem entrada de uso; revise antes de excluir');
});
test('o MVP remoto nao carrega SDK Supabase experimental',()=>{
  assert.ok(!fs.existsSync('backend/login/integracoes/identidadeCentral.ts'));
  assert.ok(!fs.existsSync('backend/login/integracoes/identidadePublicaDoPrumo.ts'));
  assert.ok(!fs.existsSync('backend/login/regras/desafioDeEmailCentral.ts'));
  assert.equal('supabase-js' in (JSON.parse(fs.readFileSync('package.json','utf8')).dependencies||{}),false);
  assert.ok(!fs.readFileSync('frontend/login/entrarNaConta.js','utf8').includes('vistaEntrarCentral'));
});

test('agendamentos e execucoes carregam uma vez, cada um na propria tela', () => {
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]);
 assert.ok(scripts.indexOf('execucoes-e-evidencias.js')>=0);
 assert.ok(scripts.indexOf('execucoes-e-evidencias.js')<scripts.indexOf('tela-agendamentos.js'));
 const agenda=fs.readFileSync('frontend/agendamentos/tela-agendamentos.js','utf8');
 const runs=fs.readFileSync('frontend/testes/execucoes-e-evidencias.js','utf8');
 assert.match(agenda,/abas\.agenda\s*=/);
 assert.doesNotMatch(agenda,/abas\.evidencias\s*=|function abrirExecucao\(/);
 assert.match(agenda,/window\.PrumoOperacao\.abrirExecucao\(y\)/);
 assert.match(runs,/abas\.evidencias\s*=/);
 assert.match(runs,/window\.PrumoOperacao\s*=/);
 assert.doesNotMatch(runs,/abas\.agenda\s*=/);
 assert.ok(!fs.existsSync('frontend/agendamentos/mostrarAgendamentos.js'));
 assert.ok(!fs.existsSync('frontend/agendamentos/cartoes/montarCartaoRotina.js'));
});

test('metricas tem uma unica tela ativa, sem o fluxo substituido', () => {
 const bundle=modulos.find(b=>b.destino==='dist/renderer/interfaces.js');
 assert.ok(bundle.origens.includes('frontend/metricas/tela-metricas.parte.js'));
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 assert.ok(!html.includes('telas/metricas/mostrarMetricas.js'));
 assert.ok(!html.includes('telas/metricas/componentes/montarVisuaisMetricas.js'));
 assert.ok(!fs.existsSync('frontend/metricas/mostrarMetricas.js'));
 assert.ok(!fs.existsSync('frontend/metricas/componentes/montarVisuaisMetricas.js'));
});

test('runtime compartilhado não implementa as telas que já possuem arquivo próprio', () => {
 const runtime=fs.readFileSync('frontend/compartilhado/runtime/app.js','utf8');
 assert.match(runtime,/const abas\s*=\s*\{\s*\}/);
 for (const tela of ['metricas','logs','suporte','ajuda']) {
  assert.doesNotMatch(runtime,new RegExp('(?:async\\s+'+tela+'\\s*\\(|abas\\.'+tela+'\\s*=)'));
 }
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 assert.ok(html.includes('src="interfaces.js"'));
 assert.ok(html.includes('src="suporte.js"'));
 assert.ok(html.includes('src="ajuda.js"'));
});

test('Ajuda e notificações têm fonte própria carregada após o runtime', () => {
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
 const index=(x)=>scripts.indexOf(x);
 const ajuda='telas/ajuda/paineis-da-ajuda.js', sino='telas/compartilhado/notificacoes.js';
 assert.ok(index('app.js')>=0 && index('app.js')<index(sino));
 assert.ok(index('app.js')<index(ajuda) && index(ajuda)<index('ajuda.js'));
 const runtime=fs.readFileSync('frontend/compartilhado/runtime/app.js','utf8');
 for(const fn of ['painelVersoes','painelAtualizacoes','painelIntegracoes','painelDados','iniciarNotificacoes']) {
  assert.doesNotMatch(runtime,new RegExp('(?:async\\s+)?function\\s+'+fn+'\\s*\\('));
 }
 const ajudaCodigo=fs.readFileSync('frontend/ajuda/paineis-da-ajuda.js','utf8');
 const notificacoes=fs.readFileSync('frontend/compartilhado/notificacoes.js','utf8');
 assert.match(ajudaCodigo,/async function painelVersoes\(/);
 assert.match(notificacoes,/async function iniciarNotificacoes\(/);
});
