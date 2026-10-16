/** Grava dados locais de forma atômica e validada, sem tocar o cadastro de propostas. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { repositorioLocalSchema, type RepositorioLocal } from '../tipos/repositorioLocal.js';

export const gravarRepositorioLocal = (dados: RepositorioLocal, base?: string) =>
  gravarLocal('repositorio-testes-local.json', repositorioLocalSchema.parse(dados), base);
