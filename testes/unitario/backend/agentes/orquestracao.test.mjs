// Orquestrador observável: planejamento por pontuação, etapas registradas (inclusive falha), resposta consolidada e registro sem texto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planejarOrquestracao, planejarDiagnosticoQa } from '../../../../dist/agentes/chat/roteamento.js';
import { orquestrar, sinteseDiagnosticoQa } from '../../../../dist/agentes/chat/conversar.js';
import { conversar } from '../../../../dist/agentes/chat/conversar.js';
import { registrarOrquestracao, arquivoDeOrquestracoes } from '../../../../dist/agentes/banco/orquestracao.js';
import { listarOrquestracoes } from '../../../../dist/agentes/banco/orquestracao.js';
import { agentesChat } from '../../../../dist/agentes/tipos/persona.js';
import { criarEspaco } from '../../../../dist/projetos/servicoProjetos.js';

const base = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-orq-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };
const agente = (id) => agentesChat.find((a) => a.id === id);

test('planejar: dois ou mais especialistas com sinal forte; nunca o orquestrador; no máximo três', () => {
  assert.deepEqual(planejarOrquestracao([{ agente: 'regressao', pontos: 3 }, { agente: 'investigacao-bugs', pontos: 4 }]), ['investigacao-bugs', 'regressao']);
  assert.equal(planejarOrquestracao([{ agente: 'regressao', pontos: 5 }, { agente: 'monitoramento', pontos: 2 }]), null, 'sinal fraco não chama outro agente');
  assert.equal(planejarOrquestracao([{ agente: 'orquestrador', pontos: 9 }, { agente: 'regressao', pontos: 3 }]), null);
  assert.equal(planejarOrquestracao([{ agente: 'a', pontos: 3 }, { agente: 'b', pontos: 3 }, { agente: 'c', pontos: 3 }, { agente: 'd', pontos: 3 }]).length, 3);
});

test('diagnóstico QA: somente sob pedido explícito e com projeto; respeita especialistas desligados', () => {
  const projeto = 'projeto-qa';
  assert.deepEqual(planejarDiagnosticoQa('faça um diagnóstico de qualidade do projeto', projeto), ['regressao', 'investigacao-bugs', 'requisitos']);
  assert.deepEqual(planejarDiagnosticoQa('panorama de QA', projeto, ['requisitos']), ['regressao', 'investigacao-bugs']);
  assert.equal(planejarDiagnosticoQa('diagnóstico da qualidade do projeto', null), null);
  assert.equal(planejarDiagnosticoQa('qual é a próxima regressão?', projeto), null);
  assert.deepEqual(planejarDiagnosticoQa('análise da qualidade do projeto', projeto), ['regressao', 'investigacao-bugs', 'requisitos']);
  assert.equal(planejarDiagnosticoQa('saúde do projeto', projeto, ['regressao', 'requisitos']), null);
});

test('síntese de QA: prioriza FAIL, não inventa dados e distingue ausência de evidências', () => {
  const linhas = sinteseDiagnosticoQa({ fatos: ['regressao:execucoes=5', 'regressao:fail=2', 'requisitos:contextosAprovados=0'], fontes: [], linhas: [] });
  assert.match(linhas.join(' '), /Prioridade alta.*2 execução/);
  assert.match(linhas.join(' '), /nenhum contexto aprovado/);
  assert.doesNotMatch(linhas.join(' '), /saudável|aprovado.*qualidade/);
  assert.match(sinteseDiagnosticoQa({ fatos: [], fontes: [], linhas: [] }).join(' '), /inconclusivo/);
  const lacunas = sinteseDiagnosticoQa({ fatos: ['requisitos:contextosAprovados=2', 'requisitos:testesCatalogados=0',
    'requisitos:casosSemAutomacaoAssociada=1', 'requisitos:vinculosAusentes=3'], fontes: [], linhas: [] }).join(' ');
  assert.match(lacunas, /Prioridade de cobertura.*nenhum teste/);
  assert.match(lacunas, /1 caso.*podem ser|1 caso.*confirme se são casos manuais/);
  assert.match(lacunas, /3 relação.*lacuna de rastreabilidade/);
  assert.doesNotMatch(lacunas, /100%|cobertura comprovada|sem defeitos/);
});

test('diagnóstico do projeto: 3 consultas locais, prioridades na resposta, sem criar dados artificiais', async (t) => {
  const b = base(t); const p = await criarEspaco({nome:'Projeto para diagnosticar',descricao:''},b);
  const r = await conversar({espacoId:p.id,pergunta:'faça um diagnóstico de qualidade do projeto',base:b});
  assert.equal(r.agente.id,'orquestrador');
  assert.deepEqual(r.orquestracao?.agentes,['regressao','investigacao-bugs','requisitos']);
  assert.match(r.linhas.join(' '), /Diagnóstico de QA.*Sem execuções registradas/);
  assert.ok(r.linhas.join(' ').includes('Consultei 3 especialistas'));
  assert.equal(r.proximos[0]?.aba, 'testes', 'sem execuções: orientar para preparar uma execução');
});

