/** Perfil da pessoa: o que é guardado, validado e o que cada IA recebe. Banco de conhecimento em memória; nada sai do computador. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { lerPerfil } from '../../../../dist/agentes/banco/lerPerfil.js';
import { salvarPerfil } from '../../../../dist/agentes/banco/salvarPerfil.js';
import { LIMITE_FOCO, normalizarFoco } from '../../../../dist/agentes/regras/normalizarFoco.js';
import { criarEsquemaDoConhecimento } from '../../../../dist/agentes/banco/criarEsquemaDoConhecimento.js';
import { personalidadeParaIa } from '../../../../dist/agentes/chat/personalidadeParaIa.js';
import { conhecimentoParaIA } from '../../../../dist/agentes/regras/conhecimentoParaIA.js';
import { saudacao } from '../../../../dist/agentes/chat/saudacao.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

test('guarda nome, papel, experiência, foco e a autorização de compartilhar; sem nada informado, tudo vazio e sem compartilhar', () => {
  const base = lerPerfil();
  assert.deepEqual({ ...base, atualizadoEm: null }, { comoChamar: null, papel: null, experiencia: null, foco: null, compartilharComIa: false, atualizadoEm: null });
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

test('recusa experiência, papel e foco inválidos e não deixa lixo no foco', () => {
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

test('a IA externa só recebe experiência, foco e conta quando a pessoa autorizou; nome e papel seguem como antes', () => {
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
  assert.deepEqual(conhecimentoParaIA(null).perfil, { comoChamar: 'Ana', papel: 'qa', experiencia: 'iniciante', foco: 'testes de API' });
  salvarPerfil({ compartilharComIa: false });
  assert.deepEqual(conhecimentoParaIA(null).perfil, { comoChamar: 'Ana', papel: 'qa' });
});

test('o assistente local mostra que conhece a pessoa: usa o nome e o foco na abertura', () => {
  salvarPerfil({ comoChamar: 'Ana', papel: 'qa', foco: 'regressão' });
  const s = saudacao(null);
  assert.match(s.linhas[0], /Oi, Ana!/); assert.ok(s.linhas.some((l) => /Vou priorizar regressão/.test(l)));
  salvarPerfil({ foco: null }); assert.ok(!saudacao(null).linhas.some((l) => /Vou priorizar/.test(l)));
});

test('plano de migração do perfil antigo gera colunas faltantes apenas uma vez, sem abrir SQLite', () => {
  // Simulador da fronteira SQL. Não substitui teste real de migração com banco autorizado.
  const colunas = new Set(['id', 'como_chamar', 'papel', 'atualizado_em']);
  const alteracoes = [];
  const exec = (sql) => {
    for (const match of sql.matchAll(/ALTER TABLE perfil ADD COLUMN (experiencia|foco|compartilhar_ia)\b/g)) {
      alteracoes.push(match[1]); colunas.add(match[1]);
    }
  };
  const db = {
    exec,
    prepare(sql) {
      return {
        all: () => {
          assert.match(sql, /PRAGMA table_info\(perfil\)/);
          return [...colunas].map(name => ({ name }));
        },
        get: () => undefined,
        run: () => ({ changes: 1 })
      };
    }
  };
  criarEsquemaDoConhecimento(db);
  assert.deepEqual(alteracoes, ['experiencia', 'foco', 'compartilhar_ia']);
  for (const nome of ['id', 'como_chamar', 'papel', 'atualizado_em']) assert.ok(colunas.has(nome), nome);
  criarEsquemaDoConhecimento(db);
  assert.equal(alteracoes.length, 3, 'migração não tenta recriar colunas já existentes');
});
