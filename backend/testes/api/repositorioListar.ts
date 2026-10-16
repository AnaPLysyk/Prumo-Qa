/** Canal repositorio:listar: Consultar casos e suítes do projeto no repositório offline. */
import type { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarRepositorioLocal } from '../regras/listarRepositorioLocal.js';

export const repositorioListar: TratadorDoCanal<'repositorio:listar'> =
  dados => listarRepositorioLocal(dados.espacoId);
