/** Converte uma linha do banco num conhecimento. */
import { Conhecimento, EstadoConhecimento, Linha, OrigemConhecimento, TipoConhecimento } from '../tipos/conhecimento.js';

export const linhaParaConhecimento = (r: Linha): Conhecimento => ({ id: String(r.id), agente: (r.agente_id as string | null) ?? null, espacoId: (r.espaco_id as string | null) ?? null, tipo: r.tipo as TipoConhecimento, titulo: String(r.titulo), texto: String(r.texto),
  origem: r.origem as OrigemConhecimento, estado: r.estado as EstadoConhecimento, criadoEm: String(r.criado_em), decididoEm: (r.decidido_em as string | null) ?? null, cliente: (r.cliente as string | null) ?? null });
