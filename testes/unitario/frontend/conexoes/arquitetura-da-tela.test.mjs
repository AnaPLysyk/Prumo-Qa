/** Conexões: impede mistura de responsabilidades e garante carregamento dos módulos da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'frontend/conexoes/';
const arquivos = [
  'componentes/apresentarProjetosQase.js',
  'componentes/mostrarPermissoesConexao.js',
  'abrirFormularioConexao.js',
  'mostrarConexoes.js',
  'mostrarOperacoesExternas.js',
  'mostrarIntegracoesDosAgentes.js'
];
const ler = nome => fs.readFileSync(base + nome, 'utf8');

test('Conexões mantém listagem, seleção Qase, permissões e formulário em arquivos distintos', () => {
  const [qase, permissoes, formulario, principal] = arquivos.slice(0, 4).map(ler);
  assert.match(qase, /function criarApresentacaoProjetosQase/);
  assert.match(qase, /qaseImportar\(/);
  assert.match(permissoes, /function blocoPermissoes\(/);
  assert.match(permissoes, /const permissoesDoToken=/);
  assert.match(formulario, /function criarAberturaFormularioConexao/);
  assert.match(formulario, /qasePrever\(/);
  assert.match(principal, /abas\.conexoes=async/);
  assert.doesNotMatch(principal, /function apresentarProjetos|function abrirPainel|const permissoesDoToken=/);
  assert.doesNotMatch(permissoes, /api\.contaEntrar|api\.servicoAdicionar/);
  assert.doesNotMatch(qase, /api\.contaEntrar/);
});

test('scripts de Conexões carregam dependências antes da tela principal e dos complementos', () => {
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  let anterior = -1;
  for (const item of arquivos) {
    const indice = html.indexOf('src="telas/conexoes/' + item + '"');
    assert.ok(indice > anterior, item + ' precisa ser carregado na ordem correta');
    anterior = indice;
  }
  for (const nome of arquivos) assert.match(ler(nome), /^'use strict';\n\/\*\*/);
});

test('identidade do Prumo permanece separada das contas conectadas', () => {
  const principal = ler('mostrarConexoes.js');
  const formulario = ler('abrirFormularioConexao.js');
  assert.doesNotMatch(principal + formulario, /contaEntrar\(|contaCadastrar\(|contaSair\(/);
  assert.match(formulario, /api\.servicoAdicionar\(/);
  assert.match(fs.readFileSync('backend/conexoes/banco/credenciais.ts','utf8'), /salvarCredencial/);
});
