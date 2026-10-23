/** Executa o fluxo do renderer com DOM e IPC simulados; sem Electron ou projeto real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function tela({ resultado = null, somenteVer = false, salvarFalha = false, cancelar = false } = {}) {
  const chamadas = [], modais = [], avatares = [], salvos = []; let voltas = 0;
  const alvo = { tag: 'painel', filhos: [], replaceChildren(...nos) { this.filhos = nos.flat(Infinity).filter(x => x != null); } };
  function h(tag, attrs = {}, ...filhos) {
    return { tag, value: '', dataset: Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5),v])), ...attrs, filhos: filhos.flat(Infinity).filter(x => x != null), append(...nos) { this.filhos.push(...nos); }, setAttribute(k, v) { this[k] = v; }, focus() { this.focou = true; } };
  }
  const caso = { casoId: 1, casoLocalId: 'local-1', titulo: 'Primeiro cenário', resultado };
  const segundo = { casoId: 2, casoLocalId: 'local-2', titulo: 'Segundo cenário', resultado: null };
  const run = { id: 'run-fixture', titulo: 'Run manual', casos: [caso, segundo] };
  const api = {
    runAndamento: async (...args) => { chamadas.push([args[2] == null ? 'consulta' : 'inicio', ...args]); return { ok: true, data: [{ em: '2026-10-22T12:00:00.000Z', por: { nome: 'Pessoa', login: 'fixture' } }] }; },
    repositorioLocal: async () => ({ ok: true, data: { casos: [{ id: 'local-1', dados: { descricao: 'Requisito', passos: [{ acao: 'Abrir formulário', esperado: 'Campos visíveis' }] } }] } }),
    runResultado: async (...args) => {
      chamadas.push(['resultado', ...args]);
      if (salvarFalha) return { ok: false };
      return { ok: true, data: cancelar ? { canceled: true } : { canceled: false, run: { ...run, casos: [{ ...caso, resultado: { status: args[2] } }, segundo] } } };
    }
  };
  const DS = { avatar: u => { avatares.push(u); return h('avatar', {}, u.nome); }, chip: t => h('chip', {}, t), texto: t => h('texto', {}, t), bloco: (t, no) => h('bloco', {}, t, no), info: t => h('info', {}, t), rodape: (...nos) => h('rodape', {}, nos), acao: (t, fn, o = {}) => h('button', { id: o.id, onclick: fn, disabled: !!o.desabilitado }, t), modal: (titulo, nos) => modais.push(h('modal', { titulo }, nos)) };
  const ctx = vm.createContext({ h, DS, api, window: { PrumoConta: { soVer: () => somenteVer } }, tr: t => t, hora: t => t, chamar: async fn => { const r = await fn(); return r.ok ? r.data : null; }, memoriaDaTela: () => ({}), vinc: () => false });
  vm.runInContext(fs.readFileSync('frontend/testes/execucao-manual.parte.js', 'utf8') + '\nglobalThis.executar = executarCasoLocal;', ctx);
  const todos = n => [n, ...(n.filhos || []).filter(x => typeof x === 'object').flatMap(todos)];
  return { chamadas, modais, avatares, salvos, abrir: () => ctx.executar({ id: 'projeto' }, run, caso, { alvo, aoSalvar: async (seguinte) => { voltas++; salvos.push(seguinte || null); } }), nos: () => todos(alvo), voltas: () => voltas };
}

test('abrir inicia o caso, mostra a foto do perfil e os passos; salvar avança após persistir', async () => {
  const t = tela(); await t.abrir();
  assert.deepEqual(t.chamadas, [['inicio', 'projeto', 'run-fixture', 1]]);
  assert.equal(t.avatares[0].login, 'fixture');
  assert.ok(t.nos().some(n => n.filhos?.includes('Abrir formulário')));
  await t.nos().find(n => n.filhos?.includes('Aprovado')).onclick();
  await t.nos().find(n => n.id === 'manual-salvar').onclick();
  assert.deepEqual(t.chamadas.map(c => c[0]), ['inicio', 'resultado']);
  assert.equal(t.chamadas[1][3], 'PASS');
  assert.equal(t.salvos.at(-1)?.casoId, 2, 'a página da run recebe o próximo caso manual pendente');
});

test('falha ou cancelamento ao salvar mantém o caso e não inicia o próximo', async () => {
  for (const opcoes of [{ salvarFalha: true }, { cancelar: true }]) {
    const t = tela(opcoes); await t.abrir();
    t.nos().find(n => n.filhos?.includes('Pulado')).onclick();
    await t.nos().find(n => n.id === 'manual-salvar').onclick();
    assert.deepEqual(t.chamadas.map(c => c[0]), ['inicio', 'resultado']);
    assert.equal(t.salvos.length, 0);
    assert.equal(t.voltas(), 0);
  }
});

test('NOT_RUN retoma manualmente; resultado de automação e permissão VER impedem edição', async () => {
  const pendente = tela({ resultado: { status: 'NOT_RUN', origem: 'EXECUCAO' } }); await pendente.abrir();
  assert.equal(pendente.chamadas[0][0], 'inicio');
  for (const opcoes of [{ somenteVer: true }, { resultado: { status: 'FAIL', origem: 'EXECUCAO' } }]) {
    const t = tela(opcoes); await t.abrir();
    assert.equal(t.chamadas.length, 1);
    assert.equal(t.chamadas[0][0], 'consulta');
    assert.equal(t.nos().find(n => n.id === 'manual-salvar').disabled, true);
  }
});

test('reprovar exige observação antes de chamar a persistência', async () => {
  const t = tela(); await t.abrir();
  t.nos().find(n => n.filhos?.includes('Reprovado')).onclick();
  await t.nos().find(n => n.id === 'manual-salvar').onclick();
  assert.equal(t.chamadas.length, 1);
  assert.match(t.nos().find(n => n.role === 'alert').textContent, /mínimo/);
});

test('editar resultado manual mantém a observação anterior no campo editável', async () => {
  const t = tela({ resultado: { status: 'FAIL', origem: 'MANUAL', comentario: 'Mensagem anterior' } });
  await t.abrir();
  assert.equal(t.nos().find(n => n.id === 'manual-comentario').value, 'Mensagem anterior');
  assert.equal(t.nos().find(n => n.id === 'manual-salvar').disabled, false);
});
