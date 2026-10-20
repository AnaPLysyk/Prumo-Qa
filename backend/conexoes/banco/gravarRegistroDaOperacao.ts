/** Cria ou atualiza o registro de uma operação externa. */
import { randomUUID } from 'node:crypto';
import { gravarRegistroDeOperacoes } from './armazenamentoDeOperacoes.js';
import { lerRegistroDeOperacoes } from './armazenamentoDeOperacoes.js';
import { Entrada, RegistroOperacao, itemSchema } from '../tipos/operacoesExternas.js';

export function gravarRegistroDaOperacao(b: string | undefined, agora: () => Date, e: Entrada): RegistroOperacao {
  const r = lerRegistroDeOperacoes(b); const t = agora().toISOString(); const i = r.itens.findIndex(x => x.chave === e.chave);
  const base: RegistroOperacao = i >= 0 ? r.itens[i]! : { id: e.id ?? randomUUID(), chave: e.chave, espacoId: e.espacoId, servico: e.servico, operacao: e.operacao, resumo: e.resumo, estado: e.estado, origem: e.origem, tentativas: 0, remoto: null, criadoEm: t, atualizadoEm: t };
  const novo = itemSchema.parse({ ...base, ...e, id: base.id, remoto: e.remoto === undefined ? base.remoto : e.remoto, tentativas: e.tentativas ?? base.tentativas, criadoEm: base.criadoEm, atualizadoEm: t, erro: e.estado === 'CONFIRMADA' ? undefined : e.erro ?? base.erro });
  if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravarRegistroDeOperacoes(r, b); return novo;
}
