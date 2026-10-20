/** Reúne armazenamento de operacoes da funcionalidade, mantendo cada operação identificável pelo nome. */
import { lerLocal } from "../../compartilhado/banco/lerLocal.js";
import { Razao, razaoSchema } from "../tipos/operacoesExternas.js";
import { gravarLocal } from "../../compartilhado/banco/gravarLocal.js";

export const lerRegistroDeOperacoes = (b?: string) => lerLocal<Razao>('operacoes-externas.json', razaoSchema, { version: 1, itens: [] }, b);

export const gravarRegistroDeOperacoes = (r: Razao, b?: string) => { if (r.itens.length > 1500) r.itens = r.itens.slice(-1500); gravarLocal('operacoes-externas.json', razaoSchema.parse(r), b); };