test('orquestrar: cada etapa tem ordem, tempo, fontes e estado; a falha de um agente não interrompe os outros e é mascarada', async () => {
  let relogio = Date.parse('2026-10-13T10:00:00Z'); const agora = () => new Date(relogio += 5);
  const responder = async (a) => {
    if (a.id === 'regressao') throw new Error('falhou com token=abc123secretoXYZ');
    if (a.id === 'monitoramento') return { linhas: ['Não encontrei nada.'], fontes: [], fatos: [], vazio: true };
    return { linhas: ['Últimas falhas: login.', 'Hipótese: ambiente.'], fontes: [{ rotulo: 'Execuções', aba: 'execucoes' }], fatos: ['falhas=1'], vazio: false };
  };
  const { coleta, registro } = await orquestrar([agente('investigacao-bugs'), agente('regressao'), agente('monitoramento')], [{ agente: 'investigacao-bugs', pontos: 4 }], 'pergunta com SEGREDO-NA-PERGUNTA', null, undefined, responder, agora);
  assert.deepEqual(registro.etapas.map((e) => [e.ordem, e.agente, e.estado]), [[1, 'investigacao-bugs', 'CONCLUIDA'], [2, 'regressao', 'FALHOU'], [3, 'monitoramento', 'SEM_DADOS']]);
  assert.equal(registro.estado, 'PARCIAL'); assert.equal(registro.dependencias, 'INDEPENDENTES'); assert.equal(registro.responsavel, 'orquestrador');
  assert.ok(registro.etapas.every((e) => e.duracaoMs > 0 && e.fim > e.inicio));
  assert.doesNotMatch(registro.etapas[1].erro, /abc123secretoXYZ/);
  assert.doesNotMatch(JSON.stringify(registro), /SEGREDO-NA-PERGUNTA|Últimas falhas/, 'o registro não guarda pergunta nem resposta');
  assert.match(coleta.linhas.join('\n'), /Investigação[\s\S]*Últimas falhas[\s\S]*não consegui consultar[\s\S]*não encontrou dados/);
  assert.deepEqual(coleta.fontes.map((f) => f.aba), ['execucoes']);
});

test('chat: pergunta de duas especialidades vira orquestração registrada; com agente escolhido pela pessoa, não', async (t) => {
  const b = base(t);
  const r = await conversar({ espacoId: null, pergunta: 'quais falhas aconteceram e como está a regressão?', base: b });
  assert.equal(r.agente.id, 'orquestrador'); assert.deepEqual(r.orquestracao.agentes, ['investigacao-bugs', 'regressao']);
  assert.match(r.linhas.join('\n'), /2 especialistas/);
  const lista = listarOrquestracoes(null, b); assert.equal(lista.orquestracoes.length, 1); assert.equal(lista.orquestracoes[0].id, r.orquestracao.id);
  const direto = await conversar({ espacoId: null, pergunta: 'quais falhas aconteceram e como está a regressão?', agente: 'regressao', base: b });
  assert.equal(direto.agente.id, 'regressao'); assert.equal(direto.orquestracao, undefined);
  assert.equal(listarOrquestracoes(null, b).orquestracoes.length, 1);
});

test('registro: guarda os 500 mais recentes, separa por projeto e conta linhas inválidas sem quebrar', (t) => {
  const b = base(t); const reg = (i, espacoId) => ({ id: 'o' + i, em: new Date(i).toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL', motivo: [], agentes: ['regressao'], dependencias: 'INDEPENDENTES', etapas: [], estado: 'CONCLUIDA', duracaoMs: 1 });
  const projeto = '11111111-1111-4111-8111-111111111111';
  for (let i = 0; i < 505; i++) registrarOrquestracao(reg(i, i % 2 ? projeto : null), b);
  fs.appendFileSync(arquivoDeOrquestracoes(b), 'linha quebrada\n');
  assert.equal(fs.readFileSync(arquivoDeOrquestracoes(b), 'utf8').split('\n').filter(Boolean).length, 501);
  const r = listarOrquestracoes(projeto, b);
  assert.equal(r.invalidas, 1); assert.equal(r.orquestracoes.length, 50); assert.equal(r.orquestracoes[0].id, 'o503');
  assert.ok(r.orquestracoes.every((o) => o.espacoId === projeto));
});

test('andamento real: cria etapa em execução, registra especialistas e conclui em uma só entrada', async (t) => {
  const b = base(t), projeto = '11111111-1111-4111-8111-111111111111';
  const observados = [];
  const responder = async (a) => {
    const atual = listarOrquestracoes(projeto, b).orquestracoes[0];
    assert.equal(atual?.estado, 'EXECUTANDO', 'andamento fica consultável antes do fim da análise');
    assert.equal(atual.emExecucao, a.id, 'indica somente especialista realmente ativo');
    return { linhas: ['Consulta local concluída'], fontes: [{ rotulo: 'Execuções', aba: 'execucoes' }], fatos: ['execucoes=0'], vazio: false };
  };
  const progresso = (registro) => {
    observados.push({ id: registro.id, etapas: registro.etapas.length, atual: registro.emExecucao });
    registrarOrquestracao(registro, b);
  };
  const r = await orquestrar([agente('regressao'), agente('investigacao-bugs')],
    [], 'diagnóstico de qualidade do projeto', projeto, b, responder, () => new Date(), progresso);
  registrarOrquestracao(r.registro, b);
  const linhas = fs.readFileSync(arquivoDeOrquestracoes(b), 'utf8').trim().split('\n');
  assert.equal(linhas.length, 1, 'atualiza o mesmo diagnóstico, não duplica execuções');
  assert.deepEqual(observados.map(x => [x.etapas, x.atual]), [[0, 'regressao'], [1, 'investigacao-bugs'], [2, undefined]]);
  assert.ok(observados.every(x => x.id === r.registro.id), 'ID estável durante todo o diagnóstico');
  assert.equal(listarOrquestracoes(projeto, b).orquestracoes[0].estado, 'CONCLUIDA');
  assert.doesNotMatch(linhas[0], /diagnóstico de qualidade do projeto|Consulta local concluída/, 'nenhuma pergunta ou resposta em texto persistida');
});
