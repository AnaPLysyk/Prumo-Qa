/** Confirma o desafio de duas etapas de uma conta local; no MVP centralizado a API usa senha e sessão. */
import {confirmarEntrada} from '../regras/contas.js';
import {usarAutenticacaoRemota} from '../integracoes/autenticacaoRemota.js';
import {TratadorDoCanal} from '../../aplicativo/api/TratadorDoCanal.js';
export const contaConfirmarentrada:TratadorDoCanal<'conta:confirmarentrada'>=async a=>{
  if(process.env.PRUMO_LOGIN_MVP === '1' || usarAutenticacaoRemota())throw new Error('LOGIN_METHOD_DISABLED');
  return confirmarEntrada(a);
};
