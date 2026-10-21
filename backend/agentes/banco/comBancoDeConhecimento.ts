/** comBancoDeConhecimento: operações reunidas por responsabilidade. */
import { createHash } from "node:crypto";
import { Conhecimento, EstadoConhecimento, Linha, OrigemConhecimento, TipoConhecimento, idsAgentes, uuid, SEMENTE, VERSAO_ESQUEMA } from "../tipos/conhecimento.js";
import path from "node:path";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { contaDaSessao } from "../../login/regras/sessao.js";
import { DatabaseSync } from "node:sqlite";
import { agentesChat, personalidades } from "../tipos/persona.js";
import fs from "node:fs";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";

// Operações de formatosDoConhecimento
export function impressaoDoConhecimento(agente: string | null, espacoId: string | null, tipo: string, titulo: string, texto: string) { return createHash('sha256').update([agente ?? '*', espacoId ?? '*', tipo, titulo.trim().toLowerCase(), texto.trim().toLowerCase()].join('\0')).digest('hex'); }

export const linhaParaConhecimento = (r: Linha): Conhecimento => ({ id: String(r.id), agente: (r.agente_id as string | null) ?? null, espacoId: (r.espaco_id as string | null) ?? null, tipo: r.tipo as TipoConhecimento, titulo: String(r.titulo), texto: String(r.texto),
  origem: r.origem as OrigemConhecimento, estado: r.estado as EstadoConhecimento, criadoEm: String(r.criado_em), decididoEm: (r.decidido_em as string | null) ?? null, cliente: (r.cliente as string | null) ?? null });

/** Nome da vista do banco que mostra os conhecimentos de um agente (agente_<id>). */

export const vistaDoAgente = (id: string) => 'agente_' + id.replace(/-/g, '_');

// Operações de comBancoDeConhecimento
// Operações de comBancoDeConhecimento
// ── baseDoConhecimento ──
/** Banco de conhecimento compartilhado, fora das pastas dos projetos. */
export const caminhoConhecimento = (base?: string) =>
  path.join(diretorioDados(base), 'conhecimento.db');

/** Sem sessão válida, dados pessoais não são consultados ou gravados. */
export function pessoaDoConhecimento(base?: string): string | null {
  try {
    return contaDaSessao(base)?.id ?? null;
  } catch {
    return null;
  }
}

/** Mantém o código de erro do conhecimento disponível à camada que chamou. */
export function falharConhecimento(codigo: string): never {
  throw Object.assign(new Error(codigo), { codigo });
}

export function validarAgenteDoConhecimento(agente: string | null | undefined) {
  if (agente != null && !idsAgentes.has(agente)) {
    falharConhecimento('KNOWLEDGE_AGENT_UNKNOWN');
  }
  return agente ?? null;
}

export function validarProjetoDoConhecimento(projeto: string | null | undefined) {
  if (projeto != null && !uuid.test(projeto)) {
    falharConhecimento('KNOWLEDGE_SCOPE_INVALID');
  }
  return projeto ?? null;
}

