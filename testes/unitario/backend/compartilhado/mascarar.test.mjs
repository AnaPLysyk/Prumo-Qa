import test from 'node:test';
import assert from 'node:assert/strict';
import { mascarar } from '../../../../dist/compartilhado/seguranca/mascarar.js';

test('mascarar cobre senha em português, AWS, Slack, Google e URL com credenciais de qualquer esquema', () => {
  const segredos = ['abc12345', 'AKIAIOSFODNN7EXAMPLE', 'xoxb-123456789012-abcdefghij', 'AIzaSyA1234567890abcdefghijklmnopqrstuv', 'p4ss', 'ASIAIOSFODNN7EXAMPLE'];
  const saida = mascarar(`senha: abc12345\n${segredos[1]}\n${segredos[2]}\n${segredos[3]}\npostgres://usuario:p4ss@host:5432/db\nSenha=abc12345\n${segredos[5]}`);
  for (const segredo of segredos) assert.ok(!saida.includes(segredo), `vazou: ${segredo}`);
  assert.match(saida, /postgres:\/\/\[REDACTED\]@host:5432\/db/);
});

test('mascarar mantém os padrões antigos (token, Bearer, GitHub, https com senha, chave privada)', () => {
  const saida = mascarar('token=ABCDEF123456 Authorization: Bearer abc.def.ghi ghp_abcdefghijklmnop1234 https://u:segredo@host/x');
  for (const segredo of ['ABCDEF123456', 'abc.def.ghi', 'ghp_abcdefghijklmnop1234', 'segredo']) assert.ok(!saida.includes(segredo), segredo);
  assert.match(mascarar('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----'), /\[REDACTED KEY\]/);
});

test('mascarar não altera texto comum nem URLs sem credenciais', () => {
  for (const texto of [
    'A senha deve ter 8 caracteres e o usuário recebe um aviso.',
    'Redefinir senha em Ajustes.',
    'Veja https://exemplo.com/docs e postgres://host:5432/db sem credenciais.',
    'Horário 10:30 em http://localhost:3000/a?b=c',
    'AKIA curto, xox sem hífen, AIza curto e a chave AKIAcurta.',
    'Falhas: 3, execuções: 12, status: PASS.'
  ]) assert.equal(mascarar(texto), texto);
});

test('mascarar troca também segredos informados e ignora os muito curtos', () => {
  assert.equal(mascarar('valor meu-segredo-123 e abc', ['meu-segredo-123', 'abc']), 'valor [REDACTED] e abc');
});
