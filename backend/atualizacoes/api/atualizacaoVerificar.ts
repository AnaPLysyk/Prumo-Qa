/** Canal atualizacao:verificar: Consultar a release oficial mais recente (somente quando a pessoa clica). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { consultarAtualizacao } from '../regras/consultarAtualizacao.js';

export const atualizacaoVerificar: TratadorDoCanal<'atualizacao:verificar'> = () => consultarAtualizacao();
