/** Projetos Prumo: cada recurso externo origina um espaço independente, sem associações presumidas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarEspaco } from '../../../../dist/projetos/servicoProjetos.js';
import { listarEspacos } from '../../../../dist/projetos/banco/projetos.js';

const baseDeTeste = (t) => {
  const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-projetos-isolamento-'));
  t.after(() => fs.rmSync(p, { recursive: true, force: true }));
  return p;
};
const recurso = (servico, id, chave, contaId) => ({
  id, chave, nome: chave, instancia: servico === 'github' ? 'https://github.com' : servico === 'jira' ? 'https://jira.example.com' : 'https://api.qase.io',
  contaId, tipoId: 'id_api'
});

test('projeto manual começa isolado e sem vínculos remotos', async t => {
  const base = baseDeTeste(t);
  const manual = await criarEspaco({ nome: 'Manual', descricao: 'Sem origem externa' }, base);
  assert.equal(manual.vinculos.length, 0);
  assert.equal(manual.relacoes.length, 0);
  assert.ok(fs.existsSync(path.join(manual.raizContextos, 'qa.project.json')));
});

test('Jira, Qase e GitHub criam registros distintos com apenas o vínculo de origem', async t => {
  const base = baseDeTeste(t);
  const entrada = [
    ['jira', 'jira-1', 'APP', 'pessoa-jira'],
    ['qase', 'qase-2', 'SM', 'pessoa-qase'],
    ['github', 'github-3', 'org/repo', 'pessoa-github']
  ];
  const projetos = [];
  for (const [servico, id, chave, contaId] of entrada) {
    const projeto = await criarEspaco({ nome: chave, descricao: '' }, base,
      { servico, conexaoId: '00000000-0000-4000-8000-000000000001', recurso: recurso(servico, id, chave, contaId) });
    assert.equal(projeto.vinculos.length, 1);
    assert.equal(projeto.vinculos[0].servico, servico);
    assert.equal(projeto.vinculos[0].recurso.id, id);
    assert.equal(projeto.relacoes.length, 0, 'não associa outro serviço por nome');
    projetos.push(projeto);
  }
  assert.equal(new Set(projetos.map(x => x.id)).size, 3);
  assert.equal(new Set(projetos.map(x => x.raizContextos)).size, 3);
  const lidos = listarEspacos(base);
  assert.equal(lidos.length, 3);
  for (const [i, l] of lidos.entries()) {
    assert.equal(l.vinculos[0].servico, entrada[i][0]);
    assert.equal(l.vinculos.length, 1);
  }
});

test('importação recusa identidade externa inválida antes de gravar o projeto', async t => {
  const base = baseDeTeste(t);
  await assert.rejects(criarEspaco({nome: 'Invalido', descricao: ''}, base, {
    servico: 'jira', conexaoId: 'conta-invalida', recurso: recurso('jira','123','APP','id')
  }));
  assert.equal(listarEspacos(base).length, 0);
});

test('fluxo remoto revalida conta e recurso antes de criar e não vincula outros serviços', () => {
  const source = fs.readFileSync('backend/conexoes/regras/nucleoServicos.ts', 'utf8');
  const a = source.slice(source.indexOf('async function importarRecursoComoProjeto('), source.indexOf('async function procurarComentarioNoJira('));
  assert.match(a, /adaptador\.autenticar\(\)/);
  assert.match(a, /adaptador\.obterRecurso\(informado\.id\)/);
  assert.match(a, /SERVICE_SCOPE_CHANGED/);
  assert.match(a, /v\.servico === conta\.servico/);
  assert.match(source, /filaImportacao\.then\(\(\) => importarRecursoComoProjeto/);
  assert.match(source, /QASE_PROJECT_AMBIGUOUS/);
  assert.match(a, /criarEspaco\(\{nome: recurso\.nome/);
  const contrato = fs.readFileSync('backend/login/tipos/acessoDosCanais.ts','utf8');
  assert.match(contrato, /'projetos:recursos': \['projetos', 'VER'\]/);
  assert.match(contrato, /'projetos:importar': \['projetos', 'USAR'\]/);
});
