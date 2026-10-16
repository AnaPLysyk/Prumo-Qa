/** Conexões: componentes DOM simulados, sem Electron, rede ou banco de dados. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../');
const fonte=readFileSync(path.join(raiz,'frontend/conexoes/mostrarConexoes.js'),'utf8');
class Elemento {
  constructor(tag,attrs={},filhos=[]) {
    this.tag=tag;this.attrs=attrs;this.children=[];this.parent=null;this.listeners={};
    this.value=attrs.value??'';this.textContent='';this.checked=false;this.disabled=false;
    this.placeholder=attrs.placeholder??'';
    this.append(...filhos);
    if(tag==='select')this.value=this.children.find(x=>x instanceof Elemento&&x.tag==='option')?.value??'';
  }
  append(...itens) {for(const c of itens.flat(Infinity)){if(c==null)continue;if(c instanceof Elemento){if(c.parent)c.parent.children=c.parent.children.filter(x=>x!==c);c.parent=this;}this.children.push(c);}}
  replaceChildren(...items){for(const c of this.children)if(c instanceof Elemento)c.parent=null;this.children=[];this.append(...items);}
  addEventListener(e,cb){this.listeners[e]=cb;}
  dispatchEvent(ev){return this.listeners[ev.type]?.(ev);}
  querySelectorAll(selector){const out=[];const matches=n=>selector.startsWith('#')?n.attrs.id===selector.slice(1):selector.startsWith('[data-codigo')?n.attrs['data-codigo']!==undefined:n.tag===selector;
    const scan=n=>{for(const c of n.children)if(c instanceof Elemento){if(matches(c))out.push(c);scan(c);}};scan(this);return out;}
  querySelector(s){return this.querySelectorAll(s)[0]??null;}
}
function montar() {
  const chamadas=[],notificacoes=[],telas=[],pendentes=new Map();
  const h=(tag,attrs,...filhos)=>new Elemento(tag,attrs,filhos);
  const botao=(label,cb,id)=>h('button',{id,onclick:cb},label);
  const campoPlataforma=(titulo,attrs={})=>{const input=h('input',attrs);return{input,no:h('label',{class:'campo'},titulo,input)};};
  const api={
    servicos:async()=>[],
    qasePrever:async token=>{chamadas.push(['prever',token]);return{ok:true,data:{previaId:'preview',projetos:[
      {codigo:'PQ',nome:'Prumo QA',jaImportado:false},{codigo:'EX',nome:'Exemplo',jaImportado:true}]}};},
    qaseCancelar:async id=>{chamadas.push(['cancelar',id]);return{ok:true,data:{cancelada:true}};},
    qaseImportar:async(id,codigos)=>{chamadas.push(['importar',id,codigos]);return{ok:true,data:{adicionados:codigos,existentes:[],falhas:[]}};},
    servicoAdicionar:async dados=>{chamadas.push(['adicionar',{...dados}]);return{ok:true,data:{id:'fake'}};}
  };
  const ctx={h,botao,campoPlataforma,abas:{},api,estado:{espaco:null},avisar:(...xs)=>notificacoes.push(xs),
    chamar:async fn=>{const r=await fn();return r.ok?r.data:null;},mostrar:name=>telas.push(name),hora:String};
  vm.createContext(ctx);vm.runInContext(fonte,ctx);
  const tela=h('main',{});
  return ctx.abas.conexoes(tela).then(()=>{
    const abrir=()=>tela.querySelector('#conexao-nova').attrs.onclick();
    const alterar=async servico=>{const x=tela.querySelector('#conexao-servico');x.value=servico;await x.dispatchEvent({type:'change'});};
    const clicar=async id=>{const b=tela.querySelector('#'+id);assert.ok(b,'Botão ausente: '+id);return b.attrs.onclick();};
    return {tela,abrir,alterar,clicar,chamadas,notificacoes,telas};
  });
}
test('Qase pede apenas token; nome da conexão e dados do Jira ficam ausentes',async()=>{
  const v=await montar();v.abrir();
  assert.equal(v.tela.querySelector('#conexao-nome'),null);
  assert.equal(v.tela.querySelector('#conexao-instancia'),null);
  assert.equal(v.tela.querySelector('#conexao-usuario'),null);
  assert.ok(v.tela.querySelector('#conexao-token'));
  assert.ok(v.tela.querySelector('#qase-conectar'));
});
test('Qase consulta projetos antes de salvar, permite selecionar múltiplos e importa somente os selecionados',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='token-sintetico';
  await v.clicar('qase-conectar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever']);
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
  const caixas=v.tela.querySelectorAll('[data-codigo]');
  assert.equal(caixas.length,2);
  caixas[0].checked=true;caixas[0].dispatchEvent({type:'change'});
  await v.clicar('qase-importar');
  assert.equal(v.chamadas[1][0],'importar');
  assert.deepEqual(Array.from(v.chamadas[1][2]),['PQ']);
  assert.deepEqual(v.telas,['projetos']);
});
test('Qase pode selecionar todos, buscar e desmarcar registros visíveis',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='abc';
  await v.clicar('qase-conectar');
  const total=v.tela.querySelector('#qase-todos');
  total.checked=true;total.dispatchEvent({type:'change'});
  const b=v.tela.querySelector('#qase-busca');b.value='Prumo';b.dispatchEvent({type:'input'});
  const encontrados=v.tela.querySelectorAll('[data-codigo]');
  assert.equal(encontrados.length,1);
  assert.equal(encontrados[0].checked,true);
  await v.clicar('qase-importar');
  assert.deepEqual(new Set(v.chamadas[1][2]),new Set(['PQ','EX']));
});
test('Cancelar Qase descarta a prévia e não importa projetos',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='fake';
  await v.clicar('qase-conectar');
  const botao=v.tela.querySelector('#conexao-qase-projetos').querySelectorAll('button').find(x=>x.children.includes('Cancelar importação'));
  await botao.attrs.onclick();
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever','cancelar']);
});
test('Jira requer nome, instância, email e token; GitHub não herda campos Jira',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  assert.ok(v.tela.querySelector('#conexao-nome'));
  assert.ok(v.tela.querySelector('#conexao-instancia'));
  assert.ok(v.tela.querySelector('#conexao-usuario'));
  v.tela.querySelector('#conexao-nome').value='Jira QA';
  v.tela.querySelector('#conexao-instancia').value='https://qa.atlassian.net';
  v.tela.querySelector('#conexao-usuario').value='qa@example.test';
  v.tela.querySelector('#conexao-token').value='fake';
  await v.clicar('conexao-salvar');
  assert.equal(v.chamadas[0][1].servico,'jira');
  assert.equal(v.chamadas[0][1].usuario,'qa@example.test');
  await v.alterar('github');
  assert.equal(v.tela.querySelector('#conexao-instancia'),null);
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
  assert.ok(v.tela.querySelector('#conexao-nome'));
});
