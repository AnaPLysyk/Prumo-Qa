/** Abre o banco de Skills (skills.db, separado do conhecimento), garante as tabelas e os trechos do Prumo, faz a operação e fecha sempre. */
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { abrirBancoProtegido } from './abrirBancoProtegido.js';
import { sementeDasSkills } from './sementeDasSkills.js';
import { TrechoDeSkill, VERSAO_ESQUEMA_SKILLS } from '../tipos/skills.js';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { falharCom } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';

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
