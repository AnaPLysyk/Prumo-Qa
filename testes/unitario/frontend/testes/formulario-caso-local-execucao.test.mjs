/** Exercita o formulário do renderer em memória, com ponte IPC sintética: não inicia navegador nem banco. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const codigo = fs.readFileSync(path.join(raiz, 'frontend/testes/formularios/montarFormularioProposta.js'), 'utf8');
const botaoReal = fs.readFileSync(path.join(raiz, 'frontend/compartilhado/criarBotaoAcao.js'), 'utf8');

function montarContexto() {
  const chamadas = []; const avisos = []; let concluidos = 0;
  class No {
    constructor(tag, attrs, filhos) {
      this.tag = tag; this.attrs = attrs || {}; this.parent = null;
      this.children = []; this.value = this.attrs.value == null ? '' : String(this.attrs.value);
      this.disabled = false; this.onclick = this.attrs.onclick || null;
      this.append(...itens(filhos));
      if (tag === 'textarea' && filhos.length) this.value = String(filhos[0]);
      if (tag === 'select') {
        const selecionada = this.children.find(f => f instanceof No && f.attrs.selected) ??
          this.children.find(f => f instanceof No && f.tag === 'option');
        this.value = selecionada?.value || '';
      }
    }
    append(...filhos) { for (const f of itens(filhos)) { if (f instanceof No) f.parent = this; this.children.push(f); } }
    replaceChildren(...filhos) { this.children = []; this.append(...filhos); }
    focus() { this.focused = true; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    querySelectorAll(selector) {
      const resultado = [];
      const corresponde = no => selector.startsWith('#') ? no.attrs.id === selector.slice(1)
        : selector.startsWith('.') ? String(no.attrs.class || '').split(' ').includes(selector.slice(1))
        : no.tag === selector;
      const andar = no => { for (const f of no.children) if (f instanceof No) { if (corresponde(f)) resultado.push(f); andar(f); } };
      andar(this); return resultado;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  function itens(arr) { return arr.flat(Infinity).filter(x => x != null && x !== false); }
  const h = (tag, attrs, ...filhos) => new No(tag, attrs, filhos);
  const campo = (_rotulo, attrs) => {
    const input = h('input', attrs);
    return { input, no: h('div', {}, input) };
  };
  const ctx = {
    h, campoPlataforma: campo, campoTexto: (_rotulo, id, attrs) => campo('', { ...attrs, id }),
    avisar: texto => avisos.push(texto),
    api: {
      casoLocalSalvar: async dados => { chamadas.push({ fn: 'casoLocalSalvar', dados }); return { ok: true, data: { id: 'novo' } }; },
      propostaCriar: async (...args) => { chamadas.push({ fn: 'propostaCriar', args }); return { ok: true }; },
      propostaEditar: async (...args) => { chamadas.push({ fn: 'propostaEditar', args }); return { ok: true }; }
    }
  };
  vm.createContext(ctx);
  vm.runInContext(botaoReal + '\n' + codigo +
    '\nthis.abrirFormulario = (espaco, caso, suites) => formularioProposta(espaco, caso, () => this.fechou(), suites);', ctx);
  ctx.fechou = () => { concluidos++; };
  return { ctx, chamadas, avisos, get concluidos() { return concluidos; } };
}
const preencher = (form, id, valor) => {
  const no = form.querySelector('#' + id);
  assert.ok(no, 'campo visível: ' + id);
  no.value = valor;
};
async function salvar(form) {
  const b = form.querySelector('#pr-salvar');
  assert.ok(b, 'botão de salvar disponível');
  await b.onclick({ currentTarget: b });
}

test('UI real do formulário envia criação local com passos e suíte somente ao IPC local', async () => {
  const a = montarContexto();
  const form = a.ctx.abrirFormulario({ id: 'projeto-1', vinculos: [] }, null, [{ id: 'suite-1', titulo: 'Login' }]);
  preencher(form, 'pr-titulo', 'Validar acesso');
  preencher(form, 'pr-descricao', 'Exibir acesso autorizado');
  preencher(form, 'pr-suite-local', 'suite-1');
  const passo = form.querySelectorAll('.passo')[0];
  passo.querySelector('.passo-acao').value = 'Informar login';
  passo.querySelector('.passo-esperado').value = 'Acesso permitido';
  passo.querySelector('.passo-dados').value = 'usuario=qa.teste';
  await salvar(form);
  assert.equal(a.chamadas.length, 1);
  const { fn, dados } = a.chamadas[0];
  assert.equal(fn, 'casoLocalSalvar');
  assert.equal(dados.espacoId, 'projeto-1');
  assert.equal(dados.suiteLocalId, 'suite-1');
  assert.equal(dados.dados.titulo, 'Validar acesso');
  assert.deepEqual(JSON.parse(JSON.stringify(dados.dados.passos)), [{ acao: 'Informar login', esperado: 'Acesso permitido', dados: 'usuario=qa.teste' }]);
  assert.equal(a.concluidos, 1);
  assert.match(a.avisos[0], /somente neste computador/);
});
test('edição local migra ID legado, retém suíte selecionada e não envia referências remotas como caso', async () => {
  const a = montarContexto();
  const antigo = { id: 'caso-antigo', suiteLocalId: 'suite-2', dados: {
    titulo: 'Caso antigo', suiteId: 17, ticket: 'ABC-10', descricao: 'Descrição', passos: [{ acao: 'Inserir', esperado: 'Ok', dados: 'id=legado' }], automacao: 'manual'
  }, requisito: 'REQ-02', risco: 'Crítico' };
  const form = a.ctx.abrirFormulario({ id: 'projeto-1', vinculos: [] }, antigo, [{ id: 'suite-2', titulo: 'Atual' }]);
  assert.equal(form.querySelector('#pr-suite-local').value, 'suite-2');
  preencher(form, 'pr-titulo', 'Caso atualizado');
  await salvar(form);
  assert.equal(a.chamadas.length, 1);
  const { fn, dados } = a.chamadas[0];
  assert.equal(fn, 'casoLocalSalvar');
  assert.equal(dados.id, 'caso-antigo');
  assert.equal(dados.suiteLocalId, 'suite-2');
  assert.equal(dados.dados.ticket, undefined);
  assert.equal(dados.dados.passos[0].dados, 'id=legado', 'editar não pode perder dados de teste já salvos');
  assert.equal(dados.dados.suiteId, undefined);
  assert.equal(dados.requisito, 'REQ-02');
  assert.equal(dados.risco, 'Crítico');
});
test('modo Qase conserva a proposta separada e não chama cadastro local', async () => {
  const a = montarContexto();
  const form = a.ctx.abrirFormulario({ id: 'projeto-1', vinculos: [{ servico: 'qase' }] }, null, []);
  preencher(form, 'pr-titulo', 'Cenário remoto');
  preencher(form, 'pr-ticket', 'abc-15');
  preencher(form, 'pr-suite', '42');
  await salvar(form);
  assert.equal(a.chamadas.length, 1);
  assert.equal(a.chamadas[0].fn, 'propostaCriar');
  const args = a.chamadas[0].args;
  assert.equal(args[0], 'projeto-1');
  assert.equal(args[2].suiteId, 42);
  assert.equal(args[2].ticket, 'ABC-15');
  assert.match(a.avisos[0], /Nada foi enviado ao Qase/);
});
test('falha no IPC mantém formulário aberto e mostra a mensagem, sem sucesso falso', async () => {
  const a = montarContexto();
  a.ctx.api.casoLocalSalvar = async () => ({ ok: false, error: 'LOCAL_CASE_SCOPE' });
  const form = a.ctx.abrirFormulario({ id: 'projeto-1', vinculos: [] }, null, []);
  preencher(form, 'pr-titulo', 'Título válido');
  await salvar(form);
  assert.equal(a.concluidos, 0);
  assert.equal(a.avisos.length, 0);
  const saida = form.querySelector('#pr-saida');
  assert.equal(saida.children[0].attrs.class, 'nota erro');
  assert.equal(saida.children[0].children[0], 'LOCAL_CASE_SCOPE');
});
test('o botão de salvar impede submissões simultâneas e reativa após resposta', async () => {
  const a = montarContexto();
  let liberar;
  a.ctx.api.casoLocalSalvar = async dados => { a.chamadas.push({ fn: 'casoLocalSalvar', dados }); await new Promise(resolve => { liberar = resolve; }); return { ok: true }; };
  const form = a.ctx.abrirFormulario({ id: 'projeto-1', vinculos: [] }, null, []);
  preencher(form, 'pr-titulo', 'Caso sem duplicação');
  const b = form.querySelector('#pr-salvar');
  const primeiro = b.onclick({ currentTarget: b });
  assert.equal(b.disabled, true);
  if (!b.disabled) await b.onclick({ currentTarget: b });
  assert.equal(a.chamadas.length, 1);
  liberar(); await primeiro;
  assert.equal(b.disabled, false);
  assert.equal(a.concluidos, 1);
});

function montarSuite() {
  const a = montarContexto(); const estado = { chamadas: [], fechado: false, navegou: false, modal: null };
  const completo = fs.readFileSync(path.join(raiz, 'frontend/testes/fluxos-repositorio-local.parte.js'), 'utf8');
  const inicio = completo.indexOf('  function formularioSuiteLocal(e, suites, atual = null) {');
  const fim = completo.indexOf('  async function telaCasosLocais(e, _mem, corpo) {', inicio);
  assert.ok(inicio > 0 && fim > inicio, 'função de suíte isolada da interface do repositório');
  a.ctx.tr = texto => texto;
  a.ctx.mostrar = async () => { estado.navegou = true; };
  a.ctx.api.suiteLocalSalvar = async entrada => { estado.chamadas.push(entrada); return { ok: true }; };
  a.ctx.DS = {
    acao: (_titulo, fn, opcoes = {}) => a.ctx.h('button', { id: opcoes.id, onclick: fn }),
    info: texto => a.ctx.h('p', {}, texto),
    campo: (titulo, campo) => a.ctx.h('label', {}, titulo, campo),
    rodape: (...itens) => a.ctx.h('footer', {}, ...itens),
    alerta: texto => a.ctx.h('span', { class: 'erro' }, texto),
    modal: (titulo, filhos) => { estado.modal = a.ctx.h('div', {}, filhos); estado.titulo = titulo; },
    fecharModal: () => { estado.fechado = true; }
  };
  vm.runInContext(completo.slice(inicio, fim) + '\nthis.abrirSuite = formularioSuiteLocal;', a.ctx);
  return { ...a, estado };
}
test('UI de suítes cria suíte na raiz e envia somente o projeto selecionado', async () => {
  const a = montarSuite();
  a.ctx.abrirSuite({ id: 'projeto-1' }, []);
  assert.equal(a.estado.titulo, 'Nova suíte local');
  preencher(a.estado.modal, 'suite-local-titulo', 'Funcional');
  preencher(a.estado.modal, 'suite-local-descricao', 'Casos funcionais');
  await a.estado.modal.querySelector('#suite-local-salvar').onclick();
  assert.equal(a.estado.chamadas.length, 1);
  const p = a.estado.chamadas[0];
  assert.equal(p.espacoId, 'projeto-1');
  assert.equal(p.titulo, 'Funcional');
  assert.equal(p.descricao, 'Casos funcionais');
  assert.equal(p.paiId, null);
  assert.equal(a.estado.fechado, true);
  assert.equal(a.estado.navegou, true);
});
test('UI edita suíte existente e conserva o identificador e seu pai', async () => {
  const a = montarSuite();
  const atual = { id: 's-2', titulo: 'Login', descricao: 'Antes', paiId: 's-1' };
  a.ctx.abrirSuite({ id: 'projeto-1' }, [{ id: 's-1', titulo: 'Funcional' }, atual], atual);
  assert.equal(a.estado.titulo, 'Editar suíte local');
  assert.equal(a.estado.modal.querySelector('#suite-local-pai').value, 's-1');
  preencher(a.estado.modal, 'suite-local-titulo', 'Login revisado');
  await a.estado.modal.querySelector('#suite-local-salvar').onclick();
  assert.equal(a.estado.chamadas.length, 1);
  assert.equal(a.estado.chamadas[0].id, 's-2');
  assert.equal(a.estado.chamadas[0].paiId, 's-1');
  assert.equal(a.estado.chamadas[0].titulo, 'Login revisado');
});
test('UI de suíte mantém modal aberto e mostra falha IPC; não declara sucesso', async () => {
  const a = montarSuite();
  a.ctx.api.suiteLocalSalvar = async () => ({ ok: false, error: 'LOCAL_SUITE_SCOPE' });
  a.ctx.abrirSuite({ id: 'projeto-1' }, []);
  preencher(a.estado.modal, 'suite-local-titulo', 'Funcional');
  await a.estado.modal.querySelector('#suite-local-salvar').onclick();
  assert.equal(a.estado.fechado, false);
  assert.equal(a.estado.navegou, false);
  const status = a.estado.modal.querySelector('#suite-local-saida');
  assert.equal(status.children[0].children[0], 'LOCAL_SUITE_SCOPE');
  assert.equal(a.avisos.length, 0);
});

function montarLista(temQase, resposta) {
  const a = montarContexto();
  const estado = { chamadas: 0, tabelas: {}, estados: [], seções: [], total: 0 };
  const source = fs.readFileSync(path.join(raiz, 'frontend/testes/fluxos-repositorio-local.parte.js'), 'utf8');
  const inicio = source.indexOf('  async function telaCasosLocais(e, _mem, corpo) {');
  const fim = source.length;
  assert.ok(inicio > 0 && fim > inicio);
  a.ctx.api.repositorioLocal = async () => { estado.chamadas++; return resposta; };
  a.ctx.vinc = (_e, servico) => temQase && servico === 'qase' ? { servico: 'qase' } : null;
  a.ctx.memoriaDaTela = () => estado;
  a.ctx.hora = valor => valor;
  a.ctx.abrirCasoLocal = () => undefined;
  a.ctx.formularioSuiteLocal = () => undefined;
  a.ctx.tr = valor => valor;
  a.ctx.DS = {
    secao: (nome, filhos) => { estado.seções.push(nome); return a.ctx.h('section', {}, filhos); },
    barra: filho => a.ctx.h('div', {}, filho),
    acao: (titulo, _fn, opcoes = {}) => a.ctx.h('button', { id: opcoes.id }, titulo),
    info: texto => a.ctx.h('p', {}, texto),
    tabela: opcoes => { estado.tabelas[opcoes.id] = opcoes; return a.ctx.h('table', { id: opcoes.id }); },
    estadoTela: (tipo, titulo) => { estado.estados.push({ tipo, titulo }); return a.ctx.h('p', {}, titulo); }
  };
  vm.runInContext(source.slice(inicio, fim) + '\nthis.exibirLista = telaCasosLocais;', a.ctx);
  return { ...a, estado };
}
test('lista local renderiza casos e suítes do mesmo projeto e mostra a suíte no caso', async () => {
  const a = montarLista(false, { ok: true, data: {
    suites: [{ id: 's1', titulo: 'Funcional', paiId: null }],
    casos: [{ id: 'c1', titulo: 'Validar login', suiteLocalId: 's1', dados: { automacao: 'manual', passos: [{ acao: 'Entrar' }] }, atualizadaEm: '2026-10-15' }]
  } });
  const corpo = a.ctx.h('div', {});
  await a.ctx.exibirLista({ id: 'projeto-1' }, {}, corpo);
  assert.equal(a.estado.chamadas, 1);
  assert.equal(a.estado.totalCasosLocais, 1);
  assert.equal(a.estado.tabelas['casos-locais'].linhas[0].celulas[1], 'Funcional');
  assert.equal(a.estado.tabelas['suites-locais'].linhas[0].celulas[2], '1');
  assert.deepEqual(JSON.parse(JSON.stringify(a.estado.seções)), ['Suítes locais', 'Casos do repositório local']);
});
test('Qase vinculado não consulta nem exibe repositório local concorrente', async () => {
  const a = montarLista(true, { ok: true, data: { casos: [], suites: [] } });
  const corpo = a.ctx.h('div', {});
  await a.ctx.exibirLista({ id: 'projeto-1' }, {}, corpo);
  assert.equal(a.estado.chamadas, 0);
  assert.equal(corpo.children.length, 0);
});
test('falha de consulta IPC não é apresentada como repositório vazio', async () => {
  const a = montarLista(false, { ok: false, error: 'LOCAL_DATA_INVALID' });
  const corpo = a.ctx.h('div', {});
  await a.ctx.exibirLista({ id: 'projeto-1' }, {}, corpo);
  assert.equal(a.estado.chamadas, 1);
  assert.equal(a.estado.tabelas['casos-locais'], undefined);
  assert.equal(a.estado.tabelas['suites-locais'], undefined);
  assert.equal(a.estado.estados.length, 2);
  assert.ok(a.estado.estados.every(x => x.tipo === 'erro'));
});

function montarVinculoJira(resposta) {
  const a = montarContexto(); const estado = { consultas: [], associacoes: [], modal: null };
  const src = fs.readFileSync(path.join(raiz, 'frontend/testes/fluxos-casos-qase.parte.js'), 'utf8');
  const ini = src.indexOf('  async function abrirCasoLocal(e, caso) {');
  const fim = src.indexOf('  async function novaProposta(e) {', ini);
  assert.ok(ini > 0 && fim > ini, 'fluxo de vínculo presente');
  a.ctx.api.repositorioLocal = async () => ({ ok: true, data: { casos: [], suites: [] } });
  a.ctx.api.propostas = async () => ({ ok: true, data: [] });
  a.ctx.api.servicoConsultar = async (...args) => { estado.consultas.push(args); return resposta; };
  a.ctx.api.espacoAssociar = async (...args) => { estado.associacoes.push(args); return { ok: true }; };
  a.ctx.chamar = async fn => { const r = await fn(); return r?.ok ? r.data : null; };
  a.ctx.vinc = (_espaco, tipo) => tipo === 'jira' ? { id: 'vinculo-jira', recurso: { chave: 'KAN', instancia: 'https://example.atlassian.net' } } : null;
  a.ctx.relacoesDe = () => []; a.ctx.outroLado = () => null;
  a.ctx.atualizarEspaco = async e => e; a.ctx.mostrar = async () => {};
  a.ctx.formularioProposta = () => a.ctx.h('div', {});
  a.ctx.tr = s => s; a.ctx.hora = v => v;
  a.ctx.DS = {
    acao: (_rotulo, callback, opcoes = {}) => a.ctx.h('button', { id: opcoes.id, onclick: callback }),
    bloco: (titulo, filho) => a.ctx.h('section', {}, titulo, filho),
    texto: (t, fallback) => t || fallback,
    origem: () => 'Prumo local',
    meta: campos => a.ctx.h('div', {}, campos),
    alerta: texto => a.ctx.h('span', { class: 'erro' }, texto),
    tabela: () => a.ctx.h('table', {}),
    modal: (_titulo, filho) => { estado.modal = a.ctx.h('div', {}, filho); return estado.modal; }
  };
  vm.runInContext(src.slice(ini, fim) + '\nthis.abrirCaso = abrirCasoLocal;', a.ctx);
  return { ...a, estado };
}
test('vínculo Jira: caso local exige leitura remota antes de declarar associação', async () => {
  const a = montarVinculoJira({ ok: true, data: { dados: { key: 'KAN-7' } } });
  await a.ctx.abrirCaso({ id: 'projeto-local' }, {
    id: 'caso-local-1', titulo: 'Caso isolado', dados: { passos: [] }, criadaEm: '2026-10-15'
  });
  preencher(a.estado.modal, 'caso-local-jira', 'KAN-7');
  a.estado.modal.querySelector('#caso-local-associar-jira').onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.estado.consultas.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(a.estado.consultas[0])), ['projeto-local', 'jira', 'ticket', {}, 'KAN-7']);
  assert.equal(a.estado.associacoes.length, 1);
  assert.equal(a.estado.associacoes[0][1].para.id, 'KAN-7');
});
test('vínculo Jira: consulta falha, não associa ticket inexistente ou indisponível', async () => {
  const a = montarVinculoJira({ ok: false, error: 'SERVICE_SCOPE_CHANGED' });
  await a.ctx.abrirCaso({ id: 'projeto-local' }, {
    id: 'caso-local-1', titulo: 'Caso isolado', dados: { passos: [] }, criadaEm: '2026-10-15'
  });
  preencher(a.estado.modal, 'caso-local-jira', 'KAN-7');
  a.estado.modal.querySelector('#caso-local-associar-jira').onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.estado.consultas.length, 1);
  assert.equal(a.estado.associacoes.length, 0);
  assert.match(a.estado.modal.querySelector('#caso-local-saida').children[0].children[0], /confirmar o ticket/);
});
test('vínculo Jira: chave de outro projeto é bloqueada sem consultar a rede', async () => {
  const a = montarVinculoJira({ ok: true, data: {} });
  await a.ctx.abrirCaso({ id: 'projeto-local' }, {
    id: 'caso-local-1', titulo: 'Caso isolado', dados: { passos: [] }, criadaEm: '2026-10-15'
  });
  preencher(a.estado.modal, 'caso-local-jira', 'OUTRO-7');
  a.estado.modal.querySelector('#caso-local-associar-jira').onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.estado.consultas.length, 0);
  assert.equal(a.estado.associacoes.length, 0);
});

function montarCriacaoQase({ ticketValido = true, confirmado = true, vinculoJira = true, ticketRemoto = 'KAN-7' } = {}) {
  const a = montarContexto();
  const src = fs.readFileSync(path.join(raiz, 'frontend/testes/fluxos-casos-qase.parte.js'), 'utf8');
  const ini = src.indexOf('  async function novoCasoQase(e) {');
  const fim = src.indexOf('  async function abrirCasoLocal(e, caso) {', ini);
  assert.ok(ini >= 0 && fim > ini);
  const estado = { modal: null, leituras: [], escritas: [], vinculos: [], fechou: false, memoria: {} };
  a.ctx.tr = s => s;
  a.ctx.vinc = (_e, servico) => servico === 'qase'
    ? { id: 'qase-vinculo', recurso: { chave: 'PQ' } }
    : servico === 'jira' && vinculoJira ? { id: 'jira-vinculo', recurso: { chave: 'KAN', instancia: 'https://jira.exemplo.test' } } : null;
  a.ctx.api.servicoConsultar = async (...args) => {
    estado.leituras.push(args);
    if (args[1] === 'qase') return { ok: true, data: { dados: [{ id: 3, title: 'Funcional' }], proxima: null } };
    if (args[1] === 'jira') return ticketValido ? { ok: true, data: { dados: { key: args[4] } } }
      : { ok: false, error: 'SERVICE_NOT_FOUND' };
    throw new Error('Serviço inesperado');
  };
  a.ctx.executarOperacao = async (...args) => {
    estado.escritas.push(args);
    return confirmado ? { estado: 'CONFIRMADA', remoto: { id: '44', detalhes: { ticket: ticketRemoto } } }
      : { estado: 'ENVIADA', aviso: 'NOT_CONFIRMED' };
  };
  a.ctx.api.espacoAssociar = async (...args) => { estado.vinculos.push(args); return { ok: true }; };
  a.ctx.atualizarEspaco = async e => e;
  a.ctx.memoriaDaTela = () => estado.memoria;
  a.ctx.mostrar = async () => {};
  a.ctx.painelResultado = r => a.ctx.h('span', {}, r.estado);
  a.ctx.DS = {
    acao: (titulo, fn, props = {}) => a.ctx.h('button', { id: props.id, onclick: fn }, titulo),
    info: t => a.ctx.h('p', {}, t),
    alerta: (t, tom) => a.ctx.h('span', { class: tom }, t),
    campo: (t, el) => a.ctx.h('label', {}, t, el),
    rodape: (...els) => a.ctx.h('footer', {}, els),
    modal: (_titulo, filhos) => { estado.modal = a.ctx.h('div', {}, filhos); return estado.modal; },
    fecharModal: () => { estado.fechou = true; }
  };
  vm.runInContext(src.slice(ini, fim) + '\nthis.abrirCriacaoQase = novoCasoQase;', a.ctx);
  return { ...a, estado };
}

test('novo caso Qase: ticket Jira válido é consultado antes da criação remota', async () => {
  const a = montarCriacaoQase();
  await a.ctx.abrirCriacaoQase({ id: 'proj-1' });
  preencher(a.estado.modal, 'qase-novo-titulo', 'Validar rastreabilidade');
  preencher(a.estado.modal, 'qase-novo-ticket', 'KAN-7');
  preencher(a.estado.modal, 'qase-novo-suite', '3');
  const passo = a.estado.modal.querySelector('.passo-acao'); passo.value = 'Abrir formulário';
  await a.estado.modal.querySelector('#qase-novo-salvar').onclick();
  assert.deepEqual(a.estado.leituras.map(x => x[1]), ['qase', 'jira']);
  assert.equal(a.estado.leituras[1][4], 'KAN-7');
  assert.equal(a.estado.escritas.length, 1);
  assert.equal(a.estado.escritas[0][1], 'qase.criar_caso');
  assert.equal(a.estado.escritas[0][2].ticket, 'KAN-7');
  assert.equal(a.estado.vinculos.length, 1);
  assert.equal(a.estado.fechou, true);
});

test('novo caso Qase: ticket Jira não confirmado bloqueia criação e mantém formulário aberto', async () => {
  const a = montarCriacaoQase({ ticketValido: false });
  await a.ctx.abrirCriacaoQase({ id: 'proj-1' });
  preencher(a.estado.modal, 'qase-novo-titulo', 'Caso com ticket ausente');
  preencher(a.estado.modal, 'qase-novo-ticket', 'KAN-7');
  await a.estado.modal.querySelector('#qase-novo-salvar').onclick();
  assert.deepEqual(a.estado.leituras.map(x => x[1]), ['qase', 'jira']);
  assert.equal(a.estado.escritas.length, 0);
  assert.equal(a.estado.vinculos.length, 0);
  assert.equal(a.estado.fechou, false);
  assert.match(a.estado.modal.querySelector('#qase-novo-saida').children[0].children[0], /não pôde ser confirmado/);
});

test('novo caso Qase: chave fora do projeto não consulta Jira nem cria caso', async () => {
  const a = montarCriacaoQase();
  await a.ctx.abrirCriacaoQase({ id: 'proj-1' });
  preencher(a.estado.modal, 'qase-novo-titulo', 'Caso externo');
  preencher(a.estado.modal, 'qase-novo-ticket', 'OUT-7');
  await a.estado.modal.querySelector('#qase-novo-salvar').onclick();
  assert.deepEqual(a.estado.leituras.map(x => x[1]), ['qase']);
  assert.equal(a.estado.escritas.length, 0);
  assert.equal(a.estado.vinculos.length, 0);
});

test('novo caso Qase: escrita sem confirmação nativa não gera sucesso nem vínculo local', async () => {
  const a = montarCriacaoQase({ confirmado: false });
  await a.ctx.abrirCriacaoQase({ id: 'proj-1' });
  preencher(a.estado.modal, 'qase-novo-titulo', 'Caso não confirmado');
  preencher(a.estado.modal, 'qase-novo-ticket', 'KAN-7');
  await a.estado.modal.querySelector('#qase-novo-salvar').onclick();
  assert.equal(a.estado.escritas.length, 1);
  assert.equal(a.estado.vinculos.length, 0);
  assert.equal(a.estado.fechou, false);
  assert.match(a.estado.modal.querySelector('#qase-novo-saida').children[0].children[0], /ENVIADA/);
});
