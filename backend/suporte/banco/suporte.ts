/** Lê e grava os dados locais necessários ao suporte. */
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { meusChamadosSchema } from "../contratos.js";
import type { z } from "zod";

type Registro = z.infer<typeof meusChamadosSchema>;

const ARQUIVO = 'chamados-de-suporte.json';

export const lerMeusChamados = (b?: string): Registro => lerLocal<Registro>(ARQUIVO, meusChamadosSchema, { version: 1, chamados: [] }, b);

export function gravarMeusChamados(r: Registro, b?: string): void { gravarLocal(ARQUIVO, meusChamadosSchema.parse(r), b); }
