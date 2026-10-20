import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const fonte = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');

function renderizarRelacoes(nos, lacunas = []) {
  const renderizado = [];
  const DS = {
    info: texto => texto,
    secao: (titulo, conteudo) => ({ titulo, conteudo }),
    estadoTela: (...args) => ({ args }),
    tabela: config => ({ config })
  };
  const h = (tipo, atributos, ...filhos) => ({ tipo, atributos, filhos });
  const contexto = {
    DS, h, tr: texto => texto,
    mapa: { nos, lacunas, arestas: [], operacoesRecentes: [], aviso: 'Vínculos não são execução.' },
    renderizado
  };
  vm.runInNewContext(
    fonte('frontend/testes/fluxos-vinculos.parte.js') +
      '\nrelacoes({}, mapa, { append(...itens) { renderizado.push(...itens); } }, null);',
    contexto
  );
  const secao = renderizado.find(item => item?.titulo === 'Lacunas de cadastro');
  assert.ok(secao, 'seção de lacunas renderizada');
  return JSON.stringify(secao.conteudo);
}

test('projeto vazio não anuncia ausência comprovada de lacunas', () => {
  const saida = renderizarRelacoes([{ id: 'prumo', tipo: 'projeto', rotulo: 'Teste' }]);
  assert.match(saida, /Sem casos ou tickets para avaliar lacunas/);
  assert.doesNotMatch(saida, /Nenhuma lacuna de cadastro encontrada/);
});

test('recursos conhecidos não são apresentados como comprovação de cobertura', () => {
  const saida = renderizarRelacoes([
    { id: 'prumo', tipo: 'projeto', rotulo: 'Teste' },
    { id: 'caso-local:123', tipo: 'caso-local', rotulo: 'Exemplo' }
  ]);
  assert.match(saida, /Isso não comprova cobertura ou execução/);
});

test('lacunas existentes permanecem visíveis após a mudança de estados vazios', () => {
  const saida = renderizarRelacoes(
    [{ id: 'prumo', tipo: 'projeto', rotulo: 'Teste' }],
    [{ tipo: 'CASO_SEM_TICKET', mensagem: 'Caso local sem ticket associado' }]
  );
  assert.match(saida, /Caso local sem ticket associado/);
  assert.doesNotMatch(saida, /Sem casos ou tickets para avaliar lacunas/);
});

test('sem Qase, ausência de pasta não impede cadastrar casos e suítes locais', () => {
  const origem = fonte('frontend/testes/visao-geral-dos-testes.parte.js');
  assert.match(origem, /if \(src\.cat\?\.semPasta && !vq\)/);
  assert.match(origem, /Você já pode criar casos e suítes locais sem Qase ou GitHub/);
  assert.match(origem, /Seus casos e suítes locais continuam disponíveis acima/);
  assert.doesNotMatch(origem, /Vincule a pasta do repositório \(ou o repositório do GitHub\) e o projeto do Qase em Projetos\./);
});

test('Runs distingue falha na consulta de lista vazia e permite repetir a busca', async () => {
  const codigo = fonte('frontend/testes/fluxos-planos-e-runs.parte.js');
  const inicio = codigo.indexOf('async function telaRuns(e, mem, corpo, esc) {');
  const fim = codigo.indexOf('\n  async function prepararRun(e)', inicio);
  assert.ok(inicio > 0 && fim > inicio);
  const elementos = new Map();
  const no = (tipo, atributos = {}, ...filhos) => {
    const n = { tipo, atributos, filhos, replaceChildren(...itens) { this.filhos = itens; }, append(...itens) { this.filhos.push(...itens); } };
    if (atributos.id) elementos.set(atributos.id, n);
    return n;
  };
  const DS = {
    esqueleto: () => ({ tipo: 'carregando' }),
    barra: (...nos) => ({ tipo: 'barra', nos }),
    selecao: () => ({ tipo: 'selecao' }),
    acao: (texto, fn, attrs = {}) => ({ texto, fn, attrs }),
    estadoTela: (tipo, titulo, descricao, acoes = [], attrs = {}) => ({ tipo, titulo, descricao, acoes, attrs }),
    alerta: (texto, tom) => ({ tipo: 'alerta', texto, tom }),
    origem: (servico) => ({ servico }),
    tabela: (config) => ({ tipo: 'tabela', config }),
    resumo: (dados) => ({ tipo: 'resumo', dados })
  };
  let erro = true, tentativas = 0;
  const api = {
    runs: async () => { tentativas++; return erro ? { ok: false, error: 'DB_UNAVAILABLE' } : { ok: true, data: [] }; },
    execucoes: async () => erro ? null : { execucoes: [] },
    metricasExecucoes: async () => null
  };
  const ctx = {
    DS, h: no, estado: { filtroExec: null }, api,
    ORIGENS_RUN: [['', 'Todas'], ['exec', 'Locais'], ['qase', 'Qase']],
    SITUACOES: [['', 'Todas']],
    vinc: () => null,
    chamar: async (fn) => fn(),
    tr: (texto) => texto, hora: () => '',
    carregarQase: async () => ({ itens: [] }),
    contar: () => ({ total: 0, pass: 0, fail: 0, blocked: 0, notRun: 0 })
  };
  const telaRuns = vm.runInNewContext('(' + codigo.slice(inicio, fim) + ')', ctx);
  const corpo = no('main'), memoria = {};
  await telaRuns({ id: 'projeto-1' }, memoria, corpo, false);
  const area = elementos.get('runs-area'), fonteConsulta = corpo.filhos.find(x => x.tipo === 'div' && x !== area && x.filhos.some(y => y?.tipo === 'alerta'));
  assert.equal(area.filhos[0].tipo, 'erro');
  assert.equal(area.filhos[0].attrs.id, 'runs-falha-consulta');
  assert.ok(fonteConsulta, 'erro de leitura permanece visível');
  assert.equal(tentativas, 1);
  const tentar = area.filhos[0].acoes[0].fn;
  erro = false;
  await tentar();
  assert.equal(tentativas, 2);
  assert.equal(area.filhos[0].tipo, 'vazio');
  assert.equal(area.filhos[0].attrs.id, 'runs-vazio');
});

