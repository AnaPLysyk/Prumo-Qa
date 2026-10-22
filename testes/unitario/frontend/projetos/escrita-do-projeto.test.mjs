/** Exercita as funções reais do renderer com IPC simulado, sem perfil ou serviço externo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const projetos = fs.readFileSync('frontend/projetos/tela-projetos.js', 'utf8');
const servicos = fs.readFileSync('frontend/compartilhado/servicosExternos.js', 'utf8');
const inicio = projetos.indexOf('const AJUDA_DO_MODO =');
const fim = projetos.indexOf('/** Abre a configuração de serviços', inicio);
const inicioEscrita = servicos.indexOf('async function escritaDoProjeto(');
const fimEscrita = servicos.indexOf('\nconst vazio', inicioEscrita);

function ambiente(resposta) {
  const chamadas = [], avisos = [], telas = [];
  const permissoes = new Map();
  const contexto = vm.createContext({
    estado: { espaco: { id: 'projeto-a' } },
    DS: { fluxoProjeto: dados => dados },
    tr: texto => texto,
    avisar: (...args) => avisos.push(args),
    mostrar: tela => telas.push(tela),
    chamar: async fn => { const r = await fn(); return r.ok ? r.data : null; },
    api: {
      escritaEstado: async id => {
        chamadas.push(['consultar', id]);
        return { ok: true, data: { servicos: [{ servico: 'qase', escrita: permissoes.get(id) === true }] } };
      },
      escritaHabilitar: async (id, servico, habilitada) => {
        chamadas.push(['alterar', id, servico, habilitada]);
        if (resposta === 'confirmar') permissoes.set(id, habilitada);
        return resposta === 'falhar' ? { ok: false } : { ok: true, data: { canceled: resposta !== 'confirmar' } };
      }
    }
  });
  vm.runInContext(servicos.slice(inicioEscrita, fimEscrita) + '\n' + projetos.slice(inicio, fim), contexto);
  const projeto = id => ({ id, nome: id, vinculos: [{ servico: 'qase', recurso: { chave: 'PQ' } }] });
  const ler = id => contexto.escritaDoProjeto(projeto(id));
  const montar = async id => contexto.montarFluxoProjeto(projeto(id), () => {}, await ler(id)).servicos.find(s => s.servico === 'qase');
  return { chamadas, avisos, telas, permissoes, ler, montar };
}

test('cancelar a confirmação preserva só leitura, avisa e solicita nova renderização', async () => {
  const a = ambiente('cancelar');
  const qase = await a.montar('projeto-a');
  await qase.modo.aoAlterar(true);
  assert.equal(qase.modo.integrado, false, 'o controle não antecipa uma concessão');
  assert.equal((await a.montar('projeto-a')).modo.integrado, false);
  assert.match(a.avisos[0][0], /Alteração cancelada/);
  assert.deepEqual(a.telas, ['projetos']);
  assert.deepEqual(a.chamadas[1], ['alterar', 'projeto-a', 'qase', true]);
});

test('confirmar só habilita o projeto pedido; nova consulta retorna a concessão atual', async () => {
  const a = ambiente('confirmar');
  await (await a.montar('projeto-a')).modo.aoAlterar(true);
  assert.equal((await a.ler('projeto-a')).qase, true);
  assert.equal((await a.ler('projeto-b')).qase, false);
  assert.equal((await a.montar('projeto-a')).modo.integrado, true);
  assert.equal(a.avisos.length, 0);
  a.permissoes.set('projeto-a', false);
  assert.equal((await a.ler('projeto-a')).qase, false, 'não conserva escrita em cache');
});

test('falha de habilitação não mostra integrado e solicita nova leitura da tela', async () => {
  const a = ambiente('falhar');
  await (await a.montar('projeto-a')).modo.aoAlterar(true);
  assert.equal((await a.montar('projeto-a')).modo.integrado, false);
  assert.deepEqual(a.telas, ['projetos']);
});
