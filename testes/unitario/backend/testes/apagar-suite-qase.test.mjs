import test from 'node:test';
import assert from 'node:assert/strict';
import { destinoDoPedido } from '../../../../dist/conexoes/integracoes/requisicoes.js';
import { apagarSuiteNoQase } from '../../../../dist/testes/integracoes/casosQase.js';
import { ErroServico } from '../../../../dist/conexoes/integracoes/configuracaoDosServicos.js';

const pedido = (caminho) => ({ servico: 'qase', instancia: 'https://api.qase.io', caminho, headers: {} });
const rec = { chave: 'PRQ' };
const contexto = ({ casos = 0, suites = [], aposApagar = 'ausente' } = {}) => {
  const envios = []; let apagada = false;
  return { envios, ctx: {
    ler: async (caminho) => {
      if (caminho.startsWith('/v1/suite/PRQ/7')) { if (apagada && aposApagar === 'ausente') throw new ErroServico('SERVICE_NOT_FOUND'); return { result: { id: 7, cases_count: casos } }; }
      if (caminho.startsWith('/v1/suite/PRQ')) return { result: { entities: suites, total: suites.length, filtered: suites.length } };
      throw new Error('leitura inesperada ' + caminho);
    },
    enviar: async (metodo, caminho, corpo) => { envios.push([metodo, caminho, corpo]); apagada = true; return {}; }
  } };
};

test('DELETE só é aceito para suíte do Qase; caso, plano e outros serviços continuam bloqueados', () => {
  assert.equal(destinoDoPedido(pedido('/v1/suite/PRQ/7'), 'DELETE').pathname, '/v1/suite/PRQ/7');
  for (const c of ['/v1/case/PRQ/7', '/v1/plan/PRQ/7', '/v1/run/PRQ/7', '/v1/suite/PRQ']) assert.throws(() => destinoDoPedido(pedido(c), 'DELETE'), /SERVICE_WRITE_BLOCKED/, c);
  assert.throws(() => destinoDoPedido({ ...pedido('/rest/api/3/issue/APP-1'), servico: 'jira', instancia: 'https://acme.atlassian.net' }, 'DELETE'), /SERVICE_WRITE_BLOCKED/);
});

test('apagar suíte vazia envia DELETE e confirma pela ausência; com casos ou suítes filhas nada é enviado', async () => {
  const ok = contexto();
  const r = await apagarSuiteNoQase.executar(ok.ctx, rec, { suiteId: 7 }, 'k', {});
  assert.deepEqual(ok.envios, [['DELETE', '/v1/suite/PRQ/7', '']]); assert.equal(r.id, '7');
  assert.equal(await apagarSuiteNoQase.confirmar(ok.ctx, rec, { suiteId: 7 }, r, 'k'), true);
  for (const dados of [{ casos: 2 }, { suites: [{ id: 8, parent_id: 7 }] }]) {
    const c = contexto(dados);
    await assert.rejects(apagarSuiteNoQase.executar(c.ctx, rec, { suiteId: 7 }, 'k', {}), /SERVICE_WRITE_BLOCKED/);
    assert.deepEqual(c.envios, []);
  }
  assert.equal(await apagarSuiteNoQase.confirmar(contexto({ aposApagar: 'presente' }).ctx, rec, { suiteId: 7 }, {}, 'k'), false);
});
