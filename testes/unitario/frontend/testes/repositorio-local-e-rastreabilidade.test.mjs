import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('repositório independente é usado na interface somente sem Qase', () => {
  const t = read('frontend/testes/fluxos-repositorio-local.parte.js');
  const v = read('frontend/testes/tela-testes.parte.js');
  assert.match(v, /memoriaDaTela\('testes', e\.id\)\.totalCasosLocais = 1/);
  assert.match(t, /async function telaCasosLocais\(e, _mem, corpo\)/);
  assert.match(t, /if \(vinc\(e, 'qase'\)\) return/);
  assert.match(t, /api\.repositorioLocal\(e\.id\)/);
  assert.match(t, /r\.data\.casos/);
  assert.match(t, /r\.data\.suites/);
  assert.match(t, /data-caso-local/);
  assert.match(t, /abrirCasoLocal\(e, c\)/);
  const qase = read('frontend/testes/fluxos-casos-qase.parte.js');
  assert.match(qase, /const vivas = \(ps \|\| \[\]\)\.filter\(p => p\.estado !== 'DESCARTADA' && \(vinc\(e, 'qase'\) \|\| p\.tipo === 'bug' \|\| p\.origem !== 'PESSOA'\)\)/);
});

test('o catálogo não apaga as seções locais de casos e suítes', () => {
  const v = read('frontend/testes/tela-testes.parte.js');
  assert.match(v, /const area = h\('div', \{ id: 'cat-carregando' \}/);
  assert.match(v, /area\.replaceChildren\(\.\.\.\[/);
  assert.doesNotMatch(v, /corpo\.replaceChildren\(\.\.\.\[/);
});

test('casos locais persistem no novo núcleo, não em propostas nem Qase', () => {
  const c = read('frontend/testes/propostas.js');
  assert.match(c, /const local = !e\.vinculos\.some\(v => v\.servico === 'qase'\)/);
  assert.match(c, /local \? api\.casoLocalSalvar\(/);
  assert.match(c, /suiteLocalId: suiteLocal\.value \|\| null/);
  assert.match(c, /Caso salvo somente neste computador/);
  assert.match(c, /Salvar caso local/);
  assert.match(c, /local \? dadosLocal : d/);
});

test('caso local legado é descartado pela API de propostas, sem quebrar a remoção', () => {
  const t = read('frontend/testes/tela-testes.parte.js');
  assert.match(t, /if \(l\.local\?\.legado\) \{ const r = await api\.propostaDescartar\(l\.local\.id\)/);
  assert.match(t, /else if \(l\.local\) \{ const r = await api\.casoLocalSalvar\(\{ espacoId: e\.id, id: l\.local\.id, remover: true \}\)/);
});

test('suítes locais têm formulário próprio, edição e escopo do projeto', () => {
  const t = read('frontend/testes/fluxos-repositorio-local.parte.js');
  assert.match(t, /function formularioSuiteLocal\(e, suites, atual = null, paiInicial = null\)/);
  assert.match(t, /api\.suiteLocalSalvar\(\{ espacoId: e\.id/);
  assert.match(t, /'Nova suíte local'/);
  assert.match(t, /data-suite-local/);
  assert.match(t, /formularioSuiteLocal\(e, suites, s\)/);
});

test('associação de casos locais valida IDs e o escopo no back-end', () => {
  const ui = read('frontend/testes/fluxos-casos-qase.parte.js');
  const regra = read('backend/projetos/servicoProjetos.ts');
  assert.match(ui, /api\.espacoAssociar\(e\.id, d\)/);
  assert.match(ui, /tipo: 'caso-local', id: caso\.id, origem: 'prumo'/);
  assert.match(ui, /tipo: 'ticket-local', id: seletor\.value, origem: 'prumo'/);
  assert.match(ui, /tipo: 'jira', id: chave, vinculoId: vj\.id/);
  assert.match(regra, /listarPropostas\(id,base\)\.some\(p=>p\.id===ref\.id/);
  assert.match(regra, /TRACE_LOCAL_REFERENCE_INVALID/);
  const mapa = read('backend/testes/regras/mapaDeVinculos.ts');
  assert.match(mapa, /ligarCasosLocais\(g, espacoId, prumo, b\)/);
  assert.match(mapa, /n\.tipo === 'caso-local'/);
});

test('canais locais são estritos, autorizados e expostos apenas pela ponte', () => {
  const contract = read('backend/aplicativo/api/catalogoDeContratos.ts');
  const acesso = read('backend/login/tipos/acessoDosCanais.ts');
  const reg = read('backend/aplicativo/api/registrarCanaisIpc.ts');
  const preload = read('backend/aplicativo/preload.cjs');
  for (const [canal, nivel, func] of [
    ['repositorio:listar', 'VER', 'repositorioLocal'],
    ['repositorio:caso', 'USAR', 'casoLocalSalvar'],
    ['repositorio:suite', 'USAR', 'suiteLocalSalvar']
  ]) {
    assert.ok(contract.includes("'" + canal + "':"), canal);
    assert.ok(acesso.includes("'" + canal + "': ['testes', '" + nivel + "']"), canal);
    assert.ok(reg.includes("registrarCanal('" + canal + "',"), canal);
    assert.ok(preload.includes("'" + canal + "'"), canal);
    assert.ok(preload.includes(func + ':'), func);
  }
});

test('detalhe do caso local exibe os dados de teste dos passos, não apenas ação e resultado', () => {
  const t = read('frontend/testes/fluxos-casos-qase.parte.js');
  assert.match(t, /DS\.bloco\(tr\('Passos \(\{n\}\)', \{ n: passos\.length \}\), passos\.length \? DS\.tabela\(\{ colunas: \['#', 'Passo', 'Dados de teste', 'Resultado esperado'\]/);
  assert.match(t, /s\.dados \|\| '—', s\.formato === 'bdd' \? '—' : \(s\.esperado \|\| '—'\)\]/);
});
