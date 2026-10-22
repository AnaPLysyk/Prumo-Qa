/** Exercita a publicação Prumo → Qase em memória, com serviços sintéticos: nada vai a um Qase real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { esquemaCaso } from '../../../../dist/testes/tipos/escritaQase.js';

const fonte = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
const ini = fonte.indexOf('  /** Dados do cenário no formato que a operação de criar caso');
const fim = fonte.indexOf('  /** Janela de confirmação antes de publicar');
assert.ok(ini > 0 && fim > ini);

function montar({ suitesQase = [], resposta = {} } = {}) {
  const chamadas = { ops: [], assoc: [], avisos: [] };
  const mem = { casos: 1, suites: { itens: suitesQase } };
  const ctx = {
    textoErro: (e) => String(e), tr: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k]) : s), avisar: (t, erro) => chamadas.avisos.push({ t, erro }),
    memoriaDaTela: () => mem, atualizarEspaco: async () => {},
    vinc: (_e, s) => (s === 'qase' ? { id: 'vq', recurso: { chave: 'SFQ' } } : s === 'jira' ? { id: 'vj', recurso: { chave: 'KAN', instancia: 'x' } } : null),
    escritaDoProjeto: async () => ({ qase: resposta.semEscrita ? false : true }),
    relacoesDe: (_e, _t, id) => (id === 'c1' ? [{ id: 'r1' }] : []), outroLado: () => ({ tipo: 'jira', id: 'KAN-3' }),
    F: { carregarQase: async () => ({ itens: suitesQase }) },
    api: {
      repositorioLocal: async () => ({ ok: true, data: { suites: [{ id: 's1', titulo: 'Pedidos', descricao: '' }, { id: 's2', titulo: 'Checkout', descricao: '' }], casos: [] } }),
      espacoAssociar: async (id, d) => { chamadas.assoc.push(d); return { ok: true }; }
    },
    executarOperacao: async (_e, op, p) => {
      chamadas.ops.push({ op, p });
      if (op === 'qase.criar_suite') return { estado: 'CONFIRMADA', remoto: { id: '77' } };
      return resposta.falhaCaso ? { estado: 'ENVIADA', erro: 'não confirmado' } : { estado: 'CONFIRMADA', remoto: { id: String(200 + chamadas.ops.length) } };
    }
  };
  vm.createContext(ctx); vm.runInContext(fonte.slice(ini, fim) + '\nthis.publicar = publicarNoQase;', ctx);
  return { ctx, chamadas, mem };
}
const caso = (id, titulo, suiteLocalId, extra = {}) => ({ chave: 'local:' + id, titulo, local: { id, titulo, suiteLocalId, dados: { titulo, descricao: 'd', preCondicoes: 'pre', posCondicoes: 'pos', automacao: 'manual', tags: ['a'],
  passos: [{ acao: 'que existe', formato: 'bdd', palavra: 'Dado' }, { acao: 'Abrir', esperado: 'Abriu', dados: '' }], severidade: 3, ...extra } } });

test('publica caso numa suíte que já existe e deixa o vínculo para não duplicar', async () => {
  const a = montar({ suitesQase: [{ id: 5, title: 'pedidos' }] }); let fim = 0;
  await a.ctx.publicar({ id: 'p1' }, [caso('c1', 'Cancelar pedido', 's1')], { aoConcluir: () => { fim++; } });
  assert.deepEqual(a.chamadas.ops.map(o => o.op), ['qase.criar_caso']);
  const p = a.chamadas.ops[0].p;
  assert.doesNotThrow(() => esquemaCaso.parse(JSON.parse(JSON.stringify(p))), 'o Qase/IPC aceita exatamente o que a tela envia');
  assert.equal(p.suiteId, 5); assert.equal(p.ticket, 'KAN-3'); assert.equal(p.severidade, 3); assert.deepEqual(Array.from(p.tags), ['a']);
  assert.deepEqual(JSON.parse(JSON.stringify(p.passos[0])), { acao: 'que existe', esperado: '', dados: '', formato: 'bdd', palavra: 'Dado' });
  assert.equal('formato' in p.passos[1], false);
  assert.equal(a.chamadas.assoc.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(a.chamadas.assoc[0])), { de: { tipo: 'caso-local', id: 'c1', origem: 'prumo' }, para: { tipo: 'qase', id: '201', vinculoId: 'vq', origem: 'SFQ' }, justificativa: 'Publicado no Qase a partir do Prumo' });
  assert.equal(fim, 1); assert.equal(a.mem.casos, undefined, 'a lista do Qase é relida');
  assert.match(a.chamadas.avisos.at(-1).t, /^1 cenário publicado no Qase/);
});

test('cria a suíte quando o Qase não tem uma com o mesmo nome, antes do caso', async () => {
  const a = montar();
  await a.ctx.publicar({ id: 'p1' }, [caso('c2', 'Frete grátis', 's2')], { aoConcluir: () => {} });
  assert.deepEqual(a.chamadas.ops.map(o => o.op), ['qase.criar_suite', 'qase.criar_caso']);
  assert.equal(a.chamadas.ops[0].p.titulo, 'Checkout'); assert.equal(a.chamadas.ops[1].p.suiteId, 77);
});

test('caso não confirmado pelo Qase não vira vínculo nem é dado como publicado', async () => {
  const a = montar({ resposta: { falhaCaso: true } });
  await a.ctx.publicar({ id: 'p1' }, [caso('c3', 'Sem confirmação', null)], { aoConcluir: () => {} });
  assert.equal(a.chamadas.assoc.length, 0);
  assert.equal(a.chamadas.avisos.at(-1).erro, true);
});

test('sem escrita habilitada no Qase nada é enviado', async () => {
  const a = montar({ resposta: { semEscrita: true } });
  await a.ctx.publicar({ id: 'p1' }, [caso('c4', 'Bloqueado', null)], { aoConcluir: () => {} });
  assert.equal(a.chamadas.ops.length, 0); assert.equal(a.chamadas.avisos.at(-1).erro, true);
});
