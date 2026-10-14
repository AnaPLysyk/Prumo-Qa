import test from 'node:test';
import assert from 'node:assert/strict';
import { aprovarNoMac } from '../../../dist/testes/aprovacao/aprovarNoMac.js';
import { aprovarNoLinux } from '../../../dist/testes/aprovacao/aprovarNoLinux.js';
import { textoDaAprovacao } from '../../../dist/testes/aprovacao/textoDaAprovacao.js';

const escopo = (extra = {}) => ({ projectId: 'proj', root: '/home/ana/projeto', capability: 'unit', scopeHash: 'a'.repeat(64), command: '["npm","test"]', expiresAt: new Date(Date.now() + 60000).toISOString(), ...extra });
const executor = (respostas) => { const chamadas = []; const f = async (programa, args, prazo) => { chamadas.push({ programa, args, prazo }); return respostas.shift() ?? { code: 1, timedOut: false }; }; f.chamadas = chamadas; return f; };
const aprovou = { code: 0, timedOut: false };
const recusou = { code: 1, timedOut: false };

test('aprovação macOS/Linux recusa data inválida e consentimento que termina depois da expiração', async t => {
  let agora = 1000;
  t.mock.method(Date, 'now', () => agora);
  const invalido = escopo({ expiresAt: 'invalida' });
  const naoExecutar = () => { throw new Error('Não deve abrir autenticação'); };
  assert.equal(await aprovarNoMac(invalido, naoExecutar), null);
  assert.equal(await aprovarNoLinux(invalido, naoExecutar), null);
  const prazo = escopo({ expiresAt: new Date(1100).toISOString() });
  assert.equal(await aprovarNoMac(prazo, async () => { agora = 1200; return aprovou; }), null);
  agora = 1000;
  let chamadas = 0;
  assert.equal(await aprovarNoLinux(prazo, async () => { chamadas++; agora = 1200; return aprovou; }, n => '/usr/bin/' + n), null);
  assert.equal(chamadas, 1, 'escopo vencido depois da confirmação não chega ao polkit');
});

test('texto da aprovação mostra projeto, pasta, comando e escopo, sem caracteres de controle e com tamanho limitado', () => {
  const t = textoDaAprovacao(escopo({ command: 'x'.repeat(900) + String.fromCharCode(7) }));
  assert.match(t, /Projeto: proj/); assert.match(t, /Pasta: \/home\/ana\/projeto/); assert.match(t, /Escopo: aaaaaaaaaaaaaaaa/); assert.ok(t.length < 700);
  assert.doesNotMatch(t.replaceAll('\n', ' '), /[\u0000-\u001f]/);
});

test('macOS: aprova só se o sistema autenticou; o texto vai como argumento, nunca dentro do código do AppleScript', async () => {
  const ok = executor([aprovou]);
  const r = await aprovarNoMac(escopo({ capability: '"; do shell script "rm -rf ~' }), ok);
  assert.equal(r.method, 'macOS-AdminAuth'); assert.equal(r.scopeHash, 'a'.repeat(64)); assert.ok(r.subject);
  const [{ programa, args }] = ok.chamadas;
  assert.equal(programa, '/usr/bin/osascript');
  assert.ok(args.some(a => a.includes('with administrator privileges')));
  assert.ok(!args.slice(0, -1).some(a => a.includes('rm -rf')), 'o texto de fora não entra no código do AppleScript');
  assert.ok(args.at(-1).includes('rm -rf'), 'aparece só como dado, no último argumento');
  assert.equal(await aprovarNoMac(escopo(), executor([recusou])), null);
  await assert.rejects(aprovarNoMac(escopo(), executor([{ code: null, timedOut: true }])), /APPROVAL_TIMEOUT/);
  assert.equal(await aprovarNoMac(escopo({ expiresAt: new Date(Date.now() - 1000).toISOString() }), executor([aprovou])), null);
});

test('Linux: mostra o escopo (zenity) e depois exige a autenticação do polkit; sem as ferramentas, recusa em vez de aprovar às cegas', async () => {
  const achar = (n) => ({ pkexec: '/usr/bin/pkexec', zenity: '/usr/bin/zenity' })[n];
  const ok = executor([aprovou, aprovou]);
  const r = await aprovarNoLinux(escopo(), ok, achar);
  assert.equal(r.method, 'Linux-Polkit');
  assert.deepEqual(ok.chamadas.map(c => c.programa), ['/usr/bin/zenity', '/usr/bin/pkexec']);
  assert.ok(ok.chamadas[0].args.includes('--no-markup') && ok.chamadas[0].args.some(a => a.startsWith('--text=') && a.includes('Projeto: proj')));
  const semSenha = executor([recusou]);
  assert.equal(await aprovarNoLinux(escopo(), semSenha, achar), null, 'recusar na janela encerra sem pedir senha');
  assert.equal(semSenha.chamadas.length, 1);
  const recusaSistema = executor([aprovou, recusou]);
  assert.equal(await aprovarNoLinux(escopo(), recusaSistema, achar), null); assert.equal(recusaSistema.chamadas.length, 2);
  await assert.rejects(aprovarNoLinux(escopo(), executor([]), (n) => (n === 'zenity' ? '/usr/bin/zenity' : undefined)), /APPROVAL_UNAVAILABLE/);
  await assert.rejects(aprovarNoLinux(escopo(), executor([]), (n) => (n === 'pkexec' ? '/usr/bin/pkexec' : undefined)), /APPROVAL_UNAVAILABLE/);
  const kd = executor([aprovou, aprovou]);
  assert.equal((await aprovarNoLinux(escopo(), kd, (n) => ({ pkexec: '/usr/bin/pkexec', kdialog: '/usr/bin/kdialog' })[n])).method, 'Linux-Polkit');
  assert.equal(kd.chamadas[0].programa, '/usr/bin/kdialog');
});
