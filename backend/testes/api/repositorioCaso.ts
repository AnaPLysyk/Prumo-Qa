/** Canal repositorio:caso: Criar ou editar um caso offline sem publicar no Qase. */
import type { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { salvarCasoLocal } from '../regras/salvarCasoLocal.js';

export const repositorioCaso: TratadorDoCanal<'repositorio:caso'> =
  dados => salvarCasoLocal(dados);
