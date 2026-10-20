/** Agentes: garante que interface, cérebro e atividades continuam no mesmo bundle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('a tela separa cadastro, cérebro visual e atividades por responsabilidade',()=>{
 const base='frontend/agentes/';
 const arquivos=['tela-agentes.parte.js','cerebro-do-agente.parte.js','atividades-do-agente.parte.js'];
 const s=arquivos.map(x=>fs.readFileSync(base+x,'utf8'));
 assert.match(s[0],/function detail\(/);
 assert.doesNotMatch(s[0],/async function brain\(x\)|async function activity\(\)/);
 assert.match(s[1],/async function brain\(x\)/);
 assert.match(s[2],/async function mostrarOrquestracoes\(/);
 assert.match(s[2],/async function activity\(\)/);
 assert.ok(s.every(x=>x.startsWith('/** ')));
});
test('o bundle interfaces preserva a ordem e o JavaScript executado',()=>{
 const data=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
 const b=data.bundles.find(x=>x.destino==='dist/renderer/interfaces.js');
 assert.ok(b);
 assert.deepEqual(b.origens.filter(x=>x.startsWith('frontend/agentes/')).slice(-3),[
   'frontend/agentes/tela-agentes.parte.js',
   'frontend/agentes/cerebro-do-agente.parte.js',
   'frontend/agentes/atividades-do-agente.parte.js'
 ]);
 const compilado=b.origens.map(f=>{const s=fs.readFileSync(f,'utf8');return s.slice(s.indexOf('\n')+1);}).join('');
 assert.equal(compilado,fs.readFileSync(b.destino,'utf8'));
});

test('o painel carrega seu modelo antes da interface e mantém as posições calculadas', () => {
 const modeloArquivo = 'frontend/agentes/atividades/modelo-e-layout.js';
 const painelArquivo = 'frontend/agentes/atividades/painel-atividades.js';
 const recursos = JSON.parse(fs.readFileSync('frontend/recursos.json', 'utf8')).recursos;
 const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
 assert.ok(recursos.some(r => r.fonte === modeloArquivo && r.destino === 'dist/renderer/modelo-e-layout.js'));
 assert.ok(html.indexOf('src="modelo-e-layout.js"') < html.indexOf('src="painel-atividades.js"'));
 assert.match(fs.readFileSync(painelArquivo, 'utf8'), /PrumoModeloAtividades/);
 const codigo = fs.readFileSync(modeloArquivo, 'utf8');
 const modelo = vm.runInNewContext(codigo + '\nPrumoModeloAtividades;', { tr: (s) => s });
 const dados = {
  atividades: [{ origin: 'MCP', client: 'claude', tool: 'contexto_projeto', operationId: 'op-1', state: 'PASS', at: '2026-10-18T10:00:00Z', durationMs: 25, summary: {} }],
  conversas: [], agentes: [], execucoes: [],
 };
 const grafo = modelo.modelar(dados);
 assert.equal(grafo.fontes.length, 1);
 assert.equal(grafo.hubs.length, 1);
 assert.equal(grafo.folhas.length, 1);
 assert.equal(grafo.arestas.length, 2);
 const layout = modelo.dispor(grafo, 1200, 700);
 assert.ok(Number.isFinite(layout.largura) && layout.largura > 0);
 assert.ok(layout.pos.has('op:op-1'));
});

test('CSS de Agentes mantém o visual definitivo sem animações contraditórias', () => {
 const arquivo = 'frontend/agentes/espaco-profundo.parte.css';
 const css = fs.readFileSync(arquivo, 'utf8');
 const regras = (expressao) => [...css.matchAll(expressao)].map((m) => m[1]);
 const astro = regras(/\.v36a-astro\{([^{}]*)\}/g);
 const halo = regras(/\.v36a-astro::after\{([^{}]*)\}/g);
 const foco = regras(/\.v36a-astro:hover,\.v36a-astro:focus-visible\{([^{}]*)\}/g);
 assert.equal(astro.length, 1, 'não recriar a animação do cartão antigo');
 assert.equal(halo.length, 1, 'manter uma definição do halo');
 assert.equal(foco.length, 1, 'manter uma definição de hover/foco');
 assert.match(astro[0], /animation:none/);
 assert.match(halo[0], /inset:0 4% 34%/);
 assert.match(halo[0], /opacity:\.25/);
 assert.match(foco[0], /transform:none/);
 assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css, /@media\(max-width:820px\)/);
 const manifesto = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json', 'utf8'));
 const bundle = manifesto.bundles.find((b) => b.destino === 'dist/renderer/interfaces.css');
 assert.ok(bundle.origens.includes(arquivo));
 const gerado = bundle.origens.map((f) => { const s = fs.readFileSync(f, 'utf8'); return s.slice(s.indexOf('\n') + 1); }).join('');
 assert.equal(gerado, fs.readFileSync(bundle.destino, 'utf8'));
});

test('Agentes mantém Orchestrator e nova tentativa quando a consulta pessoal falha', async () => {
  const fonte = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  const ini = fonte.indexOf('async function carregarPessoais(id) {');
  const fim = fonte.indexOf('\n  const visibilidade', ini);
  assert.ok(ini > 0 && fim > ini);
  const simular = resposta => vm.runInNewContext('(' + fonte.slice(ini, fim) + ')', {
    api: { agentesPessoais: async () => resposta },
    localStorage: { getItem: () => null }
  });
  await assert.rejects(simular({ ok: false, error: 'SERVICE_UNAVAILABLE' })('p-1'), /Não foi possível consultar/);
  const vazio = await simular({ ok: true, data: [] })('p-1');
  assert.equal(vazio.length, 0);
  const ids = [];
  const ctx = {
    el: { append(...nos) { this.nos = nos; } },
    h: (tag, props, ...nos) => ({ tag, props, nos }),
    tr: s => s, asset: () => '', note: s => s,
    PrumoOrbitas: { anexar() {} },
    button: (texto, onClick, props) => ({ texto, onClick, props }),
    mostrar: id => ids.push(id)
  };
  const a = fonte.indexOf('function disponivel(motivo, tentar = false)');
  const b = fonte.indexOf('\n    const e = estado.espaco', a);
  assert.ok(a > 0 && b > a);
  const disponivel = vm.runInNewContext('(' + fonte.slice(a, b) + ')', ctx);
  disponivel('erro', true);
  assert.equal(ctx.el.nos[0].props.role, 'list');
  const tentar = ctx.el.nos[2].nos.find(n => n?.props?.id === 'v36-agentes-recarregar');
  assert.ok(tentar, 'há um comando real para repetir a consulta');
  tentar.onClick();
  assert.deepEqual(ids, ['agentes']);
  assert.match(fonte, /catch \{ disponivel\(/);
});
