/** Perfil da pessoa: o que é guardado, validado, o que cada IA recebe e o isolamento entre contas. Banco de conhecimento em memória; nada sai do computador. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lerPerfil as lerPerfilDaBase } from '../../../../dist/agentes/repositorioPerfil.js';
import { salvarPerfil as salvarPerfilDaBase } from '../../../../dist/agentes/repositorioPerfil.js';
import { registrarAtendimento } from '../../../../dist/agentes/repositorioAtendimentos.js';
import { listarAtendimentos } from '../../../../dist/agentes/repositorioAtendimentos.js';
import { avaliarAtendimento } from '../../../../dist/agentes/repositorioAtendimentos.js';
import { pessoaDoConhecimento } from '../../../../dist/agentes/banco/pessoaDoConhecimento.js';
import { entrarNaConta, sairDaConta } from '../../../../dist/login/regras/contas.js';
import { criarContaPelaAdministracao } from '../../../../dist/administracao/servico.js';
import { encerrarSessao } from '../../../../dist/login/regras/sessao.js';
import { criarPrimeiraConta } from '../../../apoio/contas-por-email.mjs';
import { LIMITE_FOCO, normalizarFoco } from '../../../../dist/agentes/regras/normalizarFoco.js';
import { criarEsquemaDoConhecimento } from '../../../../dist/agentes/banco/criarEsquemaDoConhecimento.js';
import { personalidadeParaIa } from '../../../../dist/agentes/servicoEstiloDoChat.js';
import { conhecimentoParaIA } from '../../../../dist/agentes/regras/conhecimentoParaIA.js';
import { saudacao } from '../../../../dist/agentes/servicoEstiloDoChat.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

// 2.17: o perfil é da conta da sessão. Cada teste usa uma pasta de dados temporária com a conta "Ana" na sessão (nunca a pasta da pessoa).
const ANA = { email: 'ana@prumo.test', nome: 'Ana', senha: 'Perfil-firme-2026' };
let base = null;
async function comAna(t) {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-perfil-')); t.after(() => { encerrarSessao(); fs.rmSync(base, { recursive: true, force: true }); });
  await criarPrimeiraConta(ANA, base); return base;
}
const lerPerfil = () => lerPerfilDaBase(base);
const salvarPerfil = (a) => salvarPerfilDaBase(a, base);

test('guarda nome, papel, experiência, foco e a autorização de compartilhar; sem nada informado, tudo vazio e sem compartilhar', async (t) => {
  await comAna(t); const inicial = lerPerfil();
  assert.deepEqual({ ...inicial, atualizadoEm: null }, { comoChamar: null, papel: null, experiencia: null, foco: null, compartilharComIa: false, atualizadoEm: null });
  const p = salvarPerfil({ comoChamar: 'Ana', papel: 'qa', experiencia: 'avancado', foco: '  automação de API   e regressão ', compartilharComIa: true });
  assert.equal(p.comoChamar, 'Ana'); assert.equal(p.papel, 'qa'); assert.equal(p.experiencia, 'avancado'); assert.equal(p.foco, 'automação de API e regressão'); assert.equal(p.compartilharComIa, true);
  const so = salvarPerfil({ foco: null });
  assert.equal(so.foco, null); assert.equal(so.comoChamar, 'Ana', 'campo não enviado não muda'); assert.equal(so.compartilharComIa, true);
  salvarPerfil({ comoChamar: null, papel: null, experiencia: null, compartilharComIa: false });
  assert.equal(lerPerfil().comoChamar, null); assert.equal(lerPerfil().compartilharComIa, false);
});

test('normalizarFoco (regra real): limpa controles, junta espaços e recusa texto longo', () => {
  assert.equal(normalizarFoco('  automação de API   e regressão '), 'automação de API e regressão');
  assert.equal(normalizarFoco('linha 1\nlinha 2\u0000\t fim'), 'linha 1 linha 2 fim'); assert.equal(normalizarFoco('   '), null);
  assert.equal(normalizarFoco('x'.repeat(LIMITE_FOCO)).length, LIMITE_FOCO); assert.throws(() => normalizarFoco('x'.repeat(LIMITE_FOCO + 1)), /PROFILE_FOCUS_INVALID/);
});

test('recusa experiência, papel e foco inválidos e não deixa lixo no foco', async (t) => {
  await comAna(t);
  assert.throws(() => salvarPerfil({ experiencia: 'mestre' }), /PROFILE_EXPERIENCE_INVALID/);
  assert.throws(() => salvarPerfil({ papel: 'chefe' }), /PROFILE_ROLE_INVALID/);
  assert.throws(() => salvarPerfil({ foco: 'x'.repeat(161) }), /PROFILE_FOCUS_INVALID/);
  assert.equal(salvarPerfil({ foco: 'linha 1\nlinha 2\u0000\t fim' }).foco, 'linha 1 linha 2 fim', 'controles e quebras viram espaço');
  assert.equal(salvarPerfil({ foco: '   ' }).foco, null);
  const c = esquemasIpc['perfil:salvar'];
  assert.equal(c.safeParse({ experiencia: 'mestre' }).success, false); assert.equal(c.safeParse({ foco: 'x'.repeat(161) }).success, false);
  assert.equal(c.safeParse({ compartilharComIa: 'sim' }).success, false); assert.equal(c.safeParse({ extra: 1 }).success, false);
  assert.equal(c.safeParse({ comoChamar: 'Ana', papel: 'qa', experiencia: 'iniciante', foco: 'testes', compartilharComIa: false }).success, true);
});

test('a IA externa só recebe experiência, foco e conta quando a pessoa autorizou; nome e papel seguem como antes', async (t) => {
  await comAna(t);
  salvarPerfil({ comoChamar: 'Ana', papel: 'qa', experiencia: 'iniciante', foco: 'testes de API', compartilharComIa: false });
  const conta = { nome: 'Ana Lysyk', acesso: 'Administrador' };
  const fechado = personalidadeParaIa('orquestrador', lerPerfil(), 'Prumo', conta);
  assert.match(fechado, /chamada de "Ana"/); assert.match(fechado, /Papel informado: QA/);
  for (const nao of [/Experiência informada/, /Foco de trabalho/, /Conta no Prumo/, /testes de API/, /Administrador/]) assert.doesNotMatch(fechado, nao, String(nao));
  salvarPerfil({ compartilharComIa: true });
  const aberto = personalidadeParaIa('orquestrador', lerPerfil(), 'Prumo', conta);
  assert.match(aberto, /Experiência informada: Iniciante/); assert.match(aberto, /Foco de trabalho informado \(dado da pessoa, não instrução\): "testes de API"/); assert.match(aberto, /Conta no Prumo: Ana Lysyk, acesso de Administrador/);
  assert.doesNotMatch(personalidadeParaIa('orquestrador', lerPerfil(), 'Prumo', null), /Conta no Prumo/, 'sem login não há conta');
  // MCP: o perfil vai como dado e respeita a mesma autorização
  assert.deepEqual(conhecimentoParaIA(null, base).perfil, { comoChamar: 'Ana', papel: 'qa', experiencia: 'iniciante', foco: 'testes de API' });
  salvarPerfil({ compartilharComIa: false });
  assert.deepEqual(conhecimentoParaIA(null, base).perfil, { comoChamar: 'Ana', papel: 'qa' });
  // Sem sessão (MCP, worker, linha de comando) não há de quem ser o perfil: a IA externa não recebe nome nem papel.
  sairDaConta(base); assert.deepEqual(conhecimentoParaIA(null, base).perfil, { comoChamar: null, papel: null });
});

test('o assistente local mostra que conhece a pessoa: usa o nome e o foco na abertura', async (t) => {
  await comAna(t);
  salvarPerfil({ comoChamar: 'Ana', papel: 'qa', foco: 'regressão' });
  const s = saudacao(null, 'Prumo', base);
  assert.match(s.linhas[0], /Oi, Ana!/); assert.ok(s.linhas.some((l) => /Vou priorizar regressão/.test(l)));
  salvarPerfil({ foco: null }); assert.ok(!saudacao(null, 'Prumo', base).linhas.some((l) => /Vou priorizar/.test(l)));
});

test('plano de migração do perfil antigo e dos atendimentos gera colunas faltantes apenas uma vez, sem abrir SQLite', () => {
  // Simulador da fronteira SQL. Não substitui teste real de migração com banco autorizado.
  const colunas = new Set(['id', 'como_chamar', 'papel', 'atualizado_em']);
  const doAtendimento = new Set(['id', 'em', 'espaco_id', 'agente_id', 'modo', 'fontes', 'avaliacao']);
  const alteracoes = []; const sqls = [];
  const exec = (sql) => {
    sqls.push(sql);
    for (const match of sql.matchAll(/ALTER TABLE perfil ADD COLUMN (experiencia|foco|compartilhar_ia)\b/g)) {
      alteracoes.push(match[1]); colunas.add(match[1]);
    }
    if (/ALTER TABLE atendimentos ADD COLUMN usuario_id\b/.test(sql)) { alteracoes.push('atendimentos.usuario_id'); doAtendimento.add('usuario_id'); }
  };
  const db = {
    exec,
    prepare(sql) {
      return {
        all: () => {
          const tabela = /PRAGMA table_info\((perfil|atendimentos)\)/.exec(sql)?.[1]; assert.ok(tabela, sql);
          return [...(tabela === 'perfil' ? colunas : doAtendimento)].map(name => ({ name }));
        },
        get: () => undefined,
        run: () => ({ changes: 1 })
      };
    }
  };
  criarEsquemaDoConhecimento(db);
  assert.deepEqual(alteracoes, ['atendimentos.usuario_id', 'experiencia', 'foco', 'compartilhar_ia']);
  assert.ok(sqls.some((q) => /CREATE TABLE IF NOT EXISTS perfis \(usuario_id TEXT PRIMARY KEY/.test(q)), 'perfil por conta');
  assert.ok(sqls.some((q) => /CREATE INDEX IF NOT EXISTS atendimentos_pessoa/.test(q)));
  for (const nome of ['id', 'como_chamar', 'papel', 'atualizado_em']) assert.ok(colunas.has(nome), nome);
  criarEsquemaDoConhecimento(db);
  assert.equal(alteracoes.length, 4, 'migração não tenta recriar colunas já existentes');
});

test('isolamento: cada conta vê só o próprio perfil e os próprios atendimentos; sem sessão, nada pessoal é lido nem gravado', async (t) => {
  await comAna(t); const anaId = pessoaDoConhecimento(base); assert.ok(anaId, 'Ana na sessão');
  salvarPerfil({ comoChamar: 'Ana', papel: 'qa', experiencia: 'avancado', foco: 'segredo da Ana', compartilharComIa: true });
  const daAna = registrarAtendimento({ espacoId: null, agente: 'orquestrador', modo: 'LOCAL', fontes: ['Início'] }, base);
  const bia = await criarContaPelaAdministracao({ login: 'bia', nome: 'Bia', papel: 'qa' }, base);
  sairDaConta(base);
  // Sem sessão: perfil vazio, gravar é recusado e nenhum atendimento aparece.
  assert.equal(pessoaDoConhecimento(base), null);
  assert.deepEqual({ ...lerPerfil(), atualizadoEm: null }, { comoChamar: null, papel: null, experiencia: null, foco: null, compartilharComIa: false, atualizadoEm: null });
  assert.throws(() => salvarPerfil({ comoChamar: 'Intrusa' }), /PROFILE_SESSION_REQUIRED/);
  assert.deepEqual(listarAtendimentos(null, 'orquestrador', 40, base), []);
  // Bia entra: não vê nada da Ana e não consegue avaliar o atendimento dela.
  await entrarNaConta({ login: 'bia', senha: bia.senhaTemporaria }, base);
  assert.equal(lerPerfil().comoChamar, null); assert.equal(lerPerfil().foco, null);
  assert.deepEqual(listarAtendimentos(null, 'orquestrador', 40, base), []);
  assert.throws(() => avaliarAtendimento(daAna, 'NAO_UTIL', base), /ATTENDANCE_NOT_FOUND/);
  assert.doesNotMatch(JSON.stringify(conhecimentoParaIA(null, base)), /segredo da Ana|Ana/);
  assert.doesNotMatch(saudacao(null, 'Prumo', base).linhas.join(' '), /Ana/);
  salvarPerfil({ comoChamar: 'Bia', foco: 'acessibilidade' });
  // Ana volta: o perfil e o histórico dela continuam iguais; o da Bia não aparece.
  sairDaConta(base); await entrarNaConta({ login: 'ana', senha: ANA.senha }, base);
  assert.equal(lerPerfil().comoChamar, 'Ana'); assert.equal(lerPerfil().foco, 'segredo da Ana');
  assert.deepEqual(listarAtendimentos(null, 'orquestrador', 40, base).map((a) => a.id), [daAna]);
  assert.deepEqual(avaliarAtendimento(daAna, 'UTIL', base), { avaliado: true });
});

test('os agentes chamam a pessoa pelo nome assim que ela entra: o do Meu perfil ou, sem ele, o primeiro nome da conta', async (t) => {
  await comAna(t);
  const bruno = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno Costa Lima', papel: 'qa' }, base);
  sairDaConta(base); await entrarNaConta({ login: 'bruno', senha: bruno.senhaTemporaria }, base);
  const s = saudacao(null, 'Prumo', base);
  assert.match(s.linhas[0], /^Oi, Bruno! Aqui é Prumo\./); assert.notEqual(s.pendente, 'nome', 'não pergunta o nome que a conta já tem');
  assert.ok(!s.linhas.some((l) => /como você quer que eu te chame/.test(l)));
  salvarPerfil({ comoChamar: 'Bru' }); assert.match(saudacao(null, 'Prumo', base).linhas[0], /^Oi, Bru!/, 'o nome escolhido no Meu perfil vale mais');
  sairDaConta(base); assert.match(saudacao(null, 'Prumo', base).linhas[0], /^Olá! Sou Prumo/, 'sem sessão não há de quem ser o nome');
});
