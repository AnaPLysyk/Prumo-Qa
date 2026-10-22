import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

/** Trilha de telas: histórico das telas visitadas no topo, só da segunda em diante; clicar numa anterior volta a ela. */
function montar() {
  const codigo = fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js', 'utf8');
  const trecho = codigo.slice(codigo.indexOf('/** Trilha de telas'), codigo.indexOf('/** Marca o projeto ativo'));
  assert.ok(trecho.includes('function desenharTrilha'));
  const conteudo = { filhos: [], prepend(n) { this.filhos.unshift(n); } };
  const abertas = [];
  const rotulos = { inicio: 'Início', projetos: 'Projetos', agentes: 'Agentes', testes: 'Testes' };
  const ctx = {
    mostrar: async (aba) => { abertas.push(aba); ctx.registrarTela(aba); ctx.desenharTrilha(); },
    DS: { trilha: (itens, op) => ({ itens, op, replaceWith(n) { conteudo.filhos[conteudo.filhos.indexOf(this)] = n; }, remove() { conteudo.filhos.splice(conteudo.filhos.indexOf(this), 1); } }) },
    document: {
      querySelector: (s) => { const aba = /data-aba="(\w+)"/.exec(s)?.[1]; return rotulos[aba] ? { textContent: rotulos[aba] } : null; },
      getElementById: (id) => id === 'conteudo' ? conteudo : conteudo.filhos.find(n => n.id === id) || null
    }
  };
  vm.createContext(ctx); vm.runInContext(trecho, ctx);
  const atual = () => conteudo.filhos[0]?.itens ? Array.from(conteudo.filhos[0].itens, i => i[0]) : null;
  const ir = (aba) => { ctx.registrarTela(aba); ctx.desenharTrilha(); };
  return { ctx, conteudo, abertas, atual, ir };
}

test('na primeira tela não há trilha; da segunda em diante ela aparece no topo', () => {
  const t = montar();
  t.ir('inicio');
  assert.equal(t.atual(), null);
  t.ir('projetos');
  assert.deepEqual(t.atual(), ['Início', 'Projetos']);
  t.ir('agentes');
  assert.deepEqual(t.atual(), ['Início', 'Projetos', 'Agentes']);
});

test('voltar a uma tela já visitada corta a trilha ali, e clicar numa anterior abre essa tela', () => {
  const t = montar();
  for (const a of ['inicio', 'projetos', 'agentes']) t.ir(a);
  const itens = t.conteudo.filhos[0].itens;
  assert.equal(itens[2][1], null, 'a tela atual não é link');
  itens[1][1]();
  assert.deepEqual(t.abertas, ['projetos']);
  assert.deepEqual(t.atual(), ['Início', 'Projetos']);
  t.ir('inicio');
  assert.equal(t.atual(), null, 'de volta à primeira tela a trilha some');
});

test('etapas dentro da tela entram depois do nome dela e o nome da tela vira link', () => {
  const t = montar();
  t.ir('inicio'); t.ir('agentes');
  t.ctx.definirDetalheDaTrilha([['Agente QA', () => {}], ['Cérebro']]);
  assert.deepEqual(t.atual(), ['Início', 'Agentes', 'Agente QA', 'Cérebro']);
  assert.equal(typeof t.conteudo.filhos[0].itens[1][1], 'function');
  t.ctx.definirDetalheDaTrilha();
  assert.deepEqual(t.atual(), ['Início', 'Agentes']);
  t.ctx.definirDetalheDaTrilha([['Novo projeto']]);
  t.ir('testes');
  assert.deepEqual(t.atual(), ['Início', 'Agentes', 'Testes'], 'trocar de tela limpa as etapas da anterior');
});

test('uma tela sozinha com etapa mostra a trilha; a trilha guarda no máximo seis telas', () => {
  const t = montar();
  t.ir('projetos');
  t.ctx.definirDetalheDaTrilha([['Novo projeto']]);
  assert.deepEqual(t.atual(), ['Projetos', 'Novo projeto']);
  const t2 = montar();
  for (const a of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']) t2.ir(a);
  assert.equal(t2.atual().length, 6);
  assert.equal(t2.atual()[0], 'a2');
});
