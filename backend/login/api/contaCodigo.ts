/** Canal conta:codigo: Mandar um código de 6 dígitos ao e-mail, para confirmar o cadastro ou definir senha nova. */
import { pedirCodigo } from '../regras/codigosPorEmail.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaCodigo: TratadorDoCanal<'conta:codigo'> = a => pedirCodigo(a);
