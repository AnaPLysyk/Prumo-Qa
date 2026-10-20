/** Lê e grava os casos e suítes do repositório local de testes. */
import { z } from "zod";
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { repositorioLocalSchema, type RepositorioLocal } from "../tipos/escritaQase.js";

export const lerRepositorioLocal = (base?: string) =>
  lerLocal<RepositorioLocal>('repositorio-testes-local.json', repositorioLocalSchema as z.ZodType<RepositorioLocal>, { version: 1, casos: [], suites: [] }, base);

export const gravarRepositorioLocal = (dados: RepositorioLocal, base?: string) =>
  gravarLocal('repositorio-testes-local.json', repositorioLocalSchema.parse(dados), base);