// ── criarEsquemaDoConhecimento ──
export function criarEsquemaDoConhecimento(db: DatabaseSync) {
  db.exec(`PRAGMA busy_timeout = 4000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = DELETE;
    CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS perfil (id INTEGER PRIMARY KEY CHECK (id = 1), como_chamar TEXT, papel TEXT CHECK (papel IN ('qa','dev','po','analista','outro')), atualizado_em TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS agentes (id TEXT PRIMARY KEY, nome TEXT NOT NULL, dominio TEXT NOT NULL, skill TEXT, tom TEXT NOT NULL, foco TEXT NOT NULL, lema TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS conhecimentos (id TEXT PRIMARY KEY, agente_id TEXT REFERENCES agentes(id), espaco_id TEXT,
      tipo TEXT NOT NULL CHECK (tipo IN ('fato','glossario','preferencia','procedimento','risco')), titulo TEXT NOT NULL, texto TEXT NOT NULL,
      origem TEXT NOT NULL CHECK (origem IN ('PRUMO','PESSOA','CONVERSA','IA')), estado TEXT NOT NULL CHECK (estado IN ('RASCUNHO','APROVADO','DESCARTADO')),
      criado_em TEXT NOT NULL, decidido_em TEXT, cliente TEXT, hash TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS conhecimentos_escopo ON conhecimentos (espaco_id, agente_id, estado);
    CREATE TABLE IF NOT EXISTS vocabulario (termo TEXT NOT NULL, agente_id TEXT NOT NULL REFERENCES agentes(id), peso INTEGER NOT NULL, ultima_em TEXT NOT NULL, PRIMARY KEY (termo, agente_id));
    CREATE TABLE IF NOT EXISTS atendimentos (id INTEGER PRIMARY KEY AUTOINCREMENT, em TEXT NOT NULL, espaco_id TEXT, agente_id TEXT NOT NULL REFERENCES agentes(id),
      modo TEXT NOT NULL CHECK (modo IN ('LOCAL','CLAUDE','CODEX','COPILOT','GEMINI','MESA')), fontes TEXT NOT NULL, avaliacao TEXT CHECK (avaliacao IN ('UTIL','NAO_UTIL')), usuario_id TEXT);
    CREATE INDEX IF NOT EXISTS atendimentos_escopo ON atendimentos (espaco_id, agente_id, em);
    CREATE TABLE IF NOT EXISTS perfis (usuario_id TEXT PRIMARY KEY, como_chamar TEXT, papel TEXT CHECK (papel IN ('qa','dev','po','analista','outro')),
      experiencia TEXT CHECK (experiencia IN ('iniciante','intermediario','avancado')), foco TEXT, compartilhar_ia INTEGER NOT NULL DEFAULT 0, atualizado_em TEXT NOT NULL);`);
  // 2.17: perfil e atendimentos passam a ser de cada conta. A linha antiga de perfil (id = 1) e os atendimentos sem dono ficam guardados, mas ninguém os vê.
  const doAtendimento = (db.prepare('PRAGMA table_info(atendimentos)').all() as { name: string }[]).map((c) => c.name);
  if (!doAtendimento.includes('usuario_id')) db.exec('ALTER TABLE atendimentos ADD COLUMN usuario_id TEXT');
  // 2.20 (Copilot e Gemini) e a mesa de IAs (MESA): bancos antigos refazem a tabela para aceitar os novos modos, sem perder atendimentos.
  const sqlAtendimentos = (db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'atendimentos'`).get() as { sql?: string } | undefined)?.sql ?? '';
  if (!sqlAtendimentos.includes("'MESA'")) {
    try {
      db.exec(`BEGIN; ALTER TABLE atendimentos RENAME TO atendimentos_antiga;
        CREATE TABLE atendimentos (id INTEGER PRIMARY KEY AUTOINCREMENT, em TEXT NOT NULL, espaco_id TEXT, agente_id TEXT NOT NULL REFERENCES agentes(id),
          modo TEXT NOT NULL CHECK (modo IN ('LOCAL','CLAUDE','CODEX','COPILOT','GEMINI','MESA')), fontes TEXT NOT NULL, avaliacao TEXT CHECK (avaliacao IN ('UTIL','NAO_UTIL')), usuario_id TEXT);
        INSERT INTO atendimentos (id, em, espaco_id, agente_id, modo, fontes, avaliacao, usuario_id) SELECT id, em, espaco_id, agente_id, modo, fontes, avaliacao, usuario_id FROM atendimentos_antiga;
        DROP TABLE atendimentos_antiga;
        CREATE INDEX IF NOT EXISTS atendimentos_escopo ON atendimentos (espaco_id, agente_id, em); COMMIT;`);
    } catch (erro) { try { db.exec('ROLLBACK'); } catch { /* sem transação aberta */ } throw erro; }
  }
  db.exec('CREATE INDEX IF NOT EXISTS atendimentos_pessoa ON atendimentos (usuario_id, espaco_id, agente_id, em)');
  // 2.13: o perfil ganhou experiência, foco e a autorização de compartilhar com a IA externa (bancos antigos recebem as colunas).
  const colunas = (db.prepare('PRAGMA table_info(perfil)').all() as { name: string }[]).map((c) => c.name);
  if (!colunas.includes('experiencia')) db.exec(`ALTER TABLE perfil ADD COLUMN experiencia TEXT CHECK (experiencia IN ('iniciante','intermediario','avancado'))`);
  if (!colunas.includes('foco')) db.exec('ALTER TABLE perfil ADD COLUMN foco TEXT');
  if (!colunas.includes('compartilhar_ia')) db.exec('ALTER TABLE perfil ADD COLUMN compartilhar_ia INTEGER NOT NULL DEFAULT 0');
  const versao = (db.prepare(`SELECT valor FROM meta WHERE chave = 'esquema'`).get() as { valor?: string } | undefined)?.valor;
  if (versao && Number(versao) > VERSAO_ESQUEMA) falharConhecimento('KNOWLEDGE_SCHEMA_NEWER');
  db.exec('BEGIN');
  try {
    db.prepare(`INSERT OR REPLACE INTO meta (chave, valor) VALUES ('esquema', ?)`).run(String(VERSAO_ESQUEMA));
    const up = db.prepare(`INSERT INTO agentes (id, nome, dominio, skill, tom, foco, lema) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, dominio = excluded.dominio, skill = excluded.skill, tom = excluded.tom, foco = excluded.foco, lema = excluded.lema`);
    for (const a of agentesChat) { const p = personalidades[a.id]!; up.run(a.id, a.nome, a.dominio, a.especializacao ? 'skills/' + (a.especializacao === 'qa-geral' ? 'qa' : a.especializacao) : null, p.tom, p.foco, p.assinatura); }
    const agora = new Date().toISOString(); const ins = db.prepare(`INSERT OR IGNORE INTO conhecimentos (id, agente_id, espaco_id, tipo, titulo, texto, origem, estado, criado_em, decidido_em, cliente, hash) VALUES (?, ?, NULL, ?, ?, ?, 'PRUMO', 'APROVADO', ?, ?, NULL, ?)`);
    for (const s of SEMENTE) ins.run(s.id, s.agente, s.tipo, s.titulo, s.texto, agora, agora, impressaoDoConhecimento(s.agente, null, s.tipo, s.titulo, s.texto));
    for (const a of agentesChat) db.exec(`CREATE VIEW IF NOT EXISTS ${vistaDoAgente(a.id)} AS SELECT id, tipo, titulo, texto, origem, estado, espaco_id, criado_em, decidido_em FROM conhecimentos WHERE agente_id = '${a.id}' OR agente_id IS NULL`);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

// ── comBancoDeConhecimento ──
export function comBancoDeConhecimento<T>(base: string | undefined, fn: (db: DatabaseSync) => T): T {
  const db = abrirBancoProtegido(caminhoConhecimento(base), () => falharConhecimento('KNOWLEDGE_FILE_INVALID'), criarEsquemaDoConhecimento);
  try { return fn(db); } finally { db.close(); }
}

// Operações de abrirBancoProtegido
/** `preparar` cria as tabelas; se falhar, o banco é fechado antes do erro subir. */
export function abrirBancoProtegido(alvo: string, falhar: () => never, preparar: (db: DatabaseSync) => void): DatabaseSync {
  fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 }); semLinks(alvo);
  if (fs.existsSync(alvo)) { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) falhar(); }
  const db = new DatabaseSync(alvo); try { preparar(db); } catch (e) { db.close(); throw e; }
  try { fs.chmodSync(alvo, 0o600); } catch { /* ACL herdada no Windows */ }
  return db;
}
