/** A gestão de conexões pertence a Projetos; contas não se confundem com identidade de login. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/projetos/tela-projetos.js','utf8');
const render = fonte.slice(0,fonte.indexOf('async function mostrarOperacoesExternas('));
function contexto(resposta) {
  const itens=[],chamadas=[];
  const ctx={
    abas:{},estado:{espaco:null},
    api:{servicos:async()=>resposta},
    chamar:async fn=>fn(),
    h:(tag,attrs,...children)=>({tag,attrs,children}),
    botao:(titulo,fn,id)=>({titulo,id,fn}),
    DS:{
      estadoTela:(tipo,titulo,descricao,acoes,opcoes)=>({tipo,titulo,descricao,acoes,opcoes}),
      acao:(titulo,fn)=>({titulo,fn}),
      chip:titulo=>({titulo}),info:titulo=>({titulo})
    },
    criarApresentacaoProjetosQase:()=>()=>{},
    criarAberturaFormularioConexao:()=>()=>{},
    mostrarOperacoesExternas:async()=>{chamadas.push('operacoes')},
    mostrarIntegracoesDosAgentes:async()=>{chamadas.push('agentes')}
  };
  vm.createContext(ctx);
  vm.runInContext(render,ctx);
  return {ctx,itens,chamadas};
}
test('Conexões não existe como menu ou script independente',()=>{
  const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
  assert.doesNotMatch(html,/data-aba="conexoes"|telas\/conexoes\/tela-conexoes\.js/);
  assert.match(html,/telas\/projetos\/tela-projetos\.js/);
  assert.match(fonte,/async function mostrarConexoesDoProjeto\(el, e, servicoDesejado = null, opcoes = \{\}\)/);
  assert.match(fonte,/function montarSecaoProjeto\(espaco, projetos, escrita = null\)/);
  assert.match(fonte,/function abrirConexao\(servico\)/);
  assert.doesNotMatch(fonte,/montarConfiguracoesDoProjeto/, 'não reabrir antiga seção expansível');
});
test('Validações do Qase, Jira, GitHub e credenciais seguem dentro de Projetos',()=>{
  for(const regex of [/function criarApresentacaoProjetosQase/,/qaseImportar\(/,
    /function blocoPermissoes\(/,/const permissoesDoToken=/,/function criarAberturaFormularioConexao/,
    /qasePrever\(/,/api\.servicoAdicionar\(/]) assert.match(fonte,regex);
  assert.doesNotMatch(fonte,/api\.contaEntrar\(|api\.contaCadastrar\(/);
  assert.match(fs.readFileSync('backend/conexoes/banco/credenciais.ts','utf8'),/salvarCredencial/);
});
test('Falha de consulta mostra erro, nunca ausência de contas',async()=>{
  const {ctx,itens}=contexto(null);
  await ctx.mostrarConexoesDoProjeto({append:(...n)=>itens.push(...n)},null);
  assert.equal(itens.at(-1).tipo,'erro');
  assert.equal(itens.at(-1).opcoes.id,'conexoes-falha-consulta');
  assert.equal(itens.at(-1).acoes.length,1);
});
test('Conta vazia é uma lista válida dentro de Projetos, sem chamar integrações de outro projeto',async()=>{
  const {ctx,itens,chamadas}=contexto([]);
  await ctx.mostrarConexoesDoProjeto({append:(...n)=>itens.push(...n)},null);
  assert.equal(itens.at(-1).attrs.id,'cx-servicos');
  assert.deepEqual(chamadas,['operacoes']);
});
