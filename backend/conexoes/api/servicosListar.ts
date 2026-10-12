/** Canal servicos:listar: Lista as contas de Jira, Qase e GitHub configuradas (sem credenciais). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosListar: TratadorDoCanal<'servicos:listar'> = ()=>servicosDoAplicativo.contas();
