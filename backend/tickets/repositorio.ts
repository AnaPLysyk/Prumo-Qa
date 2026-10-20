/** Persistência de tickets: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import { gravarLocal } from "../compartilhado/banco/gravarLocal.js";
import { lerLocal } from "../compartilhado/banco/lerLocal.js";
import { Proposta, propostaSchema, Registro, registro } from "./contratos.js";

export const lerPropostas = (base?: string) =>
  lerLocal<Registro>(
    'propostas.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, itens: [] },
    base
  );

export const gravarPropostas = (propostas: Registro, base?: string) =>
  gravarLocal('propostas.json', registro.parse(propostas), base);

export function obterProposta(id: string, base?: string) {
  const proposta = lerPropostas(base).itens.find(item => item.id === id);
  if (!proposta) throw new Error('PROPOSAL_NOT_FOUND');
  return proposta;
}

export function alterarProposta(
  id: string,
  alterar: (proposta: Proposta) => void,
  base?: string,
  agora = new Date()
) {
  const registroPropostas = lerPropostas(base);
  const proposta = registroPropostas.itens.find(item => item.id === id);
  if (!proposta) throw new Error('PROPOSAL_NOT_FOUND');

  alterar(proposta);
  proposta.atualizadaEm = agora.toISOString();
  propostaSchema.parse(proposta);
  gravarPropostas(registroPropostas, base);
  return proposta;
}

export const listarPropostas = (espacoId?: string, b?: string) => lerPropostas(b).itens.filter(p => !espacoId || p.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
