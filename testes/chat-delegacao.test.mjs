/** Confere que o chat não usa IA externa sem autorização nem grava aprendizados sem sugestão. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { skillDoAgente, SkillUnavailable } from '../dist/agentes/chat/skillDoAgente.js';
import { montarPrompt } from '../dist/agentes/chat/montarPrompt.js';
import { consultarIaExterna } from '../dist/agentes/chat/consultarIaExterna.js';
import { registrarSugestoesDaIa } from '../dist/agentes/chat/registrarSugestoesDaIa.js';

const agente = { id: 'orquestrador', nome: 'Prumo', especializacao: null, dominio: 'Chat', palavras: [], aba: 'inicio', rotulo: 'Início' };
function contexto(o) {
  const local = { linhas: ['Informação local'], fontes: [], fatos: [] };
  return {
    o, agente, pergunta: 'O que está acontecendo?', local,
    estilo: 'direto', nome: 'Prumo', perfil: null, historico: [],
    comum: { rota: [], continuou: false, proximos: [] },
    provedor: 'codex',
    montar: (_agente, coleta, modo, extra = {}) => ({
      agente: { id: agente.id, nome: agente.nome, especializacao: null },
      linhas: coleta.linhas, fontes: coleta.fontes, fatos: coleta.fatos,
      modo, estilo: 'direto', rota: extra.rota ?? [], proximos: extra.proximos ?? [],
      acoes: extra.acoes ?? [], pendente: null, pessoa: null, continuou: false,
      ...(extra.aviso ? { aviso: extra.aviso } : {})
    }),
    vestido: () => ['Informação local']
  };
}

test('sem autorização não procura nem executa Claude/Codex', async () => {
  let executado = false, localizado = false;
  const r = await consultarIaExterna(contexto({
    pergunta: 'teste', espacoId: null, autorizados: { codex: false },
    executavel: () => { localizado = true; return 'codex'; },
    executor: async () => { executado = true; throw Error('nunca executar'); }
  }));
  assert.equal(r.modo, 'LOCAL');
  assert.match(r.aviso, /não autorizada/);
  assert.equal(localizado, false);
  assert.equal(executado, false);
});

test('mesmo autorizado, sem executável retorna somente dados locais', async () => {
  let executado = false;
  const r = await consultarIaExterna(contexto({
    pergunta: 'teste', espacoId: null, autorizados: { codex: true },
    executavel: () => null,
    executor: async () => { executado = true; throw Error('nunca executar'); }
  }));
  assert.equal(r.modo, 'LOCAL');
  assert.match(r.aviso, /não encontrado/);
  assert.equal(executado, false);
});

test('sem aprendizados não grava nada nem pede aprovação', () => {
  const r = registrarSugestoesDaIa({ pergunta: 'teste', espacoId: null }, agente, 'codex', []);
  assert.deepEqual(r, { acoes: [], sugeridos: 0, naoRegistrados: 0 });
});

function simularSkill(t, texto) {
  let leituras = 0;
  t.mock.method(fs, 'openSync', () => 123);
  t.mock.method(fs, 'fstatSync', () => ({ isFile: () => true, size: Buffer.byteLength(texto) }));
  t.mock.method(fs, 'readSync', (_fd, buffer, offset) => {
    if (leituras++) return 0;
    return buffer.write(texto, offset, undefined, 'utf8');
  });
  t.mock.method(fs, 'closeSync', () => {});
  return () => leituras;
}

test('Skill integral acima de 6000 caracteres aparece uma vez no prompt', t => {
  const texto = 'á'.repeat(7000) + ' FIM DA SKILL';
  const leituras = simularSkill(t, texto);
  const prompt = montarPrompt(agente, 'Pergunta', { linhas: ['Fato'], fontes: [], fatos: [] }, 'direto', 'Prumo');
  assert.ok(prompt.includes(texto));
  assert.equal(prompt.split('FIM DA SKILL').length, 2);
  assert.equal(leituras(), 2, 'uma leitura do conteúdo e uma consulta de fim de arquivo');
});

test('Skill desconhecida ou traversal é recusada antes de acessar arquivos', t => {
  let acessos = 0;
  t.mock.method(fs, 'openSync', () => { acessos++; throw Error('não abrir'); });
  for (const id of ['desconhecida', '../qa', 'qa/../../dados']) {
    assert.throws(() => skillDoAgente(id), erro => erro instanceof SkillUnavailable && erro.code === 'SKILL_UNAVAILABLE');
  }
  assert.equal(acessos, 0);
});

test('Skill ausente retorna erro controlado sem silenciar a falha', t => {
  t.mock.method(fs, 'openSync', () => { throw Object.assign(Error('ausente'), { code: 'ENOENT' }); });
  assert.throws(() => skillDoAgente('qa-geral'), erro => erro.code === 'SKILL_UNAVAILABLE');
});

test('Skill maior que 64 KiB é recusada e não executa o provedor', async t => {
  const leituras = simularSkill(t, 'x'.repeat(65537));
  assert.throws(() => skillDoAgente(null), erro => erro.code === 'SKILL_UNAVAILABLE');
  let executado = false;
  const c = contexto({ pergunta: '', espacoId: null, autorizados: { codex: true },
    executavel: () => 'codex', executor: async () => { executado = true; throw Error('não executar'); } });
  c.pergunta = ''; // Sem termos: a coleta de conhecimentos termina antes de consultar armazenamento.
  const resposta = await consultarIaExterna(c);
  assert.equal(resposta.modo, 'LOCAL');
  assert.match(resposta.aviso, /SKILL_UNAVAILABLE/);
  assert.equal(executado, false);
  assert.equal(leituras(), 0);
});
