import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fonte = fs.readFileSync('frontend/compartilhado/runtime/app.js', 'utf8');
const trecho = fonte.slice(fonte.indexOf('const TEXTO_DO_CODIGO'), fonte.indexOf('function semProjeto'));
const textoErro = new Function(trecho + '; return textoErro;')();

test('código de serviço solto vira frase em português, com o código só como detalhe', () => {
  assert.match(textoErro('SERVICE_NOT_FOUND'), /^O serviço não achou .* \(código SERVICE_NOT_FOUND\)$/);
  assert.match(textoErro('CREDENTIAL_INVALID_OR_EXPIRED'), /Conecte de novo em Projetos/);
});

test('o formato "CODIGO: texto" e textos comuns continuam como antes', () => {
  assert.equal(textoErro('SERVICE_DISABLED: ative o vínculo.'), 'Ative o vínculo. (código SERVICE_DISABLED)');
  assert.equal(textoErro('falhou'), 'falhou');
  assert.equal(textoErro(''), 'Falha sem detalhe.');
});
