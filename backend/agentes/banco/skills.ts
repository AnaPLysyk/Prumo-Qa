/** Persistência e importação de Skills — arquivos relacionados agrupados para manutenção. */
import path from "node:path";
import { falharCom } from "../../compartilhado/erros.js";
import { limitesSkills, TrechoDeSkill, VERSAO_ESQUEMA_SKILLS, EstadoTrecho, estadosTrecho, NovoTrecho } from "../tipos/conhecimento.js";
import { validarEspecializacao } from "../regras/regrasDasSkills.js";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { DatabaseSync } from "node:sqlite";
import { abrirBancoProtegido } from "./comBancoDeConhecimento.js";
import { sementeDasSkills } from "./lerPastaDeSkill.js";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { randomUUID } from "node:crypto";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";


// ── comBancoDeSkills ──
/** Onde fica o banco: skills.db na pasta de dados do Prumo, separada por conta. */
const caminhoSkills = (base?: string) => path.join(diretorioDados(base), 'skills.db');

export function comBancoDeSkills<T>(base: string | undefined, fn: (db: DatabaseSync) => T): T {
  const db = abrirBancoProtegido(caminhoSkills(base), () => falharCom('SKILLS_FILE_INVALID'), (d) => { criarEsquema(d); sincronizarSemente(d); });
  try { return fn(db); } finally { db.close(); }
}

/** Converte uma linha do banco no formato usado pelo resto do Prumo. */
export function linhaParaTrecho(l: Record<string, unknown>): TrechoDeSkill {
  return { id: String(l.id), especializacao: String(l.especializacao), titulo: String(l.titulo), texto: String(l.texto), ordem: Number(l.ordem),
    origem: l.origem as TrechoDeSkill['origem'], estado: l.estado as TrechoDeSkill['estado'], fonte: (l.fonte as string | null) ?? null, licenca: (l.licenca as string | null) ?? null,
    criadoEm: String(l.criado_em), decididoEm: (l.decidido_em as string | null) ?? null };
}

/** Tabelas: meta (versão e impressão da semente) e trechos (um por parágrafo ou seção de Skill). */
function criarEsquema(db: DatabaseSync) {
  db.exec(`PRAGMA busy_timeout = 4000; PRAGMA journal_mode = DELETE;
    CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS trechos (id TEXT PRIMARY KEY, especializacao TEXT NOT NULL, titulo TEXT NOT NULL, texto TEXT NOT NULL, ordem INTEGER NOT NULL,
      origem TEXT NOT NULL CHECK (origem IN ('PRUMO','PESSOA','IMPORTADO','IA')), estado TEXT NOT NULL CHECK (estado IN ('RASCUNHO','APROVADO','DESCARTADO')),
      fonte TEXT, licenca TEXT, criado_em TEXT NOT NULL, decidido_em TEXT, hash TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS trechos_escopo ON trechos (especializacao, estado);
    CREATE INDEX IF NOT EXISTS trechos_hash ON trechos (hash);`);
  const versao = (db.prepare(`SELECT valor FROM meta WHERE chave = 'esquema'`).get() as { valor?: string } | undefined)?.valor;
  if (versao && Number(versao) > VERSAO_ESQUEMA_SKILLS) falharCom('SKILLS_SCHEMA_NEWER');
  db.prepare(`INSERT OR REPLACE INTO meta (chave, valor) VALUES ('esquema', ?)`).run(String(VERSAO_ESQUEMA_SKILLS));
}

/**
 * Deixa os trechos PRUMO iguais aos arquivos desta versão: acrescenta os novos e remove os que saíram dos arquivos.
 * Um trecho que a pessoa descartou continua descartado enquanto o texto não mudar (o id vem do conteúdo).
 * Trechos da equipe, importados ou de IA nunca são tocados aqui.
 */
function sincronizarSemente(db: DatabaseSync) {
  const semente = sementeDasSkills(); const impressao = hash(semente.map((t) => t.id).join('\n'));
  const atual = (db.prepare(`SELECT valor FROM meta WHERE chave = 'semente'`).get() as { valor?: string } | undefined)?.valor;
  if (atual === impressao) return;
  db.exec('BEGIN');
  try {
    const ids = new Set(semente.map((t) => t.id));
    for (const l of db.prepare(`SELECT id FROM trechos WHERE origem = 'PRUMO'`).all() as { id: string }[]) if (!ids.has(l.id)) db.prepare('DELETE FROM trechos WHERE id = ?').run(l.id);
    const ins = db.prepare(`INSERT OR IGNORE INTO trechos (id, especializacao, titulo, texto, ordem, origem, estado, fonte, licenca, criado_em, decidido_em, hash) VALUES (?, ?, ?, ?, ?, 'PRUMO', 'APROVADO', ?, NULL, ?, ?, ?)`);
    const agora = new Date().toISOString();
    for (const t of semente) ins.run(t.id, t.especializacao, t.titulo, t.texto, t.ordem, t.fonte, agora, agora, hash(`${t.especializacao}\n${t.titulo}\n${t.texto}`));
    db.prepare(`INSERT OR REPLACE INTO meta (chave, valor) VALUES ('semente', ?)`).run(impressao);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

// ── skills ──
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
