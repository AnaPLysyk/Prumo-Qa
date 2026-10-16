/** Lê o repositório offline; ausência de arquivo não cria dados nem modifica propostas antigas. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { repositorioLocalSchema, type RepositorioLocal } from '../tipos/repositorioLocal.js';

export const lerRepositorioLocal = (base?: string) =>
  lerLocal<RepositorioLocal>('repositorio-testes-local.json', repositorioLocalSchema as z.ZodType<RepositorioLocal>, { version: 1, casos: [], suites: [] }, base);
