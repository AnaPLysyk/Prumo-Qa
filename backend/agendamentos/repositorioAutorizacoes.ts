/** Guarda e consulta as autorizações de agendamentos em armazenamento local validado. */
import { z } from "zod";
import { lerLocal, gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { Registro, registro } from "./tipos/autorizacoes.js";

export const lerAutorizacoes = (base?: string): Registro =>
  lerLocal<Registro>(
    'autorizacoes.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, execucoes: [], publicacoes: [], escritas: [] },
    base
  );

export const gravarAutorizacoes = (autorizacoes: Registro, base?: string) =>
  gravarLocal('autorizacoes.json', registro.parse(autorizacoes), base);
