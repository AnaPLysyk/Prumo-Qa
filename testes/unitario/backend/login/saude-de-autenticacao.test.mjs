import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { criarServico } from '../../../../backend/aplicativo/servidor/servidor.mjs';

async function verificar(autenticacao) {
  let status = null;
  let conteudo = null;
  const atender = criarServico({ configurado: false, enviar: async () => {}, autenticacao });
  await atender({ method: 'GET', url: '/saude/autenticacao' }, {
    writeHead(codigo) { status = codigo; },
    end(json) { conteudo = JSON.parse(json); }
  });
  return { status, conteudo };
}

test('saude da autenticacao recusa servico ausente e banco indisponivel', async () => {
  assert.deepEqual(await verificar(null), { status: 503, conteudo: { autenticacao: false } });
  assert.deepEqual(await verificar({ checar: async () => { throw new Error('banco indisponivel'); } }), {
    status: 503, conteudo: { autenticacao: false }
  });
});

test('saude da autenticacao confirma somente a verificacao real', async () => {
  let consultas = 0;
  const resultado = await verificar({ checar: async () => { consultas++; } });
  assert.deepEqual(resultado, { status: 200, conteudo: { autenticacao: true } });
  assert.equal(consultas, 1);
});

test('Render de producao consulta saude da autenticacao, nao apenas HTTP basico', () => {
  const yaml = fs.readFileSync(new URL('../../../../render.yaml', import.meta.url), 'utf8');
  const inicio = yaml.indexOf('    name: prumo-qa-servico');
  assert.ok(inicio !== -1, 'servico de producao presente no manifesto');
  const servico = yaml.slice(inicio);
  assert.match(servico, /^    healthCheckPath: \/saude\/autenticacao$/m);
});
