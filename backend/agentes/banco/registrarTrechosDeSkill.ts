/** Acrescenta trechos a uma Skill: da equipe já aprovados; importados ou de IA em rascunho. Iguais não duplicam; vários numa única transação (se um falhar, nenhum é gravado). */
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { comBancoDeSkills, linhaParaTrecho } from './comBancoDeSkills.js';
import { NovoTrecho, TrechoDeSkill, limitesSkills } from '../tipos/skills.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

export function registrarTrechosDeSkill(novos: NovoTrecho[], base?: string, agora = new Date()): { item: TrechoDeSkill; duplicado: boolean }[] {
  const prontos = novos.map(preparar);
  return comBancoDeSkills(base, (db) => {
    db.exec('BEGIN');
    try { const r = prontos.map((p) => gravar(db, p, agora)); db.exec('COMMIT'); return r; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  });
}

/** Valida e limpa o texto (segredos mascarados, espaços normalizados) antes de abrir o banco. */
function preparar(n: NovoTrecho) {
  const especializacao = validarEspecializacao(n.especializacao);
  if (!['PESSOA', 'IMPORTADO', 'IA'].includes(n.origem)) falharCom('SKILL_ORIGIN_INVALID');
  const titulo = mascarar(String(n.titulo ?? '')).replace(/\s+/g, ' ').trim().slice(0, limitesSkills.titulo);
  const texto = mascarar(String(n.texto ?? '')).trim().slice(0, limitesSkills.texto);
  if (titulo.length < 2 || texto.length < 2) falharCom('SKILL_TEXT_REQUIRED');
  if (n.origem === 'IMPORTADO' && (!n.fonte || !n.licenca)) falharCom('SKILL_LICENSE_MISSING');
  return { ...n, especializacao, titulo, texto, fonte: n.fonte ? String(n.fonte).slice(0, 300) : null, licenca: n.licenca ? String(n.licenca).slice(0, 40) : null, hash: hash(`${especializacao}\n${titulo}\n${texto}`) };
}

function gravar(db: DatabaseSync, p: ReturnType<typeof preparar>, agora: Date) {
  const igual = db.prepare(`SELECT * FROM trechos WHERE hash = ? AND estado != 'DESCARTADO'`).get(p.hash) as Record<string, unknown> | undefined;
  if (igual) return { item: linhaParaTrecho(igual), duplicado: true };
  if (Number((db.prepare('SELECT COUNT(*) AS n FROM trechos').get() as { n: number }).n) >= limitesSkills.trechos) falharCom('SKILLS_LIMIT');
  if (p.origem === 'IA') {
    const desde = new Date(agora.getTime() - 3600_000).toISOString();
    if (Number((db.prepare(`SELECT COUNT(*) AS n FROM trechos WHERE origem = 'IA' AND criado_em >= ?`).get(desde) as { n: number }).n) >= limitesSkills.iaPorHora) falharCom('SKILLS_RATE_LIMIT');
  }
  const ordem = p.ordem ?? 1000 + Number((db.prepare('SELECT COUNT(*) AS n FROM trechos WHERE especializacao = ?').get(p.especializacao) as { n: number }).n);
  const id = randomUUID(); const em = agora.toISOString(); const estado = p.origem === 'PESSOA' ? 'APROVADO' : 'RASCUNHO';
  db.prepare('INSERT INTO trechos (id, especializacao, titulo, texto, ordem, origem, estado, fonte, licenca, criado_em, decidido_em, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, p.especializacao, p.titulo, p.texto, ordem, p.origem, estado, p.fonte, p.licenca, em, estado === 'APROVADO' ? em : null, p.hash);
  return { item: linhaParaTrecho(db.prepare('SELECT * FROM trechos WHERE id = ?').get(id) as Record<string, unknown>), duplicado: false };
}
