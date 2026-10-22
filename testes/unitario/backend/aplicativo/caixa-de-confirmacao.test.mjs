/** Caixa de confirmação do processo principal: só o índice de um botão, vindo da própria página da caixa, conta como resposta. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.PRUMO_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-caixa-'));
class ConteudoFalso extends EventEmitter {
  pronta = true;
  setWindowOpenHandler(f) { this.abrir = f; }
  loadFile(arquivo, opcoes) { this.carregado = { arquivo, opcoes }; return Promise.resolve(); }
  executeJavaScript() { return Promise.resolve(this.pronta); }
  focus() { this.focado = (this.focado ?? 0) + 1; }
  close() { this.fechado = true; }
}
const vistas = [];
class WebContentsView {
  constructor(opcoes) { this.opcoes = opcoes; this.webContents = new ConteudoFalso(); vistas.push(this); }
  setBackgroundColor(cor) { this.fundo = cor; }
  setBounds(b) { this.limites = b; }
}
const soltas = [];
class BrowserWindow extends EventEmitter { constructor() { super(); soltas.push(this); } }
mock.module('electron', { exports: { app: { getVersion: () => '0.0.0' }, BrowserWindow, WebContentsView } });
const { perguntarNaJanela, lerResposta } = await import('../../../../dist/aplicativo/janela/caixaDeConfirmacao.js');

const novaJanela = () => {
  const j = Object.assign(new EventEmitter(), {
    filhos: [], destruida: false, largura: 1000, isDestroyed() { return this.destruida; }, isMinimized: () => false, isVisible: () => true, focus() {}, webContents: { focus() {} },
    getContentBounds() { return { x: 40, y: 40, width: this.largura, height: 700 }; }
  });
  j.contentView = { addChildView: (v) => j.filhos.push(v), removeChildView: (v) => { j.filhos = j.filhos.filter(x => x !== v); } };
  return j;
};
const esperar = () => new Promise(r => setImmediate(r));
const pagina = 'file:///C:/Prumo/dist/renderer/caixa-de-confirmacao.html?pedido=%7B%7D';
const pergunta = { type: 'question', title: 'Prumo QA', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, message: 'Abrir o site?', detail: 'https://prumo-qa-docs.onrender.com/' };

test('a resposta só vale com índice de botão existente e vinda da página da caixa', () => {
  assert.deepEqual(lerResposta(pagina + '#resposta=1&marcado=1', 2), { response: 1, checkboxChecked: true });
  assert.deepEqual(lerResposta(pagina + '#resposta=0&marcado=0', 2), { response: 0, checkboxChecked: false });
  for (const url of [pagina + '#resposta=2&marcado=0', pagina + '#resposta=1', pagina + '#resposta=1&marcado=0&x=1',
    'file:///C:/Prumo/dist/renderer/index.html#resposta=1&marcado=0', 'https://exemplo.com/caixa-de-confirmacao.html#resposta=1&marcado=0', pagina])
    assert.equal(lerResposta(url, 2), null, url);
});

test('a caixa cobre a janela numa página isolada, sem preload, e devolve o botão escolhido', async () => {
  const janela = novaJanela();
  const resposta = perguntarNaJanela(janela, pergunta);
  await esperar();
  const vista = vistas.at(-1);
  assert.deepEqual(janela.filhos, [vista]);
  assert.deepEqual(vista.limites, { x: 0, y: 0, width: 1000, height: 700 });
  janela.largura = 1400; janela.emit('maximize');
  assert.deepEqual(vista.limites, { x: 0, y: 0, width: 1400, height: 700 });
  assert.equal(vista.fundo, '#00000000');
  assert.equal(vista.opcoes.webPreferences.preload, undefined);
  assert.equal(vista.opcoes.webPreferences.sandbox, true);
  assert.equal(vista.opcoes.webPreferences.contextIsolation, true);
  assert.equal(vista.opcoes.webPreferences.nodeIntegration, false);
  assert.match(vista.webContents.carregado.arquivo, /[\\/]dist[\\/]renderer[\\/]caixa-de-confirmacao\.html$/);
  const pedido = JSON.parse(vista.webContents.carregado.opcoes.query.pedido);
  assert.equal(pedido.mensagem, 'Abrir o site?');
  assert.deepEqual(pedido.botoes, ['Cancelar', 'Abrir no navegador']);
  assert.deepEqual(vista.webContents.abrir(), { action: 'deny' });
  let navegou = true; vista.webContents.emit('will-navigate', { preventDefault: () => { navegou = false; } }, 'https://exemplo.com');
  assert.equal(navegou, false);
  // Ao voltar para a janela (Alt+Tab), o foco volta para a caixa, e não para a página de baixo.
  const focos = vista.webContents.focado ?? 0; janela.emit('focus');
  assert.equal(vista.webContents.focado, focos + 1);
  vista.webContents.emit('did-navigate-in-page', {}, pagina + '#resposta=7&marcado=0', true);
  vista.webContents.emit('did-navigate-in-page', {}, pagina + '#resposta=1&marcado=0', false);
  vista.webContents.emit('did-navigate-in-page', {}, pagina + '#resposta=1&marcado=0', true);
  assert.deepEqual(await resposta, { response: 1, checkboxChecked: false });
  assert.deepEqual(janela.filhos, []);
  assert.equal(vista.webContents.fechado, true);
  assert.equal(janela.listenerCount('focus') + janela.listenerCount('hide') + janela.listenerCount('maximize'), 0);
});

test('o X da janela (esconder na bandeja) e a caixa que não carregou contam como Cancelar, sem travar a fila', async () => {
  const janela = novaJanela();
  const primeira = perguntarNaJanela(janela, pergunta);
  const segunda = perguntarNaJanela(janela, { ...pergunta, cancelId: 1 });
  await esperar();
  const antes = vistas.length;
  janela.emit('hide');
  assert.deepEqual(await primeira, { response: 0, checkboxChecked: false });
  await esperar();
  assert.equal(vistas.length, antes + 1);
  vistas.at(-1).webContents.pronta = false;
  vistas.at(-1).webContents.emit('did-finish-load');
  assert.deepEqual(await segunda, { response: 1, checkboxChecked: false });
  assert.deepEqual(janela.filhos, []);
});

test('janela que já fechou cancela sem abrir caixa solta; aviso de um botão não espera a fila', async () => {
  const janela = novaJanela(); janela.destruida = true;
  const soltasAntes = soltas.length, vistasAntes = vistas.length;
  assert.deepEqual(await perguntarNaJanela(janela, pergunta), { response: 0, checkboxChecked: false });
  assert.equal(soltas.length, soltasAntes);
  assert.equal(vistas.length, vistasAntes);
  const viva = novaJanela();
  const confirmacao = perguntarNaJanela(viva, pergunta);
  await esperar();
  const aviso = perguntarNaJanela(viva, { type: 'info', message: 'Worker ativo', buttons: ['Fechar'] });
  await esperar();
  assert.equal(vistas.length, vistasAntes + 2);
  vistas.at(-1).webContents.emit('did-navigate-in-page', {}, pagina + '#resposta=0&marcado=0', true);
  assert.deepEqual(await aviso, { response: 0, checkboxChecked: false });
  vistas.at(-2).webContents.emit('render-process-gone');
  assert.deepEqual(await confirmacao, { response: 0, checkboxChecked: false });
});
