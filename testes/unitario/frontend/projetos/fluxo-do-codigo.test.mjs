/** Fluxo do código executado com DOM e IPC simulados; nenhum GitHub ou pasta real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function ambiente({ github = true, cancelar = false } = {}) {
  const chamadas = [], modais = [], avisos = []; let atualizacoes = 0;
  const e = { id: 'projeto-fixture', nome: 'Projeto A', pastaLocal: 'pasta-A', vinculos: github ? [{ servico: 'github', recurso: { chave: 'pessoa/projeto' } }] : [] };
  function h(tag, attrs = {}, ...filhos) { const no = { tag, ...attrs, dataset: {}, filhos: filhos.flat(Infinity).filter(x => x != null), append(...nos) { this.filhos.push(...nos); }, replaceChildren(...nos) { this.filhos = nos; }, querySelector() { return null; }, addEventListener(k, f) { this['on' + k] = f; }, focus() {} }; no.value ??= tag === 'select' ? no.filhos[0]?.value || '' : ''; return no; }
  const DS = { info: t => h('info', {}, t), campo: (t, n) => h('campo', {}, t, n), meta: v => h('meta', {}, v), bloco: (t, n) => h('bloco', {}, t, n), rodape: (...n) => h('rodape', {}, n), acao: (t, fn, o = {}) => h('button', { id: o.id, onclick: fn, disabled: o.desabilitado }, t), modal: (t, n) => modais.push(h('modal', { titulo: t }, n)), fecharModal() {} };
  const ok = data => ({ ok: true, data });
  const api = {
    ideCriarProjeto: async (...args) => { chamadas.push(['criar', ...args]); return ok({ canceled: cancelar }); },
    espacoObter: async () => ok(e),
    espacoTrazer: async (...args) => { chamadas.push(['clonar', ...args]); return ok({ canceled: cancelar, vinculada: true }); },
    idePublicacao: async id => { chamadas.push(['pendencias', id]); return ok({ pasta: e.pastaLocal, alterados: ['src/teste.js'], removidos: [] }); },
    idePublicar: async (...args) => { chamadas.push(['publicar', ...args]); return ok({ canceled: cancelar, ramo: 'prumo/projeto-fixture' }); },
    servicos: async () => ok([{ id: 'conta-fixture', nome: 'Minha conta', servico: 'github', ativa: true }]),
    projetosRecursos: async (...args) => { chamadas.push(['recursos', ...args]); return ok({ recursos: [{ chave: 'pessoa/existente', id: '42' }], proxima: null }); },
    projetosVincular: async (...args) => { chamadas.push(['vincular', ...args]); return ok({ canceled: true }); }
  };
  const ctx = vm.createContext({ window: {}, api, DS, h, estado: { espaco: e }, tr: t => t, avisar: t => avisos.push(t), chamar: async fn => { const r = await fn(); return r.ok ? r.data : null; }, mostrar: () => { atualizacoes++; } });
  vm.runInContext(fs.readFileSync('frontend/projetos/fluxo-do-codigo.js', 'utf8'), ctx);
  const todos = n => [n, ...(n.filhos || []).filter(x => typeof x === 'object').flatMap(todos)];
  return { fluxo: ctx.window.PrumoCodigo, e, chamadas, modais, avisos, nos: () => todos(modais.at(-1)), atualizacoes: () => atualizacoes };
}
test('publicar consulta pendências sem enviar; envio exige clique e usa apenas o projeto selecionado', async () => {
  const t = ambiente(); await t.fluxo.publicar(t.e);
  assert.deepEqual(t.chamadas, [['pendencias', t.e.id]]);
  await t.nos().find(n => n.id === 'codigo-enviar').onclick();
  assert.deepEqual(t.chamadas[1], ['publicar', t.e.id, 'Atualizar projeto pelo Prumo QA']);
  assert.equal(t.atualizacoes(), 1);
});
test('cancelar publicação preserva o editor sem recarregar a tela', async () => {
  const t = ambiente({ cancelar: true }); await t.fluxo.publicar(t.e);
  await t.nos().find(n => n.id === 'codigo-enviar').onclick();
  assert.equal(t.atualizacoes(), 0);
});
test('origem oferece trocar para clone preservando a pasta local até resposta confirmada', async () => {
  const t = ambiente({ cancelar: true }); t.fluxo.origem(t.e);
  await t.nos().find(n => n.filhos?.includes('Usar clone do GitHub na IDE')).onclick();
  assert.deepEqual(t.chamadas, [['clonar', t.e.id, true]]);
  assert.equal(t.e.pastaLocal, 'pasta-A'); assert.equal(t.atualizacoes(), 0);
});
test('sem vínculo oferece repositório existente ou criação, sem criar nada automaticamente', async () => {
  const t = ambiente({ github: false }); await t.fluxo.publicar(t.e);
  assert.equal(t.chamadas[0][0], 'recursos');
  assert.ok(t.nos().some(n => n.id === 'codigo-criar-repositorio'));
  await t.nos().find(n => n.filhos?.includes('Usar este repositório')).onclick();
  assert.deepEqual(t.chamadas[1].slice(0, 3), ['vincular', t.e.id, 'conta-fixture']);
  assert.equal(t.atualizacoes(), 0);
});
