// Banco de Skills: divisão em trechos, escolha para o prompt, licença na importação e limite de tamanho.
// O banco SQLite é trocado pela versão em memória (conhecimento-hook.cjs); nenhum teste abre skills.db.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dividirSkillEmTrechos } from '../../../../dist/agentes/regras/dividirSkillEmTrechos.js';
import { escolherTrechosDaSkill } from '../../../../dist/agentes/regras/escolherTrechosDaSkill.js';
import { licencaAberta } from '../../../../dist/agentes/regras/licencaAberta.js';
import { lerPastaDeSkill } from '../../../../dist/agentes/banco/lerPastaDeSkill.js';
import { sementeDasSkills } from '../../../../dist/agentes/banco/sementeDasSkills.js';
import { importarPastaDeSkill } from '../../../../dist/agentes/banco/importarPastaDeSkill.js';
import { registrarTrechosDeSkill } from '../../../../dist/agentes/banco/registrarTrechosDeSkill.js';
import { listarTrechosDeSkill } from '../../../../dist/agentes/banco/listarTrechosDeSkill.js';
import { decidirTrechoDeSkill } from '../../../../dist/agentes/banco/decidirTrechoDeSkill.js';
import { skillDoAgente } from '../../../../dist/agentes/chat/skillDoAgente.js';
import { montarPrompt } from '../../../../dist/agentes/chat/montarPrompt.js';
import { agentesChat } from '../../../../dist/agentes/tipos/persona.js';
import { especializacoes } from '../../../../dist/agentes/tipos/politicas.js';

const pastaTemporaria = (t) => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-skill-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };
const trecho = (x) => ({ id: x.id, especializacao: 'api-rest', titulo: x.titulo ?? 'Seção', texto: x.texto, ordem: x.ordem ?? 5, origem: x.origem ?? 'PRUMO', estado: x.estado ?? 'APROVADO', fonte: x.fonte ?? 'backend/agentes/skills/api-rest/SKILL.md', licenca: null, criadoEm: '', decididoEm: null });

test('dividir: descrição do cabeçalho vira o primeiro trecho, seções viram títulos e bloco de código não é cortado', () => {
  const md = '---\r\nname: x\r\ndescription: Revisar contratos de API.\r\n---\r\n# Contratos\r\n\r\nPrimeiro parágrafo.\r\n\r\n## Exemplo\r\n\r\n```js\r\nconst a = 1;\r\n\r\nconst b = 2;\r\n```\r\n';
  const partes = dividirSkillEmTrechos(md);
  assert.deepEqual(partes.map((p) => p.titulo), ['Para que serve', 'Contratos', 'Exemplo']);
  assert.equal(partes[0].texto, 'Revisar contratos de API.');
  assert.match(partes[2].texto, /const a = 1;\n\nconst b = 2;/);
  assert.deepEqual(partes.map((p) => p.ordem), [0, 1, 2]);
});

test('dividir: parágrafo enorme vira vários trechos dentro do limite, sem perder texto', () => {
  const frase = 'Verifique o contrato da resposta. '; const md = '# Grande\n\n' + frase.repeat(400);
  const partes = dividirSkillEmTrechos(md);
  assert.ok(partes.length > 1); assert.ok(partes.every((p) => p.texto.length <= 4000));
  assert.equal(partes.map((p) => p.texto).join(' ').replace(/\s+/g, ' ').trim(), frase.repeat(400).trim());
});

test('escolher: essencial sempre entra, o que combina com a pergunta vem antes, rascunho e descartado nunca entram', () => {
  const lista = [
    trecho({ id: 'a', titulo: 'Para que serve', texto: 'Skill de API.', ordem: 0 }),
    trecho({ id: 'b', titulo: 'Autenticação', texto: 'Teste token expirado e 401.', ordem: 3, fonte: 'backend/agentes/skills/api-rest/references/x.md' }),
    trecho({ id: 'c', titulo: 'Paginação', texto: 'Teste páginas vazias.', ordem: 4, fonte: 'backend/agentes/skills/api-rest/references/x.md' }),
    trecho({ id: 'd', titulo: 'Autenticação extra', texto: 'Token em rascunho.', origem: 'IA', estado: 'RASCUNHO' }),
    trecho({ id: 'e', titulo: 'Autenticação antiga', texto: 'Token descartado.', origem: 'PESSOA', estado: 'DESCARTADO' })
  ];
  const r = escolherTrechosDaSkill(lista, 'como testar autenticação com token', 200);
  assert.deepEqual(r.usados, ['a', 'b']);
  assert.doesNotMatch(r.texto, /rascunho|descartado/);
  assert.ok(Buffer.byteLength(r.texto) <= 200);
});

