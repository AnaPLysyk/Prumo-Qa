/** Consulta projetos Qase usando credencial já guardada no cofre, sem revelá-la à janela. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
export const servicosQasepreviaconta: TratadorDoCanal<'servicos:qasepreviaconta'> = a => servicosDoAplicativo.qasePreverConta(a.conexaoId);
