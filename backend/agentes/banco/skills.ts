/** Persistência dos trechos de Skills: registrar, consultar e aprovar ou descartar alterações. */
import { comBancoDeSkills, linhaParaTrecho } from "./comBancoDeSkills.js";
import { EstadoTrecho, TrechoDeSkill, estadosTrecho, limitesSkills, NovoTrecho } from "../tipos/skills.js";
import { falharCom } from "../../compartilhado/erros.js";
import { validarEspecializacao } from "../regras/regrasDasSkills.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";

export function decidirTrechoDeSkill(id: string, estado: Exclude<EstadoTrecho, 'RASCUNHO'>, base?: string, agora = new Date()): TrechoDeSkill {
  if (!['APROVADO', 'DESCARTADO'].includes(estado)) falharCom('SKILL_STATE_INVALID');
  return comBancoDeSkills(base, (db) => {
    const r = db.prepare('UPDATE trechos SET estado = ?, decidido_em = ? WHERE id = ?').run(estado, agora.toISOString(), id);
    if (!r.changes) falharCom('SKILL_NOT_FOUND');
    return linhaParaTrecho(db.prepare('SELECT * FROM trechos WHERE id = ?').get(id) as Record<string, unknown>);
  });
}

export function listarTrechosDeSkill(f: { especializacao?: string | null; estados?: EstadoTrecho[]; busca?: string }, base?: string): TrechoDeSkill[] {
  const esp = f.especializacao ? validarEspecializacao(f.especializacao) : null;
  const estados = (f.estados?.length ? f.estados : [...estadosTrecho]).filter((e) => estadosTrecho.includes(e));
  return comBancoDeSkills(base, (db) => {
    const cond = [`estado IN (${estados.map(() => '?').join(',')})`]; const params: string[] = [...estados];
    if (esp) { cond.push('especializacao = ?'); params.push(esp); }
    const linhas = db.prepare(`SELECT * FROM trechos WHERE ${cond.join(' AND ')}
      ORDER BY CASE estado WHEN 'RASCUNHO' THEN 0 WHEN 'APROVADO' THEN 1 ELSE 2 END, especializacao,
        CASE origem WHEN 'PRUMO' THEN 0 WHEN 'PESSOA' THEN 1 WHEN 'IMPORTADO' THEN 2 ELSE 3 END, fonte, ordem`).all(...params) as Record<string, unknown>[];
    const b = f.busca ? semAcentos(f.busca) : '';
    return linhas.map(linhaParaTrecho).filter((t) => !b || semAcentos(t.titulo + ' ' + t.texto).includes(b)).slice(0, limitesSkills.porConsulta);
  });
}

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
