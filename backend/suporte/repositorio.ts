/** Persistência de suporte: operações relacionadas no mesmo módulo. */
import { lerLocal } from "../compartilhado/banco/lerLocal.js";
import { gravarLocal } from "../compartilhado/banco/gravarLocal.js";
import { meusChamadosSchema } from "./contratos.js";
import type { z } from "zod";

type Registro = z.infer<typeof meusChamadosSchema>;

const ARQUIVO = 'chamados-de-suporte.json';

export const lerMeusChamados = (b?: string): Registro => lerLocal<Registro>(ARQUIVO, meusChamadosSchema, { version: 1, chamados: [] }, b);

export function gravarMeusChamados(r: Registro, b?: string): void { gravarLocal(ARQUIVO, meusChamadosSchema.parse(r), b); }
