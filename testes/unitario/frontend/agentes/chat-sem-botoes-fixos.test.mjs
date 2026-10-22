import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const chat = fs.readFileSync('frontend/agentes/conversa-do-orchestrator.parte.js', 'utf8');
const tela = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');

test('o chat não tem botões fixos: sem sugestões iniciais, sem seletor de agente nem de IA à vista; o agente em uso aparece com a resposta', () => {
  assert.doesNotMatch(chat, /sugerir\(INICIAIS\)/);
  assert.doesNotMatch(chat, /O que vamos explorar\?/);
  assert.doesNotMatch(chat, /abertura\.proximos/);
  assert.doesNotMatch(chat, /if \(proximos\) sugerir\(proximos\)/);
  assert.match(chat, /h\('div', \{ class: 'v36-sr' \}, interlocutores, linhaConexao, seletorAgente\)/, 'seletor e IAs só para tecnologia assistiva');
  assert.match(chat, /function mostrarEmUso\(r, ia\)/);
  assert.match(chat, /mostrarEmUso\(r, ia\)/);
});

test('@menção escolhe o agente ou a IA que responde (@qa-geral, @claude, @codex, @mesa, @orquestrador) e sai do texto enviado', () => {
  assert.match(chat, /function aplicarMencao\(q\)/);
  assert.match(chat, /q = aplicarMencao\(q\)/);
  assert.match(chat, /chave === 'orquestrador' \|\| chave === 'prumo' \|\| chave === 'auto'/);
});

test('a conversa de agora vai para o Painel de atividades só pela memória da janela, e o painel completa o registro gravado com ela', () => {
  assert.match(chat, /window\.PrumoConversasAoVivo/);
  assert.doesNotMatch(chat, /localStorage\.setItem\([^)]*conversa/i);
  assert.match(tela, /for \(const v of window\.PrumoConversasAoVivo \|\| \[\]\)/);
  assert.match(tela, /Object\.assign\(gravada, \{ pergunta: v\.pergunta, linhas: v\.linhas, semTexto: false/);
});

test('clicar num terminal abre a janela colorida com as mensagens, ações e estados em ordem de tempo', () => {
  const painel = fs.readFileSync('frontend/design-system/painel-atividades.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  assert.match(painel, /f\.detalhes\?\.length \|\| f\.linhas\?\.length \? \(\) => o\.abrirTerminal\?\.\(f\)/);
  assert.match(tela, /abrirTerminal: \(f\) =>/);
  for (const c of ['pa-dlg-topo', 'pa-dlg-balao', 'pa-dlg-acao', 'pa-dlg-estado']) assert.ok(css.includes('.' + c), c);
  assert.doesNotMatch(css.slice(css.indexOf('.pa-dlg-topo')), /font-family:\s*ui-monospace/, 'fonte pelos tokens do Design System');
});
