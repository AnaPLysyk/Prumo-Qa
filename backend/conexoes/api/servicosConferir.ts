/** Canal servicos:conferir: Confere se o vínculo com o serviço continua válido. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosConferir: TratadorDoCanal<'servicos:conferir'> = a=>servicosDoAplicativo.validarVinculo(a.espacoId,a.servico);
