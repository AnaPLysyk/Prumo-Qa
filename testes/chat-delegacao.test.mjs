/** Confere que o chat não usa IA externa sem autorização nem grava aprendizados sem sugestão. */
import test from 'node:test';
import assert from 'node:assert/strict';
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
