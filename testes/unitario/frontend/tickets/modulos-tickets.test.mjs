/** Tickets: uma fonte por tela, mantendo os fluxos local, Jira, Qase e GitHub identificáveis. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const arquivo = 'frontend/tickets/tela-tickets.parte.js';
const fonte = fs.readFileSync(arquivo, 'utf8');

test('Tickets reúne listagem, rascunhos, Jira, Qase e GitHub no mesmo arquivo', () => {
  assert.match(fonte, /^\/\*\* Tickets:/);
  const trechos = [
    /abas\.tickets = async/,
    /async function consultarJira/,
    /async function consultarQase/,
    /async function consultarGithub/,
    /async function abrirLocalNovo/,
    /async function abrirLocal\(/,
    /async function abrirTicket\(/,
    /async function abrirCriar\(/,
    /async function abrirDefeito\(/,
    /function blocoStatusDefeito\(/,
    /function abrirIssue\(/
  ];
  for (const trecho of trechos) assert.match(fonte, trecho);
  assert.equal((fonte.match(/abas\.tickets\s*=\s*async/g) || []).length, 1);
});

test('manifesto monta Tickets uma vez e mantém o bundle publicado sem diferenças', () => {
  const m = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json', 'utf8'));
  const bundle = m.bundles.find(b => b.destino === 'dist/renderer/fluxos.js');
  assert.ok(bundle);
  assert.deepEqual(bundle.origens.filter(p => p.startsWith('frontend/tickets/')), [arquivo]);
  assert.equal(new Set(bundle.origens).size, bundle.origens.length);
  const gerado = bundle.origens.map(p => {
    const txt = fs.readFileSync(p, 'utf8');
    assert.match(txt, /^\/\*\* /);
    return txt.slice(txt.indexOf('\n') + 1);
  }).join('');
  assert.equal(gerado, fs.readFileSync(bundle.destino, 'utf8'));
});