test('escolher: trecho da equipe e importado aparecem com a origem; o limite de bytes é respeitado', () => {
  const lista = [
    trecho({ id: 'p', titulo: 'Padrão da equipe', texto: 'Contrato sempre com teste de status 4xx.', origem: 'PESSOA', fonte: null }),
    { ...trecho({ id: 'i', titulo: 'Contrato importado', texto: 'Use schema estrito no contrato.', origem: 'IMPORTADO' }), fonte: 'github.com/x/skills/SKILL.md', licenca: 'MIT' }
  ];
  const r = escolherTrechosDaSkill(lista, 'contrato');
  assert.match(r.texto, /Padrão da equipe \(da equipe\)/); assert.match(r.texto, /importado de github\.com\/x\/skills\/SKILL\.md, MIT/);
  assert.equal(escolherTrechosDaSkill(lista, 'contrato', 10).usados.length, 0);
});

test('licença: só licenças abertas reconhecidas; proprietária ou ausente é recusada', () => {
  assert.equal(licencaAberta('MIT', null), 'MIT');
  assert.equal(licencaAberta(null, 'Apache License\nVersion 2.0, January 2004'), 'Apache-2.0');
  assert.equal(licencaAberta(null, 'MIT License\n\nPermission is hereby granted, free of charge'), 'MIT');
  assert.equal(licencaAberta('Proprietary', 'All rights reserved.'), null);
  assert.equal(licencaAberta(null, 'This skill is source-available, not open source.'), null);
  assert.equal(licencaAberta(null, null), null);
});

test('pasta de Skill: sem SKILL.md, binária ou grande demais é recusada; references entram junto', (t) => {
  const p = pastaTemporaria(t);
  assert.throws(() => lerPastaDeSkill(path.join(p, 'nao-existe')), /SKILL_FILE_MISSING/);
  fs.mkdirSync(path.join(p, 'vazia')); assert.throws(() => lerPastaDeSkill(path.join(p, 'vazia')), /SKILL_FILE_MISSING/);
  fs.mkdirSync(path.join(p, 'bin')); fs.writeFileSync(path.join(p, 'bin', 'SKILL.md'), Buffer.from([65, 0, 66])); assert.throws(() => lerPastaDeSkill(path.join(p, 'bin')), /SKILL_FILE_INVALID/);
  fs.mkdirSync(path.join(p, 'grande')); fs.writeFileSync(path.join(p, 'grande', 'SKILL.md'), 'x'.repeat(70000)); assert.throws(() => lerPastaDeSkill(path.join(p, 'grande')), /SKILL_FILE_TOO_LARGE/);
  fs.mkdirSync(path.join(p, 'ok', 'references'), { recursive: true }); fs.writeFileSync(path.join(p, 'ok', 'SKILL.md'), '# A\n\ntexto'); fs.writeFileSync(path.join(p, 'ok', 'references', 'b.md'), '# B\n\nmais'); fs.writeFileSync(path.join(p, 'ok', 'run.sh'), 'rm -rf /');
  assert.deepEqual(lerPastaDeSkill(path.join(p, 'ok')).map((a) => a.relativo), ['SKILL.md', 'references/b.md']);
});

