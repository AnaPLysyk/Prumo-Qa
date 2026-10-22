/** IDE: o editor é o Monaco (o do VS Code) numa página isolada, distribuído com o app, e o resto da IDE só conversa com ele por mensagens. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pasta = 'frontend/editor-de-codigo/';
const workbench = fs.readFileSync('frontend/testes/ide-workbench.parte.js', 'utf8');

test('a página do editor tem política própria, sem rede, e a janela só aceita iframe do próprio aplicativo', () => {
  const pagina = fs.readFileSync(pasta + 'editor.html', 'utf8');
  assert.match(pagina, /default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'/);
  assert.ok(!/connect-src|http:\/\/|https:\/\//.test(pagina.replace(/<!--[\s\S]*?-->/g, '')), 'a página do editor não pode ter rede');
  const janela = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  assert.match(janela, /frame-src 'self'/);
  assert.match(janela, /style-src 'self'; /, 'a janela principal continua sem estilo em linha');
  assert.ok(janela.indexOf('clienteDoEditor.js') > -1 && !/codemirror/i.test(janela));
});

test('o Monaco está embutido com licença e só os arquivos que o editor usa', () => {
  for (const arquivo of ['vendor/vs/loader.js', 'vendor/vs/editor/editor.main.js', 'vendor/vs/editor/editor.main.css', 'vendor/LICENSE.txt', 'vendor/ThirdPartyNotices.txt']) assert.ok(fs.existsSync(pasta + arquivo), arquivo);
  const editor = fs.readFileSync(pasta + 'editor.js', 'utf8');
  for (const trabalhador of editor.match(/'[\w.-]+\.worker-[\w-]+\.js'/g)) assert.ok(fs.existsSync(pasta + 'vendor/vs/assets/' + trabalhador.slice(1, -1)), trabalhador);
  assert.ok(!fs.existsSync('frontend/compartilhado/vendor/codemirror-5.65.20.js'), 'o CodeMirror saiu');
});

test('o editor isolado só aceita mensagens da janela e devolve os atalhos do aplicativo', () => {
  const editor = fs.readFileSync(pasta + 'editor.js', 'utf8');
  assert.match(editor, /if \(ev\.source !== pai\) return/);
  for (const trecho of ["t: 'atalho'", "'prumo-' + nome", 'noSemanticValidation: true', "id: 'gherkin'", 'minimap', 'bracketPairColorization', 'stickyScroll', 'getAction(ACOES[m.nome])']) assert.ok(editor.includes(trecho), trecho);
  const cliente = fs.readFileSync(pasta + 'clienteDoEditor.js', 'utf8');
  assert.match(cliente, /if \(ev\.source !== quadro\.contentWindow \|\| ev\.data\?\.prumoEditor !== 1\) return/);
  assert.ok(!/api\./.test(editor), 'o iframe não usa a ponte do aplicativo');
});

test('o workbench usa o editor isolado, mostra Salvar só com arquivo de texto e salva o texto que o editor devolve', () => {
  for (const trecho of ['window.PrumoEditorDeCodigo.criar(', 'salvarBtn.hidden = descartarBtn.hidden = !a?.doc', 'await editorDeCodigo.pedirTexto(aba.chave)', "comandoDoEditor('formatar')", "comandoDoEditor('comentar')", 'alternarMinimapa']) assert.ok(workbench.includes(trecho), trecho);
  assert.ok(!/CodeMirror|\bcm\./.test(workbench));
});

test('a IDE mostra só o repositório: sem painel lateral direito, com menu de contexto e pedidos ao Orquestrador flutuante', () => {
  assert.ok(!workbench.includes('ds-ide-painel') && !workbench.includes('painelLateral'));
  for (const trecho of ["addEventListener('contextmenu'", "ev.key !== 'ContextMenu'", 'novoNo(false', 'novoNo(true', 'window.PrumoAcoesDaTela = interpretarPedido', 'window.PrumoOrquestrador.preparar', 'data-pasta']) assert.ok(workbench.includes(trecho), trecho);
  const tela = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
  assert.ok(!tela.includes('agentesNoCodigo') && tela.includes('criarArquivo: (rel) => api.ideGravar(e.id, rel'));
  const conversa = fs.readFileSync('frontend/agentes/conversa-do-orchestrator.parte.js', 'utf8');
  assert.ok(conversa.includes('window.PrumoAcoesDaTela?.(q)') && conversa.includes('function preparar('));
  assert.ok(fs.readFileSync('frontend/compartilhado/interfaces-fechamento.parte.js', 'utf8').includes('window.PrumoOrquestrador = Object.freeze'));
});

test('escrever na IDE pelo Orquestrador exige confirmação antes de criar', () => {
  const trecho = workbench.slice(workbench.indexOf('async function interpretarPedido'));
  assert.ok(trecho.indexOf('await confirmar(') > -1 && trecho.indexOf('await confirmar(') < trecho.indexOf('criarNoRepositorio(rel, pasta)'));
});

test('a árvore da IDE não herda o nav em linha: pastas e arquivos ficam em coluna', () => {
  assert.match(fs.readFileSync('frontend/design-system/ds.css', 'utf8'), /nav\.ds-wb-arvore\s*\{\s*display:\s*block;/);
});

test('o terminal é a página isolada do xterm.js: sem rede, só desenha e devolve o que foi digitado, e colar nunca executa sozinho', () => {
  const pagina = fs.readFileSync(pasta + 'terminal.html', 'utf8');
  assert.match(pagina, /default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'/);
  assert.ok(!/connect-src|https?:\/\//.test(pagina.replace(/<!--[\s\S]*?-->/g, '')));
  for (const arquivo of ['vendor/xterm/xterm.js', 'vendor/xterm/xterm.css', 'vendor/xterm/addon-fit.js', 'vendor/xterm/LICENSE-xterm.txt']) assert.ok(fs.existsSync(pasta + arquivo), arquivo);
  const terminal = fs.readFileSync(pasta + 'terminal.js', 'utf8');
  assert.match(terminal, /if \(ev\.source !== pai\) return/);
  assert.ok(terminal.includes("replace(/[\\u0000-\\u001f\\u007f]+/g, ' ')"), 'texto colado perde as quebras de linha');
  assert.ok(!/api\./.test(terminal));
  assert.match(fs.readFileSync(pasta + 'clienteDoTerminal.js', 'utf8'), /if \(ev\.source !== quadro\.contentWindow \|\| ev\.data\?\.prumoTerminal !== 1\) return/);
  assert.ok(fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8').includes('clienteDoTerminal.js'));
});

test('o terminal só existe com pasta local, roda um comando por vez pela ponte e confirma antes (backend)', () => {
  assert.ok(workbench.includes('window.PrumoTerminalDaIde.criar(') && workbench.includes('o.terminal.executar(texto)') && workbench.includes('o.terminal.parar('));
  assert.ok(workbench.includes('no\\s+terminal$'), 'o Orquestrador só executa com "no terminal" no fim da frase');
  const tela = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
  assert.ok(tela.includes('api.ideComandoExecutar(e.id, comando)') && tela.includes('api.ideComandoSaida(id, desde)'));
  const controlador = fs.readFileSync('backend/projetos/controladorCodigo.ts', 'utf8');
  const corpo = controlador.slice(controlador.indexOf('export const ideComandoexecutar'));
  assert.ok(corpo.indexOf('confirmarNoWindows(') > -1 && corpo.indexOf('confirmarNoWindows(') < corpo.indexOf('iniciarComando('), 'a confirmação vem antes de iniciar');
  for (const canal of ['ide:comandoexecutar', 'ide:comandosaida', 'ide:comandoparar']) {
    assert.ok(fs.readFileSync('backend/aplicativo/api/catalogoDeContratos.ts', 'utf8').includes("'" + canal + "'"), canal);
    assert.ok(fs.readFileSync('backend/login/tipos/acessoDosCanais.ts', 'utf8').includes("'" + canal + "': ['testes', 'USAR']"), canal);
  }
});
