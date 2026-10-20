import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const visao = fs.readFileSync(path.join(raiz, 'frontend/testes/visao-geral-dos-testes.parte.js'), 'utf8');
const caso = fs.readFileSync(path.join(raiz, 'frontend/testes/fluxos-casos-qase.parte.js'), 'utf8');
const fechamento = fs.readFileSync(path.join(raiz, 'frontend/compartilhado/fluxos-fechamento.parte.js'), 'utf8');

test('com Qase vinculado o comando principal cria direto na API; sem vinculo abre modo local', () => {
  assert.match(visao, /vq\s*\?\s*\[DS\.acao\('Nova proposta de caso',\s*\(\)\s*=>\s*F\.novaProposta\(e\)/);
  assert.match(visao, /DS\.acao\('Novo caso no Qase',\s*\(\)\s*=>\s*F\.novoCasoQase\(e\),\s*\{ id: 'qase-novo', primaria: true/);
  assert.match(visao, /:\s*\[DS\.acao\('Novo caso local',\s*\(\)\s*=>\s*F\.novaProposta\(e\)/);
  assert.match(visao, /desabilitado:\s*!esc/, 'escrita desligada nao habilita envio');
  assert.match(fechamento, /novaProposta,\s*novoCasoQase,\s*telaCasosLocais,\s*abrirCasoLocal,\s*novaSuite/);
});

test('fluxo conectado grava somente no Qase, usando operacao remota confirmada', () => {
  const inicio = caso.indexOf('async function novoCasoQase(e)');
  const fim = caso.indexOf('async function abrirCasoLocal(e, caso)', inicio);
  assert.ok(inicio > 0 && fim > inicio, 'fluxos distintos e identificaveis');
  const conectado = caso.slice(inicio, fim);
  assert.match(conectado, /api\.servicoConsultar\(e\.id,\s*'qase',\s*'suites'/);
  assert.match(conectado, /executarOperacao\(e,\s*'qase\.criar_caso',\s*p\)/);
  assert.match(conectado, /r\.estado\s*!==\s*'CONFIRMADA'/);
  assert.doesNotMatch(conectado, /api\.propostaCriar|api\.propostaEditar/, 'nao cria copia local do cadastro remoto');
  assert.match(conectado, /delete mem\.casos/, 'invalida cache para proxima consulta remota');
});

test('rastreabilidade exige Jira vinculado e acusa falha parcial', () => {
  assert.match(caso, /const ticket = vj\s*\?/);
  assert.match(caso, /chave\.startsWith\(vj\.recurso\.chave/);
  assert.match(caso, /r\.remoto\?\.detalhes\?\.ticket\s*!==\s*chave/);
  assert.match(caso, /api\.espacoAssociar\(e\.id/);
  assert.match(caso, /mapa local de rastreabilidade não foi atualizado/);
});

test('repositório Qase carrega páginas adicionais sem repetir casos nem esconder falha', () => {
  assert.match(visao, /src\.casos\?\.proxima\s*!=\s*null\s*\?\s*DS\.barra/);
  assert.match(visao, /F\.carregarQase\(e,\s*mem,\s*'casos',\s*\{\s*offset,\s*limite:\s*100\s*\}\)/);
  assert.match(visao, /if\s*\(proxima\.erro\)\s*return/);
  assert.match(visao, /new Map\(\[\.\.\.src\.casos\.itens,\s*\.\.\.proxima\.itens\]/);
  assert.match(visao, /mem\.casos\s*=\s*\{\s*itens:/);
  assert.match(visao, /casos carregados do Qase/);
});

test('classificação Qase fica na consulta remota e respeita caso manual ou automatizado', () => {
  const fonte = fs.readFileSync(path.join(raiz, 'frontend/compartilhado/consultarServicoRemoto.js'), 'utf8');
  const classificar = vm.runInNewContext(fonte + '\nclassificacaoCaso;', {});
  assert.equal(classificar({ isManual: true }), 'MANUAL');
  assert.equal(classificar({ isManual: true, isToBeAutomated: true }), 'MANUAL · automação planejada');
  assert.equal(classificar({ isManual: false }), 'AUTOMATIZADO');
  assert.equal(classificar({ automation: 2 }), 'AUTOMATIZADO');
  assert.equal(classificar({ automation: 0 }), 'MANUAL');
  assert.equal(classificar({}), 'Classificação não informada pela API');
});

test('falha de resultados locais em Testes não é interpretada como consulta vazia', async () => {
  const inicio = visao.indexOf('async function fontes(e,');
  const fim = visao.indexOf('\n  const casaQase', inicio);
  assert.ok(inicio > 0 && fim > inicio);
  const mem = {}; let chamadas = 0, falhar = true;
  const contexto = {
    memoriaDaTela: () => mem,
    vinc: () => null,
    api: {
      testesCatalogo: async () => ({ ok: true, data: { semPasta: true } }),
      runs: async () => { chamadas++; return falhar ? { ok: false, error: 'SERVICE_UNAVAILABLE' } : { ok: true, data: [{ id: 'run-1' }] }; }
    }
  };
  const carregar = vm.runInNewContext('(' + visao.slice(inicio, fim) + ')', contexto);
  const primeira = await carregar({ id: 'pr-1' });
  assert.deepEqual(Array.from(primeira.runs), []);
  assert.match(primeira.erroRuns, /não puderam ser consultados/);
  assert.equal(chamadas, 1);
  falhar = false;
  const semAtualizar = await carregar({ id: 'pr-1' });
  assert.ok(semAtualizar.erroRuns, 'não apresenta dados antigos como sucesso');
  assert.equal(chamadas, 1);
  const atualizada = await carregar({ id: 'pr-1' }, { forcar: true });
  assert.equal(atualizada.erroRuns, undefined);
  assert.equal(atualizada.runs[0].id, 'run-1');
  assert.equal(chamadas, 2);
  assert.match(visao, /src\.erroRuns\s*\?\s*DS\.alerta/);
});
