/** Tickets: valida o contrato por origem, a exclusividade das fontes e o bundle inalterado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raiz = 'frontend/tickets/';
const partes = [
  'fluxos-tickets.parte.js',
  'tickets-locais.parte.js',
  'tickets-jira.parte.js',
  'tickets-defeitos-qase.parte.js',
  'tickets-issues-github.parte.js'
];
const ler = nome => fs.readFileSync(raiz + nome, 'utf8');

test('cada funcionalidade de Tickets tem um arquivo na própria tela', () => {
  const [lista, local, jira, qase, github] = partes.map(ler);
  assert.match(lista, /abas\.tickets = async/);
  assert.match(lista, /async function consultarJira/);
  assert.match(lista, /async function consultarQase/);
  assert.match(lista, /async function consultarGithub/);
  assert.match(local, /async function abrirLocalNovo/);
  assert.match(local, /async function abrirLocal\(/);
  assert.match(jira, /async function abrirTicket\(/);
  assert.match(jira, /async function abrirCriar\(/);
  assert.match(qase, /async function abrirDefeito\(/);
  assert.match(qase, /function blocoStatusDefeito\(/);
  assert.match(github, /function abrirIssue\(/);
  assert.doesNotMatch(lista, /async function abrirCriar|function abrirIssue|async function abrirLocalNovo/);
  for (const arquivo of partes) assert.match(ler(arquivo), /^\/\*\* Tickets:/);
});

test('manifesto monta Tickets uma vez, mantendo o JS publicado byte a byte', () => {
  const m=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json', 'utf8'));
  const bundle=m.bundles.find(b=>b.destino==='dist/renderer/fluxos.js');
  assert.ok(bundle);
  const origens=partes.map(n=>raiz+n);
  const encontrados=bundle.origens.filter(p=>p.startsWith(raiz));
  assert.deepEqual(encontrados,origens);
  assert.equal(new Set(bundle.origens).size,bundle.origens.length);
  const gerado=bundle.origens.map(p=>{
    const text=fs.readFileSync(p,'utf8');
    assert.match(text,/^\/\*\* /);
    return text.slice(text.indexOf('\n')+1);
  }).join('');
  assert.equal(gerado,fs.readFileSync(bundle.destino,'utf8'));
});
