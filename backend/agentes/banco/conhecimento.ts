/** Persistência do conhecimento dos agentes: registrar, listar, recuperar trechos relevantes e apagar. */
import { comBancoDeConhecimento } from "./comBancoDeConhecimento.js";
import { falharConhecimento, validarAgenteDoConhecimento, validarProjetoDoConhecimento } from "./comBancoDeConhecimento.js";
import { Linha, Conhecimento, Filtro, estadosConhecimento, limitesConhecimento, EstadoConhecimento, NovoConhecimento, tiposConhecimento } from "../tipos/conhecimento.js";
import { raizDaPalavra, termosDaFrase } from "../regras/normalizacaoDoConhecimento.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { linhaParaConhecimento, impressaoDoConhecimento } from "./formatosDoConhecimento.js";
import { randomUUID } from "node:crypto";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";

/** Apagar remove de vez; o conhecimento de origem PRUMO só pode ser descartado (volta se a pessoa reaprovar). */
export function apagarConhecimento(id: string, base?: string) {
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT origem FROM conhecimentos WHERE id = ?').get(id) as Linha | undefined; if (!r) falharConhecimento('KNOWLEDGE_NOT_FOUND'); if (r.origem === 'PRUMO') falharConhecimento('KNOWLEDGE_BUILTIN');
    db.prepare('DELETE FROM conhecimentos WHERE id = ?').run(id); return { apagado: true }; });
}

/** Conhecimentos APROVADOS do agente (ou gerais) mais ligados à pergunta. Pontua título em dobro; exige ao menos 2 pontos. */
export function conhecimentosRelevantes(espacoId: string | null, agente: string | null, pergunta: string, limite = 2, base?: string): Conhecimento[] {
  const ts = termosDaFrase(pergunta).map(raizDaPalavra); if (!ts.length) return [];
  const todos = listarConhecimentos({ espacoId, agente, estados: ['APROVADO'] }, base);
  return todos.map((c) => { const t = semAcentos(c.titulo), x = semAcentos(c.texto); return { c, p: ts.reduce((n, k) => n + (t.includes(k) ? 2 : 0) + (x.includes(k) ? 1 : 0), 0) + (c.agente === agente ? 1 : 0) }; })
    .filter((x) => x.p >= 3).sort((a, b) => b.p - a.p).slice(0, limite).map((x) => x.c);
}

/** Escopo: conhecimentos gerais (sem projeto) e os do projeto informado; nunca os de outro projeto. Sem agente: todos. */
export function listarConhecimentos(f: Filtro, base?: string): Conhecimento[] {
  const espacoId = validarProjetoDoConhecimento(f.espacoId); const agente = validarAgenteDoConhecimento(f.agente); const estados = (f.estados?.length ? f.estados : [...estadosConhecimento]).filter((e) => estadosConhecimento.includes(e));
  const lim = Math.max(1, Math.min(limitesConhecimento.porConsulta, f.limite ?? limitesConhecimento.porConsulta));
  return comBancoDeConhecimento(base, (db) => {
    const cond = ['(espaco_id IS NULL' + (espacoId ? ' OR espaco_id = ?)' : ')'), `estado IN (${estados.map(() => '?').join(',')})`]; const params: (string | number)[] = [...(espacoId ? [espacoId] : []), ...estados];
    if (agente) { cond.push(f.somenteDoAgente ? 'agente_id = ?' : '(agente_id = ? OR agente_id IS NULL)'); params.push(agente); }
    const linhas = db.prepare(`SELECT * FROM conhecimentos WHERE ${cond.join(' AND ')} ORDER BY CASE estado WHEN 'RASCUNHO' THEN 0 WHEN 'APROVADO' THEN 1 ELSE 2 END, criado_em DESC LIMIT ${f.busca ? limitesConhecimento.itens : lim}`).all(...params) as Linha[];
    const b = f.busca ? semAcentos(f.busca) : ''; return linhas.map(linhaParaConhecimento).filter((c) => !b || semAcentos(c.titulo + ' ' + c.texto).includes(b)).slice(0, lim);
  });
}

/** O que a pessoa escreve nasce APROVADO (é a decisão dela); conversa e IA nascem RASCUNHO. Iguais não duplicam. */
export function registrarConhecimento(n: NovoConhecimento, base?: string, agora = new Date()): { item: Conhecimento; duplicado: boolean } {
  const espacoId = validarProjetoDoConhecimento(n.espacoId); const agente = validarAgenteDoConhecimento(n.agente); if (!tiposConhecimento.includes(n.tipo)) falharConhecimento('KNOWLEDGE_TYPE_INVALID');
  if (!['PESSOA', 'CONVERSA', 'IA'].includes(n.origem)) falharConhecimento('KNOWLEDGE_ORIGIN_INVALID');
  const titulo = mascarar(String(n.titulo ?? '')).replace(/\s+/g, ' ').trim().slice(0, limitesConhecimento.titulo); const texto = mascarar(String(n.texto ?? '')).trim().slice(0, limitesConhecimento.texto);
  if (titulo.length < 2 || texto.length < 2) falharConhecimento('KNOWLEDGE_TEXT_REQUIRED');
  const hash = impressaoDoConhecimento(agente, espacoId, n.tipo, titulo, texto);
  return comBancoDeConhecimento(base, (db) => {
    const igual = db.prepare(`SELECT * FROM conhecimentos WHERE hash = ? AND estado != 'DESCARTADO'`).get(hash) as Linha | undefined; if (igual) return { item: linhaParaConhecimento(igual), duplicado: true };
    if (Number((db.prepare('SELECT COUNT(*) AS n FROM conhecimentos').get() as Linha).n) >= limitesConhecimento.itens) falharConhecimento('KNOWLEDGE_LIMIT');
    if (n.origem === 'IA') { const desde = new Date(agora.getTime() - 3600_000).toISOString(); if (Number((db.prepare(`SELECT COUNT(*) AS n FROM conhecimentos WHERE origem = 'IA' AND criado_em >= ?`).get(desde) as Linha).n) >= limitesConhecimento.iaPorHora) falharConhecimento('KNOWLEDGE_RATE_LIMIT'); }
    const id = randomUUID(); const em = agora.toISOString(); const estado: EstadoConhecimento = n.origem === 'PESSOA' ? 'APROVADO' : 'RASCUNHO';
    db.prepare('INSERT INTO conhecimentos (id, agente_id, espaco_id, tipo, titulo, texto, origem, estado, criado_em, decidido_em, cliente, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, agente, espacoId, n.tipo, titulo, texto, n.origem, estado, em, estado === 'APROVADO' ? em : null, n.cliente ? String(n.cliente).slice(0, 80) : null, hash);
    return { item: linhaParaConhecimento(db.prepare('SELECT * FROM conhecimentos WHERE id = ?').get(id) as Linha), duplicado: false };
  });
}
