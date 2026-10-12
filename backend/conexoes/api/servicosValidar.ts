/** Canal servicos:validar: Confere se a credencial de uma conta ainda funciona. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosValidar: TratadorDoCanal<'servicos:validar'> = a=>servicosDoAplicativo.validarConta(a.id);
