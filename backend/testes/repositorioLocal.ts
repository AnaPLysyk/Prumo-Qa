/** Lê e grava o repositório offline de casos e suítes de testes. */
import { z } from "zod";
import { lerLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { repositorioLocalSchema, type RepositorioLocal } from "./tipos/repositorioLocal.js";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";

export const lerRepositorioLocal = (base?: string) =>
  lerLocal<RepositorioLocal>('repositorio-testes-local.json', repositorioLocalSchema as z.ZodType<RepositorioLocal>, { version: 1, casos: [], suites: [] }, base);

export const gravarRepositorioLocal = (dados: RepositorioLocal, base?: string) =>
  gravarLocal('repositorio-testes-local.json', repositorioLocalSchema.parse(dados), base);
