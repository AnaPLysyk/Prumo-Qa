/** Confere que o chat não usa IA externa sem autorização nem grava aprendizados sem sugestão. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { skillDoAgente } from '../../../dist/agentes/chat/skillDoAgente.js';
import { listarTrechosDeSkill } from '../../../dist/agentes/banco/listarTrechosDeSkill.js';
import { decidirTrechoDeSkill } from '../../../dist/agentes/banco/decidirTrechoDeSkill.js';
import { montarPrompt } from '../../../dist/agentes/chat/montarPrompt.js';
import { consultarIaExterna } from '../../../dist/agentes/chat/consultarIaExterna.js';
import { registrarSugestoesDaIa } from '../../../dist/agentes/chat/registrarSugestoesDaIa.js';

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

test('Skill vai ao prompt uma vez só, em trechos aprovados e dentro de 8 KB', () => {
  const prompt = montarPrompt(agente, 'estratégia de testes e riscos', { linhas: ['Fato'], fontes: [], fatos: [] }, 'direto', 'Prumo');
  const bloco = prompt.split('--- Skill (trechos aprovados que combinam com a pergunta) ---');
  assert.equal(bloco.length, 2, 'um único bloco de Skill');
  assert.ok(Buffer.byteLength(skillDoAgente(null, 'estratégia de testes e riscos').texto) <= 8000);
});

test('Skill de especialização desconhecida ou com traversal é recusada antes de acessar arquivos', t => {
  let acessos = 0;
  for (const m of ['lstatSync', 'readFileSync', 'readdirSync', 'openSync']) t.mock.method(fs, m, () => { acessos++; throw Error('não abrir'); });
  for (const id of ['desconhecida', '../qa', 'qa/../../dados']) assert.throws(() => skillDoAgente(id, 'pergunta'), /SKILL_SPECIALIZATION_INVALID/);
  assert.equal(acessos, 0);
});

test('sem trecho aprovado da especialização, a IA externa não é chamada e a falha aparece', async () => {
  for (const t of listarTrechosDeSkill({ especializacao: 'monitoramento', estados: ['APROVADO'] })) decidirTrechoDeSkill(t.id, 'DESCARTADO');
  assert.throws(() => skillDoAgente('monitoramento', 'histórico'), /SKILL_UNAVAILABLE/);
  let executado = false;
  const c = contexto({ pergunta: 'histórico', espacoId: null, autorizados: { codex: true },
    executavel: () => 'codex', executor: async () => { executado = true; throw Error('não executar'); } });
  c.agente = { ...agente, id: 'monitoramento', especializacao: 'monitoramento' };
  const resposta = await consultarIaExterna(c);
  assert.equal(resposta.modo, 'LOCAL');
  assert.match(resposta.aviso, /SKILL_UNAVAILABLE/);
  assert.equal(executado, false);
});
