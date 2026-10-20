/** Reúne formatos do conhecimento da funcionalidade, mantendo cada operação identificável pelo nome. */
import { createHash } from "node:crypto";
import { Conhecimento, EstadoConhecimento, Linha, OrigemConhecimento, TipoConhecimento } from "../tipos/conhecimento.js";

export function impressaoDoConhecimento(agente: string | null, espacoId: string | null, tipo: string, titulo: string, texto: string) { return createHash('sha256').update([agente ?? '*', espacoId ?? '*', tipo, titulo.trim().toLowerCase(), texto.trim().toLowerCase()].join('\0')).digest('hex'); }

export const linhaParaConhecimento = (r: Linha): Conhecimento => ({ id: String(r.id), agente: (r.agente_id as string | null) ?? null, espacoId: (r.espaco_id as string | null) ?? null, tipo: r.tipo as TipoConhecimento, titulo: String(r.titulo), texto: String(r.texto),
  origem: r.origem as OrigemConhecimento, estado: r.estado as EstadoConhecimento, criadoEm: String(r.criado_em), decididoEm: (r.decidido_em as string | null) ?? null, cliente: (r.cliente as string | null) ?? null });

/** Nome da vista do banco que mostra os conhecimentos de um agente (agente_<id>). */

export const vistaDoAgente = (id: string) => 'agente_' + id.replace(/-/g, '_');
