/** Lê, grava e consulta o registro local de operações e permissões de escrita. */
import { lerLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { Razao, razaoSchema, Entrada, RegistroOperacao, itemSchema, Perm, permSchema } from "./tipos/operacoesExternas.js";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { randomUUID } from "node:crypto";

export const lerRegistroDeOperacoes = (b?: string) => lerLocal<Razao>('operacoes-externas.json', razaoSchema, { version: 1, itens: [] }, b);

export const gravarRegistroDeOperacoes = (r: Razao, b?: string) => { if (r.itens.length > 1500) r.itens = r.itens.slice(-1500); gravarLocal('operacoes-externas.json', razaoSchema.parse(r), b); };

export function gravarRegistroDaOperacao(b: string | undefined, agora: () => Date, e: Entrada): RegistroOperacao {
  const r = lerRegistroDeOperacoes(b); const t = agora().toISOString(); const i = r.itens.findIndex(x => x.chave === e.chave);
  const base: RegistroOperacao = i >= 0 ? r.itens[i]! : { id: e.id ?? randomUUID(), chave: e.chave, espacoId: e.espacoId, servico: e.servico, operacao: e.operacao, resumo: e.resumo, estado: e.estado, origem: e.origem, tentativas: 0, remoto: null, criadoEm: t, atualizadoEm: t };
  const novo = itemSchema.parse({ ...base, ...e, id: base.id, remoto: e.remoto === undefined ? base.remoto : e.remoto, tentativas: e.tentativas ?? base.tentativas, criadoEm: base.criadoEm, atualizadoEm: t, erro: e.estado === 'CONFIRMADA' ? undefined : e.erro ?? base.erro });
  if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravarRegistroDeOperacoes(r, b); return novo;
}

export const lerPermissoesDeEscrita = (b?: string) => lerLocal<Perm>('permissoes-servicos.json', permSchema, { version: 1, itens: [] }, b);

export const listarOperacoes = (espacoId?: string, limite = 100, b?: string) => lerRegistroDeOperacoes(b).itens.filter(i => !espacoId || i.espacoId === espacoId).slice(-limite).reverse();
