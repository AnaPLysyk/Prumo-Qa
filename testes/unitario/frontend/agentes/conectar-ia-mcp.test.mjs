/** Conectar sua IA: as quatro IAs com estado em linguagem simples e passos numerados que mostram o que falta, sem chamar CLIs de verdade. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const limpar = (x) => x.flat().filter((f) => f != null && f !== false);
const no = (tag, attrs = {}, ...filhos) => ({ tag, attrs, filhos: limpar(filhos), append(...x) { this.filhos.push(...limpar(x)); }, replaceChildren(...x) { this.filhos = limpar(x); }, setAttribute(k, v) { this.attrs[k] = v; }, querySelector: () => null });
const todos = (n) => [n, ...(n?.filhos || []).flatMap((f) => (typeof f === 'object' ? todos(f) : []))];
const texto = (n) => todos(n).flatMap((x) => x.filhos.filter((f) => typeof f === 'string')).join(' ');
const achar = (raiz, teste) => todos(raiz).find(teste);

function painel(conexoes) {
  const chamadas = [];
  const ctx = {
    estado: { root: 'C:\\projetos\\loja' }, h: no, tr: (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? ''),
    document: { createElementNS: (_, tag) => no(tag) }, navigator: { platform: 'Win32', clipboard: { writeText: async (t) => chamadas.push(['copiar', t]) } },
    DS: { info: (t) => no('ds-info', {}, t) }, selo: (s) => no('selo', {}, s), hora: (x) => 'às ' + x, ms: (n) => n + ' ms', semProjeto: () => no('sem-projeto'),
    avisar: (t, erro) => chamadas.push(['avisar', t, !!erro]), chamar: async (fn) => fn(),
    api: {
      conexoes: async () => { chamadas.push(['conexoes']); return structuredClone(conexoes); },
      conectar: async (raiz, ia) => { chamadas.push(['conectar', raiz, ia]); return { configured: true }; },
      testarIntegracao: async (raiz, ia) => { chamadas.push(['testar', ia]); return { state: 'VALIDADO', protocolCurrent: true, lastProtocol: { state: 'VALIDADO', at: '10:00', durationMs: 8 } }; }
    }
  };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('frontend/agentes/mostrarConfiguracaoMcp.js', 'utf8'), ctx);
  return { ctx, chamadas };
}
const ia = (client, extra) => ({ client, state: 'NAO_CONFIGURADO', installed: false, automatic: false, configuration: { found: false }, command: `& '${client}' 'mcp' 'add'`, destination: 'C:\\cfg', toolsUsed: [], notice: '', lastProtocol: null, lastObserved: null, ...extra });
const conexoes = [
  ia('codex', { installed: true, automatic: true }),
  ia('claude', { state: 'UTILIZADO', installed: true, configuration: { found: true }, lastObserved: { at: '09:00', tool: 'contexto_projeto' } }),
  ia('copilot'),
  ia('gemini', { state: 'ERRO', installed: true })
];

test('as quatro IAs aparecem na ordem, cada uma com o estado em palavras simples', async () => {
  const { ctx } = painel(conexoes); const el = no('div');
  await ctx.mostrarConfiguracaoMcp(el);
  const botoes = todos(el).filter((n) => n.attrs['data-ia']);
  assert.deepEqual(botoes.map((b) => b.attrs['data-ia']), ['claude', 'codex', 'copilot', 'gemini']);
  assert.deepEqual(botoes.map((b) => texto(b.filhos.at(-1))), ['Conectada e em uso', 'Pronta para conectar', 'Não instalada', 'Precisa de atenção']);
  assert.equal(botoes[0].attrs['aria-pressed'], 'true', 'abre na IA que já está conectada');
  const passos = todos(el).filter((n) => n.attrs['data-passo']);
  assert.deepEqual(passos.map((p) => p.attrs.class), ['ia-mcp-passo feito', 'ia-mcp-passo feito', 'ia-mcp-passo atual', 'ia-mcp-passo feito'], 'falta só testar');
  assert.match(texto(el), /Última chamada: às 09:00 · contexto_projeto/);
});

test('IA instalada sem conexão: "Conectar ao Prumo" chama o canal real e recarrega o estado', async () => {
  const { ctx, chamadas } = painel(conexoes); const el = no('div');
  await ctx.mostrarConfiguracaoMcp(el, { ia: 'codex' });
  assert.equal(achar(el, (n) => n.attrs['data-passo'] === '2').attrs.class, 'ia-mcp-passo atual');
  await achar(el, (n) => n.attrs.id === 'ia-mcp-conectar').attrs.onclick();
  assert.deepEqual(chamadas.filter((c) => c[0] !== 'avisar'), [['conexoes'], ['conectar', 'C:\\projetos\\loja', 'codex'], ['conexoes']]);
  assert.deepEqual(chamadas.find((c) => c[0] === 'avisar'), ['avisar', 'Pronto! Feche e abra o Codex de novo.', false]);
  assert.ok(achar(el, (n) => n.tag === 'details' && /Prefiro copiar o comando/.test(texto(n))), 'o comando manual continua à mão');
});

test('IA não instalada mostra o comando de instalação do npm; testar mostra o resultado no passo', async () => {
  const { ctx, chamadas } = painel(conexoes); const el = no('div');
  await ctx.mostrarConfiguracaoMcp(el, { ia: 'copilot' });
  assert.ok(achar(el, (n) => n.tag === 'code' && n.filhos[0] === 'npm.cmd install -g @github/copilot'));
  assert.ok(!achar(el, (n) => n.attrs.id === 'ia-mcp-conectar'), 'sem instalar não há botão de conectar');
  await achar(el, (n) => n.attrs.id === 'ia-mcp-testar').attrs.onclick();
  assert.deepEqual(chamadas.at(-1), ['testar', 'copilot']);
  assert.match(texto(el), /Funcionando · às 10:00/);
  await ctx.mostrarConfiguracaoMcp(no('div'), { ia: 'gemini' });
});

test('sem pasta vinculada, só o título e o aviso de projeto', async () => {
  const { ctx, chamadas } = painel(conexoes); ctx.estado.root = null; const el = no('div');
  await ctx.mostrarConfiguracaoMcp(el);
  assert.deepEqual(el.filhos.map((n) => n.tag), ['h1', 'sem-projeto']);
  assert.equal(chamadas.length, 0);
});