test('importar: pasta com licença MIT vira rascunho com fonte e licença; só vai ao prompt depois de aprovada', (t) => {
  const p = pastaTemporaria(t); const skill = path.join(p, 'repo', 'skills', 'contratos');
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(p, 'repo', 'LICENSE'), 'MIT License\n\nPermission is hereby granted, free of charge, to any person');
  fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: contratos\ndescription: Checklist aberto de idempotência em PUT.\n---\n# Idempotência\n\nRepita o PUT e compare o corpo.\n');
  const r = importarPastaDeSkill(skill, 'api-rest', 'github.com/exemplo/skills');
  assert.equal(r.licenca, 'MIT'); assert.equal(r.estado, 'RASCUNHO'); assert.equal(r.importados, 2);
  const rasc = listarTrechosDeSkill({ especializacao: 'api-rest', estados: ['RASCUNHO'] }).filter((x) => x.fonte?.startsWith('github.com/exemplo/skills'));
  assert.equal(rasc.length, 2); assert.ok(rasc.every((x) => x.origem === 'IMPORTADO' && x.licenca === 'MIT'));
  assert.doesNotMatch(skillDoAgente('api-rest', 'idempotência do PUT').texto, /Repita o PUT/);
  for (const x of rasc) decidirTrechoDeSkill(x.id, 'APROVADO');
  const depois = skillDoAgente('api-rest', 'idempotência do PUT').texto;
  assert.match(depois, /Repita o PUT/); assert.match(depois, /importado de github\.com\/exemplo\/skills\/SKILL\.md, MIT/);
  assert.equal(importarPastaDeSkill(skill, 'api-rest', 'github.com/exemplo/skills').duplicados, 2);
});

test('importar: sem licença aberta, com especialização inexistente ou sem licença registrada, nada é gravado', (t) => {
  const p = pastaTemporaria(t); fs.writeFileSync(path.join(p, 'SKILL.md'), '# Fechada\n\ntexto');
  const antes = listarTrechosDeSkill({}).length;
  assert.throws(() => importarPastaDeSkill(p, 'api-rest', null), /SKILL_LICENSE_NOT_ALLOWED/);
  assert.throws(() => importarPastaDeSkill(p, 'inventada', null), /SKILL_SPECIALIZATION_INVALID/);
  assert.throws(() => registrarTrechosDeSkill([{ especializacao: 'api-rest', titulo: 'Sem licença', texto: 'texto', origem: 'IMPORTADO', fonte: 'x' }]), /SKILL_LICENSE_MISSING/);
  assert.equal(listarTrechosDeSkill({}).length, antes);
});

test('equipe: trecho escrito pela pessoa já vale, com segredo mascarado; descartar tira do prompt', () => {
  const [r] = registrarTrechosDeSkill([{ especializacao: 'regressao', titulo: 'Janela de regressão', texto: 'A regressão noturna roda às 2h; token=abc123secretoXYZ', origem: 'PESSOA' }]);
  assert.equal(r.item.estado, 'APROVADO'); assert.doesNotMatch(r.item.texto, /abc123secretoXYZ/);
  assert.match(skillDoAgente('regressao', 'quando roda a regressão noturna').texto, /regressão noturna roda às 2h/);
  decidirTrechoDeSkill(r.item.id, 'DESCARTADO');
  assert.doesNotMatch(skillDoAgente('regressao', 'quando roda a regressão noturna').texto, /roda às 2h/);
});

test('semente: toda especialização tem trechos do Prumo com id estável e a Skill no prompt cabe no limite', () => {
  const s1 = sementeDasSkills(); const s2 = sementeDasSkills();
  assert.deepEqual(s1.map((t) => t.id), s2.map((t) => t.id));
  for (const e of especializacoes) {
    assert.ok(s1.some((t) => t.especializacao === e.id && t.fonte === `${e.skill}/SKILL.md`), e.id);
    const r = skillDoAgente(e.id, 'estratégia de testes, riscos, contratos, acessibilidade, regressão, falhas, histórico e cobertura');
    assert.equal(r.origem, 'BANCO'); assert.ok(r.texto.length > 0, e.id); assert.ok(Buffer.byteLength(r.texto) <= 8000, e.id);
  }
});

test('prompt: com a Skill em trechos, o texto enviado ao CLI fica bem abaixo do limite de linha de comando do Windows', () => {
  const local = { linhas: ['Fato local.'], fontes: [], fatos: [], generico: false, vazio: false };
  for (const a of agentesChat) {
    const p = montarPrompt(a, 'Como revisar riscos, contratos, acessibilidade e regressão deste projeto?', local, 'objetivo', 'Prumo', { historico: [], conhecimentos: [] });
    assert.match(p, /--- Skill \(trechos aprovados que combinam com a pergunta\) ---/, a.id);
    assert.ok(p.length < 20000, `${a.id}: ${p.length} caracteres`);
  }
});
