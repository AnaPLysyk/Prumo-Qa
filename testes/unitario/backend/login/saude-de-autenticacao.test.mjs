import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { criarServico, estadoDaAutenticacao } from '../../../../backend/aplicativo/servidor/servidor.mjs';

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

test('configuracao gradual no Render nao habilita login sem banco, segredo e e-mail', () => {
  assert.deepEqual(estadoDaAutenticacao({}), { configurada: false, incompleta: false });
  assert.deepEqual(estadoDaAutenticacao({ DATABASE_URL: 'postgresql://interno' }), {
    configurada: false, incompleta: true
  });
  const completa = {
    DATABASE_URL: 'postgresql://interno',
    BETTER_AUTH_SECRET: 's'.repeat(40),
    BETTER_AUTH_URL: 'https://prumo-qa-servico.onrender.com',
    RESEND_API_KEY: 'chave-de-teste',
    PRUMO_EMAIL_REMETENTE: 'teste@example.com'
  };
  assert.deepEqual(estadoDaAutenticacao(completa), { configurada: true, incompleta: false });
  assert.deepEqual(estadoDaAutenticacao({ ...completa, RESEND_API_KEY: '   ' }), {
    configurada: false, incompleta: true
  });
});
