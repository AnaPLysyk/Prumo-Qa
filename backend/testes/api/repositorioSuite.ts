/** Canal repositorio:suite: Criar ou editar uma suíte de testes offline do projeto. */
import type { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { salvarSuiteLocal } from '../regras/salvarSuiteLocal.js';

export const repositorioSuite: TratadorDoCanal<'repositorio:suite'> =
  dados => salvarSuiteLocal(dados);
