/** Comprova que as funções separadas por tela geram o mesmo código executado pelo Electron. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const raiz = process.cwd();
const manifest = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
test('bundles da interface são reproduzidos exatamente pelas partes de cada tela', () => {
  assert.equal(manifest.schemaVersion, 1);
  for (const bundle of manifest.bundles) {
    assert.ok(bundle.origens.length > 0, 'bundle sem fontes: '+bundle.destino);
    const texto = bundle.origens.map(origem => {
      const fonte = fs.readFileSync(path.join(raiz, origem),'utf8');
      assert.match(fonte, /^\/\*\* [^\r\n]+\. \*\/\r?\n/, 'descrição na primeira linha: '+origem);
      return fonte.slice(fonte.indexOf('\n')+1);
    }).join('');
    const esperado = fs.readFileSync(path.join(raiz,bundle.destino),'utf8');
    assert.equal(texto, esperado, 'geração deve preservar integralmente '+bundle.destino);
    if (bundle.destino.endsWith('.js')) {
      const sintaxe = spawnSync(process.execPath,['--check', path.join(raiz,bundle.destino)],{encoding:'utf8'});
      assert.equal(sintaxe.status,0,'sintaxe JavaScript de '+bundle.destino+': '+sintaxe.stderr);
    }
  }
});
test('a janela carrega somente os bundles e nunca seus fragmentos internos',()=>{
  const html=fs.readFileSync('dist/renderer/index.html','utf8');
  for (const bundle of manifest.bundles) {
    const relative = bundle.destino.replace('dist/renderer/','');
    if (bundle.destino.endsWith('.css')) {
      assert.ok(html.includes('<link rel="stylesheet" href="'+relative+'">'), 'CSS deve estar no index: '+relative);
    } else {
      assert.ok(html.includes('<script src="'+relative+'"></script>'), 'bundle deve estar no index: '+relative);
    }
    for (const parte of bundle.origens) assert.ok(!html.includes('src="'+parte.replace('dist/renderer/','')+'"'), 'fragmento não pode ser carregado: '+parte);
  }
  assert.ok(html.indexOf('src="fluxos.js"') < html.indexOf('src="tela-testes.js"'), 'testes avançados dependem de Fluxos');
});


test('falha ao abrir uma tela mostra estado recuperável, sem deixar conteúdo parcial', async () => {
  const fonte = fs.readFileSync('frontend/compartilhado/runtime/app.js', 'utf8');
  const inicio = fonte.indexOf('async function mostrar(aba) {');
  const fim = fonte.indexOf('\n}\n\n(async () => {', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'função principal de navegação identificável');
  const codigo = fonte.slice(inicio, fim + 2);
  const avisos = [];
  const conteudo = { itens: [], replaceChildren(...itens) { this.itens = itens; } };
  const ambiente = {
    estado: { aba: 'inicio', root: null },
    rotasVirtuais: {},
    clearInterval() {},
    document: {
      querySelectorAll: () => [{ dataset: { aba: 'testes' }, setAttribute() {}, removeAttribute() {} }],
      createElement: () => ({ childNodes: [], replaceChildren(...itens) { this.childNodes = itens; } })
    },
    chamar: (acao) => acao(),
    api: { projetos: async () => [], espacos: async () => [] },
    $: (selector) => selector === '#conteudo' ? conteudo : { textContent: '' },
    abas: {
      testes: async (el) => {
        el.replaceChildren({ parcial: true });
        throw Error('erro interno simulado');
      }
    },
    DS: {
      acao: (titulo, executar) => ({ titulo, executar }),
      estadoTela: (tipo, titulo, descricao, acoes, opcoes) => ({ tipo, titulo, descricao, acoes, opcoes })
    },
    avisar: (texto) => avisos.push(texto),
    montarSeletorProjeto() {}
  };
  const mostrar = vm.runInNewContext('(' + codigo + ')', ambiente);
  ambiente.mostrar = mostrar;
  await mostrar('testes');
  assert.equal(conteudo.itens.length, 1, 'conteúdo parcial foi descartado');
  assert.equal(conteudo.itens[0].tipo, 'erro');
  assert.equal(conteudo.itens[0].opcoes.id, 'tela-falha-carregamento');
  assert.equal(avisos.length, 1);
  assert.equal(conteudo.itens[0].acoes.length, 1);

  ambiente.abas.testes = async (el) => { el.replaceChildren({ carregado: true }); };
  await conteudo.itens[0].acoes[0].executar();
  assert.equal(conteudo.itens[0].carregado, true, 'tentar novamente reabre a tela');
});

test('seletor lateral lista todos os projetos QA e pastas legadas sem duplicar', () => {
  const fonte = fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js','utf8');
  const inicio = fonte.indexOf('function montarSeletorProjeto(');
  const fim = fonte.indexOf('/** Trilha de telas',inicio);
  assert.ok(inicio>=0 && fim>inicio);
  class No {
    constructor(tag,attrs={},...filhos) {
      this.tag=tag;this.attrs=attrs||{};this.children=[];this.hidden=false;this.value='';this.attributes={};
      this.append(...filhos);
    }
    append(...nos){for(const n of nos.flat(Infinity))if(n!=null)this.children.push(n)}
    replaceChildren(...nos){this.children=[];this.append(...nos)}
    setAttribute(k,v){this.attributes[k]=v}
    focus(){this.focused=true}
    contains(n){return this===n||this.children.some(x=>x instanceof No&&x.contains(n))}
    get textContent(){return this.children.map(n=>n instanceof No?n.textContent:String(n)).join('')}
    querySelectorAll(sel){
      const matches=n=>sel==='button[data-seletor-item]'?n.tag==='button'&&!!n.attrs['data-seletor-item']:
        sel==='.projeto-grupo'?n.attrs.class==='projeto-grupo':false;
      const result=[];
      const walk=n=>{for(const child of n.children)if(child instanceof No){if(matches(child))result.push(child);walk(child)}};
      walk(this);return result;
    }
    querySelector(sel){
      if(sel==='button[data-seletor-item]:not([hidden])')
        return this.querySelectorAll('button[data-seletor-item]').find(n=>!n.hidden)||null;
      return null;
    }
  }
  const btn=new No('button'),list=new No('div');list.hidden=true;
  const chamadas=[], eventos=[];
  const estado={aba:'tickets',root:null,espaco:null,jobId:'anterior'};
  const ctx={estado,
    $:s=>s==='#projeto-botao'?btn:s==='#projeto-lista'?list:null,
    h:(tag,props,...children)=>new No(tag,props,...children),
    document:{addEventListener:(tipo,fn)=>eventos.push({tipo,fn})},
    paraBusca:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
    salvarRaiz:()=>chamadas.push('persistir'),
    mostrar:t=>chamadas.push(t)
  };
  vm.createContext(ctx);vm.runInContext(fonte.slice(inicio,fim),ctx);
  const projetos=[
    {id:'A',nome:'Manual',raizContextos:'',vinculos:[]},
    {id:'B',nome:'Via Jira',raizContextos:'',vinculos:[{servico:'jira'}]},
    {id:'C',nome:'GitHub',raizContextos:'C:/repos/c',pastaLocal:'C:/repos/cop' },
    {id:'D',nome:'Loja',raizContextos:''},{id:'E',nome:'Portal',raizContextos:''},{id:'F',nome:'App móvel',raizContextos:''}
  ];
  const pastas=[{root:'C:/repos/cop',name:'Duplicada'}, {root:'C:/repos/local',name:'Projeto local'}];
  // Sem nenhum projeto: só o aviso e "Criar projeto", que já abre o formulário em Projetos (pedido de 21/10/2026).
  ctx.montarSeletorProjeto([],[]);
  assert.equal(list.children.length,2);
  assert.match(list.children[0].textContent,/Nenhum projeto criado/);
  list.children[1].attrs.onclick();
  assert.equal(estado.sub.projetos,'novo');assert.equal(chamadas.at(-1),'projetos');delete estado.sub;
  // Poucos itens: sem campo de busca e sem título de grupo; o foco vai para o primeiro projeto.
  ctx.montarSeletorProjeto(projetos.slice(0,3),[]);
  assert.ok(!list.children.some(n=>n.tag==='input'));
  assert.equal(list.children[0].children.length,3,'grupo único sem título');
  btn.onclick({stopPropagation(){}});
  assert.equal(list.children[0].children[0].focused,true);
  btn.onclick({stopPropagation(){}});
  ctx.montarSeletorProjeto(projetos,pastas);
  const itens=list.querySelectorAll('button[data-seletor-item]');
  assert.equal(itens.length,7);
  assert.deepEqual(itens.filter(n=>n.attrs['data-projeto']).map(n=>n.attrs['data-projeto']),['A','B','C','D','E','F']);
  assert.equal(itens.some(n=>n.textContent==='Duplicada'),false);
  // Abrir e buscar: todos são carregados; pesquisa só altera visibilidade.
  btn.onclick({stopPropagation(){}});
  assert.equal(list.hidden,false);
  const busca=list.children[0];assert.equal(busca.focused,true);
  busca.value='Jira';busca.attrs.oninput();
  assert.equal(itens.find(n=>n.textContent.includes('Via Jira')).hidden,false);
  assert.equal(itens.find(n=>n.textContent.includes('Manual')).hidden,true);
  itens.find(n=>n.attrs['data-projeto']==='B').attrs.onclick();
  assert.equal(estado.espaco.id,'B');
  assert.equal(estado.root,'');
  assert.equal(estado.jobId,undefined);
  assert.equal(chamadas.at(-1),'tickets');
  assert.equal(list.hidden,true);
  ctx.montarSeletorProjeto(projetos,pastas);
  assert.equal(eventos.length,1,'o clique global deve ser registrado uma única vez');
  btn.onclick({stopPropagation(){}});
  assert.equal(list.hidden,false);
  eventos[0].fn({target:new No('div')});
  assert.equal(list.hidden,true,'a instância nova deve fechar ao clicar fora');
  const b=list.querySelectorAll('button[data-seletor-item]').find(n=>n.attrs['data-projeto']==='B');
  assert.equal(b.attrs['aria-current'],'true');
  list.querySelectorAll('button[data-seletor-item]').find(n=>n.attrs['data-seletor-item']==='local').attrs.onclick();
  assert.equal(estado.espaco,null);
  assert.equal(estado.root,'C:/repos/local');
  assert.equal(chamadas.at(-1),'projetos');
});
test('navegação restaura projeto por ID, sem selecionar o primeiro com raiz vazia',async()=>{
  const fonte=fs.readFileSync('frontend/compartilhado/runtime/app.js','utf8');
  const a=fonte.indexOf('async function mostrar(aba) {'),b=fonte.indexOf('\n}\n\n(async () => {',a);
  assert.ok(a>=0&&b>a);
  const selecionados=[],nome={textContent:''};
  const estado={aba:'inicio',root:null,espaco:null,projetoSelecionadoId:'B'};
  const ctx={estado,rotasVirtuais:{},clearInterval(){},
    document:{querySelectorAll:()=>[],createElement:()=>({childNodes:[],replaceChildren(...nodes){this.childNodes=nodes}})},
    chamar:fn=>fn(),api:{espacos:async()=>[
      {id:'A',nome:'Primeiro',raizContextos:''},{id:'B',nome:'Correto',raizContextos:''}
    ],projetos:async()=>[]},$:(s)=>s==='#projeto-atual'?nome:{replaceChildren(){}},
    abas:{inicio:async()=>{}},atualizarMenuDoProjeto:p=>selecionados.push(p?.id),
    montarSeletorProjeto:(p,l)=>{assert.equal(p.length,2);assert.equal(l.length,0)}
  };
  vm.createContext(ctx);await vm.runInContext('('+fonte.slice(a,b+2)+')',ctx)('inicio');
  assert.equal(estado.espaco.id,'B');
  assert.equal(nome.textContent,'Correto');
  assert.deepEqual(selecionados,['B']);
});
