/** Comprova que as funções separadas por tela geram o mesmo código executado pelo Electron. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const raiz = process.cwd();
const manifest = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
test('bundles da interface são reproduzidos exatamente pelas partes de cada tela', () => {
  assert.equal(manifest.schemaVersion, 1);
  for (const bundle of manifest.bundles) {
    assert.ok(bundle.origens.length > 0, 'bundle sem fontes: '+bundle.destino);
    const texto = bundle.origens.map(origem => {
      const fonte = fs.readFileSync(path.join(raiz, origem),'utf8');
      assert.match(fonte, /^\/\*\* [^\n]+\. \*\/\n/, 'descrição na primeira linha: '+origem);
      return fonte.slice(fonte.indexOf('\n')+1);
    }).join('');
    const esperado = fs.readFileSync(path.join(raiz,bundle.destino),'utf8');
    assert.equal(texto, esperado, 'geração deve preservar integralmente '+bundle.destino);
    if (bundle.destino.endsWith('.js')) {
      const sintaxe = spawnSync(process.execPath,['--check', path.join(raiz,bundle.destino)],{encoding:'utf8'});
      assert.equal(sintaxe.status,0,'sintaxe JavaScript de '+bundle.destino+': '+sintaxe.stderr);
    }
  }
});
test('a janela carrega somente os bundles e nunca seus fragmentos internos',()=>{
  const html=fs.readFileSync('dist/renderer/index.html','utf8');
  for (const bundle of manifest.bundles) {
    const relative = bundle.destino.replace('dist/renderer/','');
    if (bundle.destino.endsWith('.css')) {
      assert.ok(html.includes('<link rel="stylesheet" href="'+relative+'">'), 'CSS deve estar no index: '+relative);
    } else {
      assert.ok(html.includes('<script src="'+relative+'"></script>'), 'bundle deve estar no index: '+relative);
    }
    for (const parte of bundle.origens) assert.ok(!html.includes('src="'+parte.replace('dist/renderer/','')+'"'), 'fragmento não pode ser carregado: '+parte);
  }
  assert.ok(html.indexOf('src="fluxos.js"') < html.indexOf('src="tela-testes.js"'), 'testes avançados dependem de Fluxos');
});


test('falha ao abrir uma tela mostra estado recuperável, sem deixar conteúdo parcial', async () => {
  const fonte = fs.readFileSync('frontend/compartilhado/runtime/app.js', 'utf8');
  const inicio = fonte.indexOf('async function mostrar(aba) {');
  const fim = fonte.indexOf('\n}\n\n(async () => {', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'função principal de navegação identificável');
  const codigo = fonte.slice(inicio, fim + 2);
  const avisos = [];
  const conteudo = { itens: [], replaceChildren(...itens) { this.itens = itens; } };
  const ambiente = {
    estado: { aba: 'inicio', root: null },
    rotasVirtuais: {},
    clearInterval() {},
    document: {
      querySelectorAll: () => [{ dataset: { aba: 'testes' }, setAttribute() {}, removeAttribute() {} }],
      createElement: () => ({ childNodes: [], replaceChildren(...itens) { this.childNodes = itens; } })
    },
    chamar: (acao) => acao(),
    api: { projetos: async () => [], espacos: async () => [] },
    $: (selector) => selector === '#conteudo' ? conteudo : { textContent: '' },
    abas: {
      testes: async (el) => {
        el.replaceChildren({ parcial: true });
        throw Error('erro interno simulado');
      }
    },
    DS: {
      acao: (titulo, executar) => ({ titulo, executar }),
      estadoTela: (tipo, titulo, descricao, acoes, opcoes) => ({ tipo, titulo, descricao, acoes, opcoes })
    },
    avisar: (texto) => avisos.push(texto),
    montarSeletorProjeto() {}
  };
  const mostrar = vm.runInNewContext('(' + codigo + ')', ambiente);
  ambiente.mostrar = mostrar;
  await mostrar('testes');
  assert.equal(conteudo.itens.length, 1, 'conteúdo parcial foi descartado');
  assert.equal(conteudo.itens[0].tipo, 'erro');
  assert.equal(conteudo.itens[0].opcoes.id, 'tela-falha-carregamento');
  assert.equal(avisos.length, 1);
  assert.equal(conteudo.itens[0].acoes.length, 1);

  ambiente.abas.testes = async (el) => { el.replaceChildren({ carregado: true }); };
  await conteudo.itens[0].acoes[0].executar();
  assert.equal(conteudo.itens[0].carregado, true, 'tentar novamente reabre a tela');
});
