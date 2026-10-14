/** Chat com Claude Code e Codex: resposta, travas do CLI, mascaramento e volta à resposta local. O executor é falso; nenhum CLI real roda. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { argumentosDoProvedorDeIa } from '../../../../dist/agentes/chat/argumentosDoProvedorDeIa.js';
import { consultarIaExterna } from '../../../../dist/agentes/chat/consultarIaExterna.js';
import { separarAprendizados } from '../../../../dist/agentes/chat/separarAprendizados.js';

const agente = { id: 'orquestrador', nome: 'Prumo', especializacao: null, dominio: 'Chat', palavras: [], aba: 'inicio', rotulo: 'Início' };
const montar = (_a, coleta, modo, extra = {}) => ({ agente: { id: agente.id, nome: agente.nome, especializacao: null }, linhas: coleta.linhas, fontes: [], fatos: [], modo, estilo: 'direto', rota: [], proximos: [], acoes: extra.acoes ?? [], pendente: null, pessoa: null, continuou: false, ...(extra.aviso ? { aviso: extra.aviso } : {}) });
const contexto = (provedor, o) => ({ o, agente, pergunta: 'Resuma os riscos.', local: { linhas: ['Informação local'], fontes: [], fatos: [] }, estilo: 'direto', nome: 'Prumo', perfil: null, historico: [], comum: { rota: [], continuou: false, proximos: [] }, provedor, montar, vestido: () => ['Informação local'] });
const base = (t) => { const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-chat-ia-')); t.after(() => fs.rmSync(b, { recursive: true, force: true })); return b; };
const opcoes = (t, provedor, executor) => ({ pergunta: 'x', espacoId: null, base: base(t), autorizados: { [provedor]: true }, executavel: () => 'ia.exe', executor });

for (const [provedor, modo] of [['claude', 'CLAUDE'], ['codex', 'CODEX']]) {
  test(`${provedor}: resposta do CLI vira o modo ${modo}, com segredo mascarado e limite de linhas`, async (t) => {
    const chamadas = [];
    const r = await consultarIaExterna(contexto(provedor, opcoes(t, provedor, async (exe, args, o) => { chamadas.push({ exe, args, o }); return { codigo: 0, saida: 'Risco 1: token=SEGREDO123456 vazou.\n\nRisco 2: falta cobertura.', erro: '' }; })));
    assert.equal(r.modo, modo); assert.equal(chamadas.length, 1); assert.equal(chamadas[0].exe, 'ia.exe'); assert.equal(chamadas[0].o.timeoutMs, 120000);
    assert.doesNotMatch(r.linhas.join('\n'), /SEGREDO123456/); assert.match(r.linhas.join('\n'), /Risco 2/);
    assert.equal(r.aviso, undefined);
  });
  test(`${provedor}: código de saída diferente de zero, saída vazia ou exceção voltam à resposta local com aviso`, async (t) => {
    for (const executor of [async () => ({ codigo: 1, saida: 'texto', erro: 'x' }), async () => ({ codigo: 0, saida: '   ', erro: '' }), async () => ({ codigo: null, saida: '', erro: '' }), async () => { throw new Error('boom'); }]) {
      const r = await consultarIaExterna(contexto(provedor, opcoes(t, provedor, executor)));
      assert.equal(r.modo, 'LOCAL'); assert.deepEqual(r.linhas, ['Informação local']); assert.ok(r.aviso);
    }
  });
  test(`${provedor}: autorizar o outro provedor não libera este`, async (t) => {
    const outro = provedor === 'claude' ? 'codex' : 'claude'; let executou = false;
    const r = await consultarIaExterna(contexto(provedor, { ...opcoes(t, provedor, async () => { executou = true; return { codigo: 0, saida: 'x', erro: '' }; }), autorizados: { [outro]: true } }));
    assert.equal(r.modo, 'LOCAL'); assert.equal(executou, false);
  });
}

test('argumentos do Claude: sem ferramentas, sem MCP, sem hooks e sem sessão salva; prompt depois de --', () => {
  const a = argumentosDoProvedorDeIa('claude', 'pergunta');
  assert.equal(a[0], '-p'); assert.deepEqual(a.slice(a.indexOf('--tools'), a.indexOf('--tools') + 2), ['--tools', '']);
  for (const x of ['--strict-mcp-config', '--no-session-persistence']) assert.ok(a.includes(x), x);
  assert.match(a[a.indexOf('--settings') + 1], /disableAllHooks":true/); assert.match(a[a.indexOf('--mcp-config') + 1], /"mcpServers":\{\}/);
  assert.deepEqual(a.slice(-2), ['--', 'pergunta']);
});
test('argumentos do Codex: exec somente leitura, sem aprovação, sem shell, sem plugins e sem sessão; prompt depois de --', () => {
  const a = argumentosDoProvedorDeIa('codex', 'pergunta');
  assert.equal(a[0], 'exec'); assert.deepEqual(a.slice(a.indexOf('--sandbox'), a.indexOf('--sandbox') + 2), ['--sandbox', 'read-only']);
  for (const x of ['--ephemeral', '--ignore-user-config', 'shell_tool', 'plugins', 'hooks', 'approval_policy="never"']) assert.ok(a.includes(x), x);
  assert.deepEqual(a.slice(-2), ['--', 'pergunta']);
});
test('um prompt que parece opção continua sendo só texto, depois de --', () => {
  for (const p of ['claude', 'codex']) { const a = argumentosDoProvedorDeIa(p, '--dangerously-skip-permissions'); assert.equal(a.at(-1), '--dangerously-skip-permissions'); assert.equal(a.at(-2), '--'); }
});
test('linhas APRENDIZADO: viram rascunho (no máximo duas) e saem do texto mostrado', () => {
  const r = separarAprendizados('Resposta.\nAPRENDIZADO: Login exige MFA no ambiente de teste\n- APRENDIZADO: Smoke roda em 2 min\nAPRENDIZADO: terceiro ignorado aqui');
  assert.equal(r.aprendizados.length, 2); assert.doesNotMatch(r.texto, /Login exige MFA|Smoke roda/);
});
