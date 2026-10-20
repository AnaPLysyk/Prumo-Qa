/** Controlador da funcionalidade testes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import type { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { salvarCasoLocal } from "./regras/salvarCasoLocal.js";
import { listarRepositorioLocal } from "./regras/listarRepositorioLocal.js";
import { salvarSuiteLocal } from "./regras/salvarSuiteLocal.js";

export const repositorioCaso: TratadorDoCanal<'repositorio:caso'> =
  dados => salvarCasoLocal(dados);

export const repositorioListar: TratadorDoCanal<'repositorio:listar'> =
  dados => listarRepositorioLocal(dados.espacoId);

export const repositorioSuite: TratadorDoCanal<'repositorio:suite'> =
  dados => salvarSuiteLocal(dados);
