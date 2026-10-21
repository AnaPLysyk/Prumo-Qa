/** Agentes: garante que interface, cérebro e atividades continuam no mesmo bundle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Agentes mantém cadastro, cérebro e atividades identificáveis em um único arquivo da tela', () => {
 const fonte=fs.readFileSync('frontend/agentes/tela-agentes.parte.js','utf8');
 assert.match(fonte,/^\/\*\* /);
 for(const trecho of [/function detail\(/,/async function brain\(x\)/,/async function mostrarOrquestracoes\(/,/async function activity\(\)/])assert.match(fonte,trecho);
 const blocos=['function detail(','async function brain(x)','async function mostrarOrquestracoes('].map(t=>fonte.indexOf(t));
 assert.ok(blocos[0]>=0&&blocos[0]<blocos[1]&&blocos[1]<blocos[2]);
});

test('etiquetas dos neurônios só abrem em hover, foco ou seleção e fecham com clique', () => {
 const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
 const js = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
 const visivel = css.match(/[^\n]*\.v36-neuron-rotulo\{opacity:1\}/g) || [];
 assert.equal(visivel.length, 1, 'a etiqueta deve ter uma só regra de abertura');
 assert.match(css, /\.v36-neuron-rotulo\{[^}]*opacity:\.0/);
 for (const seletor of ['.v36-neuron:hover', '.v36-neuron:focus-visible', '.v36-neuron[aria-pressed=true]']) assert.ok(visivel[0].includes(seletor));
 assert.doesNotMatch(visivel[0], /\.mudou|:has\(/, 'nem alterações nem quantidade de pontos podem abrir todas as etiquetas');
 assert.match(js, /const selecionado = b\.getAttribute\('aria-pressed'\) === 'true'/);
 assert.match(js, /String\(!selecionado && o === b\)/);
 assert.match(js, /if \(selecionado\) \{ inspect\.replaceChildren\(\); return; \}/);
 assert.match(js, /ev\.target\.closest\('\.v36-neuron, \.v36a-sim-acesos'\)/);
 assert.match(js, /\.setAttribute\('aria-pressed', 'false'\)/);
});

test('o bundle interfaces preserva a ordem e o JavaScript executado',()=>{
 const data=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
 const b=data.bundles.find(x=>x.destino==='dist/renderer/interfaces.js');
 assert.ok(b);
 assert.deepEqual(b.origens.filter(x=>x.startsWith('frontend/agentes/')).slice(-1),['frontend/agentes/tela-agentes.parte.js']);
 const compilado=b.origens.map(f=>{const s=fs.readFileSync(f,'utf8');return s.slice(s.indexOf('\n')+1);}).join('');
 assert.equal(compilado,fs.readFileSync(b.destino,'utf8'));
});

test('o painel carrega seu modelo antes da interface e mantém as posições calculadas', () => {
 const painelArquivo = 'frontend/design-system/painel-atividades.js';
 const recursos = JSON.parse(fs.readFileSync('frontend/recursos.json', 'utf8')).recursos;
 const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
 assert.ok(recursos.some(r => r.fonte === painelArquivo && r.destino === 'dist/renderer/painel-atividades.js'));
 assert.ok(!recursos.some(r => r.fonte.endsWith('/modelo-e-layout.js')));
 assert.ok(html.includes('src="painel-atividades.js"'));
 assert.ok(!html.includes('src="modelo-e-layout.js"'));
 assert.match(fs.readFileSync(painelArquivo, 'utf8'), /PrumoModeloAtividades/);
 const codigo = fs.readFileSync(painelArquivo, 'utf8');
 const modelo = vm.runInNewContext(codigo + '\nPrumoModeloAtividades;', { tr: (s) => s });
 const dados = {
  atividades: [{ origin: 'MCP', client: 'claude', tool: 'contexto_projeto', operationId: 'op-1', state: 'STARTED', at: new Date().toISOString(), durationMs: 25, summary: {} }],
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
 const arquivo = 'frontend/design-system/estilos-das-telas.parte.css';
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

test('políticas de Agentes separam controles editáveis de operações humanas sem alterar valores enviados', () => {
  const fonte = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const inicio = fonte.indexOf('function policyTable(pol, change, caps, somenteLeitura = false) {');
  const fim = fonte.indexOf('\n    const secao = ', inicio);
  assert.ok(inicio > 0 && fim > inicio, 'matriz identificável na própria tela');
  assert.match(fonte, /const editaveis = s\.matriz\.filter\(c => c\.editavel\.length\)/);
  assert.match(fonte, /const reservadas = s\.matriz\.filter\(c => !c\.editavel\.length\)/);
  assert.match(fonte, /api\.agentesSalvar\(e\.id, \[\.\.\.esp\], pol\)/, 'contrato de persistência preservado');
  assert.match(css, /\.v36a-politicas-restritas \.v36a-matriz/);
  assert.match(css, /\.v36a-politicas \.v36a-salvar \{ position: sticky/);
  const matriz = [
    { id: 'consultar_contexto', rotulo: 'Ler o contexto', motivo: 'Permitida pelas especializações de QA.', estado: 'PERMITIDO', editavel: ['PERMITIDO', 'BLOQUEADO'] },
    { id: 'consultar_jira', rotulo: 'Consultar Jira', motivo: 'As credenciais ficam protegidas.', estado: 'SOMENTE_PESSOA', editavel: [] }
  ];
  const h = (tag, props, ...children) => ({ tag, props, children });
  const fn = vm.runInNewContext('(' + fonte.slice(inicio, fim) + ')', { s: { matriz }, h, tr: x => x });
  let chamadas = 0; const politicas = {};
  const no = fn(politicas, () => chamadas++);
  const [editavel, restrita] = no.children[0];
  const seletor = editavel.children[1].children.find(x => x?.tag === 'select');
  assert.deepEqual(Array.from(seletor.children.flat(), x => x.props.value), ['PERMITIDO', 'BLOQUEADO']);
  seletor.props.onchange({ target: { value: 'BLOQUEADO' } });
  assert.equal(politicas.consultar_contexto, 'BLOQUEADO');
  assert.equal(chamadas, 1);
  assert.equal(restrita.children[1].children.filter(x => x?.tag === 'span').length, 1, 'estado humano exibido uma vez');
  assert.ok(editavel.children[0].children.some(x => x?.tag === 'details'), 'justificativa disponível sob demanda');
});

test('Políticas do projeto aparecem em aba própria, nunca no rodapé da lista de agentes', () => {
  const js = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const lista = js.slice(js.indexOf('function list() {'), js.indexOf('    // Políticas são uma área própria'));
  assert.ok(lista.length > 1000);
  assert.doesNotMatch(lista, /legacyPolicies\(\)/, 'lista não insere políticas no rodapé');
  assert.doesNotMatch(lista, /id: 'v36-clients'/, 'diagnóstico MCP não ocupa rodapé de agentes');
  assert.match(js, /'data-agent-tab': 'policies'/);
  assert.match(js, /else if \(tab === 'policies'\) policies\(\)/);
  assert.match(js, /function policies\(\) \{/);
  assert.match(js, /id: 'v36-agent-policies'/);
  assert.match(js, /showTab\('policies'\); const d = document\.getElementById\('v36-clients'\)/, 'atalho de cliente leva à aba correta');
  assert.match(css, /:has\(#v36-agent-policies\) \.v36f/);
  assert.match(js, /disabled: !podeAdministrar/, 'regras continuam protegidas para conta comum');
});

test('painel diagnostica problemas por consultas reais e exibe etapas, sem simular correções', () => {
  const js = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  assert.match(js, /id: 'v36-diagnosticar-projeto'/);
  assert.match(js, /api\.assistenteConversar\(e\.id,/);
  assert.match(js, /api\.agentesOrquestracoes\(e\.id\)/);
  assert.match(js, /id: 'v36-diagnostico'/);
  assert.match(js, /id: 'v36-orquestracoes'/);
  assert.match(js, /registro\.etapas\.find\(x => x\.agente === id\)/);
  assert.match(js, /'data-estado': estado/);
  assert.match(js, /Nenhum teste ou correção foi executado/);
  assert.doesNotMatch(js, /setTimeout\([^)]*CONCLUIDA/, 'não simular progresso concluído');
  assert.match(css, /\.v36a-diagnostico-passos/);
  assert.match(css, /\.v36a-aba\{flex:none;white-space:nowrap/, 'abas sem quebrar em janelas estreitas');
});

test('janelas dos agentes aparecem apenas enquanto há uma execução real ativa', () => {
  const js = fs.readFileSync('frontend/design-system/painel-atividades.js', 'utf8');
  const modelo = vm.runInNewContext(js + '\nPrumoModeloAtividades;', { tr: x => x });
  const em = new Date().toISOString();
  const registro = { id:'diag-real', em, estado:'CONCLUIDA', agentes:['regressao','investigacao-bugs'],
    etapas:[{agente:'regressao', estado:'CONCLUIDA', fontes:['Execuções'], inicio:em, fim:em}],
    emExecucao:undefined };
  const dados = { atividades:[],conversas:[{id:'conversa-antiga',em,agente:'regressao',fontes:[]}],
    execucoes:[], agentes:[{id:'regressao',nome:'Regressão'},{id:'investigacao-bugs',nome:'Investigação'}], orquestracoes:[registro] };
  assert.equal(modelo.modelar(dados).fontes.length,0,'histórico concluído não deixa agente fantasma na tela');
  registro.estado='EXECUTANDO'; registro.emExecucao='investigacao-bugs';
  const grafo=modelo.modelar(dados);
  assert.equal(grafo.fontes.filter(x=>x.tipo==='investigacao').length,1);
  assert.equal(grafo.hubs.length,2);
  assert.equal(grafo.folhas.filter(x=>x.tipo==='diagnostico').length,2);
  assert.ok(grafo.arestas.some(x=>x.de==='diagnostico:diag-real'&&x.para==='diagnostico-agente:regressao'));
  assert.equal(grafo.folhas.find(x=>x.id==='diagnostico-etapa:diag-real:investigacao-bugs').estado,'EXECUTANDO');
  assert.ok(modelo.dispor(grafo,960,640).pos.has('diagnostico-etapa:diag-real:regressao'));
  registro.estado='CONCLUIDA'; registro.emExecucao=undefined;
  assert.equal(modelo.modelar(dados).fontes.length,0,'ao concluir a janela some, mas os registros permanecem no backend');
  const anterior = { ...dados, atividades:[{operationId:'ab',state:'STARTED',at:em,tool:'executar_validacao',origin:'MCP',client:'claude'}] };
  assert.equal(modelo.modelar(anterior).fontes.length,1,'operação MCP ativa aparece');
  anterior.atividades[0].state='PASS';
  assert.equal(modelo.modelar(anterior).fontes.length,0,'operação MCP encerrada desaparece');
});
