/** Registra um conhecimento: da pessoa já aprovado; da IA ou da conversa em rascunho (com limite por hora). */
import { randomUUID } from 'node:crypto';
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './validacoesDoConhecimento.js';
import { impressaoDoConhecimento } from './impressaoDoConhecimento.js';
import { linhaParaConhecimento } from './linhaParaConhecimento.js';
import { validarAgenteDoConhecimento } from './validacoesDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validacoesDoConhecimento.js';
import { Conhecimento, EstadoConhecimento, Linha, NovoConhecimento, limitesConhecimento, tiposConhecimento } from '../tipos/conhecimento.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

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
