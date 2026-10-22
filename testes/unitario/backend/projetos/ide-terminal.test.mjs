/** Terminal da IDE: comando de uma linha, ambiente sem segredos, só na pasta do projeto, um por vez, com saída lida aos poucos e mascarada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { comandoValido, ambienteDoTerminal, iniciarComando, lerSaida, pararComando } from '../../../../dist/projetos/ideTerminal.js';

const pastaTemporaria = (t) => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-ide-terminal-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };
const esperarFim = async (id) => { for (let i = 0; i < 100; i++) { const s = lerSaida(id, 0); if (s.fim) return s; await new Promise((r) => setTimeout(r, 100)); } throw new Error('o comando não terminou'); };
const node = (js) => '"' + process.execPath + '" -e "' + js + '"';

test('o comando é uma linha só e sem caracteres de controle: o que a confirmação mostra é o que roda', () => {
  assert.equal(comandoValido('  npm test  '), 'npm test');
  for (const ruim of ['', '   ', 'a\nb', 'a\u0000b', 'a\u001b[31mb', 'x'.repeat(1001)]) assert.throws(() => comandoValido(ruim), /TERMINAL_COMANDO/);
});

test('o ambiente herda o PATH, mas não segredos nem o que reconfigura o Prumo', () => {
  const env = ambienteDoTerminal({ PATH: '/bin', GITHUB_TOKEN: 'x', MINHA_SENHA_PASSWORD: 'x', AWS_SECRET_ACCESS_KEY: 'x', API_KEY: 'x', PRUMO_JOB_ID: '1', ELECTRON_RUN_AS_NODE: '1', NODE_OPTIONS: '--x', HOME: '/h', NO_COLOR: '1' });
  assert.equal(env.PATH, '/bin'); assert.equal(env.HOME, '/h');
  for (const nome of ['GITHUB_TOKEN', 'MINHA_SENHA_PASSWORD', 'AWS_SECRET_ACCESS_KEY', 'API_KEY', 'PRUMO_JOB_ID', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS', 'NO_COLOR']) assert.ok(!(nome in env), nome);
  assert.equal(env.FORCE_COLOR, '1');
});

test('o comando roda na pasta do projeto e a saída vem aos poucos, mascarada', async (t) => {
  const pasta = pastaTemporaria(t);
  const id = iniciarComando('p1', pasta, node('console.log(process.cwd()); console.log(\'token=ghp_abcdefghijklmnopqrstuvwxyz0123456789\'); process.exit(3)'));
  const s = await esperarFim(id);
  assert.equal(s.codigo, 3);
  assert.ok(s.texto.toLowerCase().includes(fs.realpathSync(pasta).toLowerCase()), s.texto);
  assert.ok(!s.texto.includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), 'o segredo não pode aparecer na saída');
  assert.equal(lerSaida(id, s.proximo).texto, '', 'depois do fim não há texto novo');
});

test('só um comando por projeto de cada vez, e parar encerra o processo', async (t) => {
  const pasta = pastaTemporaria(t);
  const longo = iniciarComando('p2', pasta, node('setTimeout(()=>{},60000)'));
  assert.throws(() => iniciarComando('p2', pasta, node('1')), /TERMINAL_OCUPADO/);
  assert.ok(iniciarComando('outro', pasta, node('1')), 'outro projeto pode rodar ao mesmo tempo');
  assert.deepEqual(pararComando(longo), { parado: true });
  const s = await esperarFim(longo);
  assert.ok(s.fim);
  assert.deepEqual(pararComando(longo), { parado: false });
});

test('pasta que não existe ou id desconhecido são recusados', () => {
  assert.throws(() => iniciarComando('p3', path.join(os.tmpdir(), 'prumo-nao-existe-' + Date.now()), 'echo oi'));
  assert.throws(() => lerSaida('00000000-0000-4000-8000-000000000000', 0), /TERMINAL_COMANDO_DESCONHECIDO/);
});
