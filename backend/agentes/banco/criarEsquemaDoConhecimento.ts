/** Cria as tabelas e vistas do banco de conhecimento e coloca o conhecimento inicial do Prumo. */
import { DatabaseSync } from 'node:sqlite';
import { falharConhecimento } from './falharConhecimento.js';
import { impressaoDoConhecimento } from './impressaoDoConhecimento.js';
import { vistaDoAgente } from './vistaDoAgente.js';
import { SEMENTE, VERSAO_ESQUEMA } from '../tipos/conhecimento.js';
import { agentesChat, personalidades } from '../tipos/persona.js';

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
      modo TEXT NOT NULL CHECK (modo IN ('LOCAL','CLAUDE','CODEX')), fontes TEXT NOT NULL, avaliacao TEXT CHECK (avaliacao IN ('UTIL','NAO_UTIL')));
    CREATE INDEX IF NOT EXISTS atendimentos_escopo ON atendimentos (espaco_id, agente_id, em);`);
  const versao = (db.prepare(`SELECT valor FROM meta WHERE chave = 'esquema'`).get() as { valor?: string } | undefined)?.valor;
  if (versao && Number(versao) > VERSAO_ESQUEMA) falharConhecimento('KNOWLEDGE_SCHEMA_NEWER');
  db.exec('BEGIN');
  try {
    db.prepare(`INSERT OR REPLACE INTO meta (chave, valor) VALUES ('esquema', ?)`).run(String(VERSAO_ESQUEMA));
    const up = db.prepare(`INSERT INTO agentes (id, nome, dominio, skill, tom, foco, lema) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, dominio = excluded.dominio, skill = excluded.skill, tom = excluded.tom, foco = excluded.foco, lema = excluded.lema`);
    for (const a of agentesChat) { const p = personalidades[a.id]!; up.run(a.id, a.nome, a.dominio, a.especializacao ? 'backend/agentes/skills/' + (a.especializacao === 'qa-geral' ? 'qa' : a.especializacao) : null, p.tom, p.foco, p.assinatura); }
    const agora = new Date().toISOString(); const ins = db.prepare(`INSERT OR IGNORE INTO conhecimentos (id, agente_id, espaco_id, tipo, titulo, texto, origem, estado, criado_em, decidido_em, cliente, hash) VALUES (?, ?, NULL, ?, ?, ?, 'PRUMO', 'APROVADO', ?, ?, NULL, ?)`);
    for (const s of SEMENTE) ins.run(s.id, s.agente, s.tipo, s.titulo, s.texto, agora, agora, impressaoDoConhecimento(s.agente, null, s.tipo, s.titulo, s.texto));
    for (const a of agentesChat) db.exec(`CREATE VIEW IF NOT EXISTS ${vistaDoAgente(a.id)} AS SELECT id, tipo, titulo, texto, origem, estado, espaco_id, criado_em, decidido_em FROM conhecimentos WHERE agente_id = '${a.id}' OR agente_id IS NULL`);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