test('Novo plano não permite criar com consulta Qase indisponível', async () => {
  const codigo = fonte('frontend/testes/fluxos-planos-e-runs.parte.js');
  const inicio = codigo.indexOf('async function novoPlano(e, esc) {');
  const fim = codigo.indexOf('\n  async function telaPlanos(', inicio);
  assert.ok(inicio > 0 && fim > inicio);
  let erro = true, consultas = 0;
  const modais = [], mem = {};
  const DS = {
    modal: (titulo, conteudo) => modais.push({ titulo, conteudo }),
    estadoTela: (tipo, titulo, descricao, acoes) => ({ tipo, titulo, descricao, acoes }),
    acao: (texto, fn) => ({ texto, fn })
  };
  const contexto = {
    DS, memoriaDaTela: () => mem,
    carregarQase: async () => { consultas++; return erro ? { itens: [], erro: 'SERVICE_UNAVAILABLE' } : { itens: [], erro: null }; }
  };
  const novoPlano = vm.runInNewContext('(' + codigo.slice(inicio, fim) + ')', contexto);
  await novoPlano({ id: 'projeto-1' }, false);
  assert.equal(modais.length, 1);
  assert.equal(modais[0].conteudo.tipo, 'erro');
  assert.equal(modais[0].conteudo.acoes[0].texto, 'Tentar novamente');
  assert.equal(consultas, 1);
});

test('Evidências conserva o filtro ao repetir consulta e logs indisponíveis não parecem vazios', async () => {
  const codigo = fonte('frontend/testes/execucoes-e-evidencias.js');
  const estado = { espaco: { pastaLocal: 'c:/pasta-testes' }, jobId: 'exec-7' };
  const consultas = [];
  let falhar = true;
  const DS = {
    estadoTela: (tipo, titulo, descricao, acoes, attrs = {}) => ({ tipo, titulo, descricao, acoes, attrs }),
    acao: (texto, fn) => ({ texto, fn }),
    info: (texto) => ({ tipo: 'informacao', texto }),
    alerta: (texto, tom) => ({ tipo: 'alerta', texto, tom })
  };
  const ambiente = {
    window: {}, abas: {}, DS, estado, tr: (s, dados) => s.replace(/\{(\w+)\}/g, (_, k) => dados?.[k] ?? ''),
    api: { evidencias: async (_raiz, id) => { consultas.push(id); return falhar ? { ok: false, error: 'OFFLINE' } : { ok: true, data: { results: [], reason: 'Sem registros' } }; } },
    chamar: async fn => { const r = await fn(); return r.ok ? r.data : null; },
    h: (tag, attrs, ...filhos) => ({ tag, attrs, filhos }),
    hora: x => x
  };
  vm.runInNewContext(codigo, ambiente);
  const el = { nos: [], append(...nos) { this.nos.push(...nos); }, replaceChildren(...nos) { this.nos = nos; } };
  await ambiente.abas.evidencias(el);
  assert.equal(el.nos[0].tipo, 'erro');
  assert.equal(el.nos[0].attrs.id, 'evidencias-falha-consulta');
  falhar = false;
  await el.nos[0].acoes[0].fn();
  assert.deepEqual(consultas, ['exec-7', 'exec-7'], 'preserva o identificador filtrado');
  assert.equal(el.nos[0].tag, 'p');
  assert.equal(el.nos[1].tipo, 'vazio');
  const a = codigo.indexOf('function painelLogs(x, ev) {');
  const b = codigo.indexOf('\n  async function jiraPrevia(', a);
  assert.ok(a > 0 && b > a);
  const painelLogs = vm.runInNewContext('(' + codigo.slice(a, b) + ')', ambiente);
  const logs = painelLogs({}, { erro: 'OFFLINE' });
  assert.equal(logs[0].tipo, 'alerta');
  assert.equal(logs[0].tom, 'falha');
});
