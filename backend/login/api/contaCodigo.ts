/** Solicita recuperação remota com Better Auth ou código legado para contas locais. */
import {pedirCodigo} from '../regras/codigosPorEmail.js';
import {pedirRecuperacaoRemota} from '../integracoes/autenticacaoRemota.js';
import {usarAutenticacaoRemota} from '../integracoes/configuracaoDaAutenticacao.js';
import {TratadorDoCanal} from '../../aplicativo/api/TratadorDoCanal.js';
export const contaCodigo:TratadorDoCanal<'conta:codigo'>=async a=>{
  if(usarAutenticacaoRemota()){
    if(a.finalidade!=='SENHA')throw new Error('LOGIN_METHOD_DISABLED');
    return pedirRecuperacaoRemota(a.email);
  }
  if(process.env.PRUMO_LOGIN_MVP === '1')throw new Error('IDENTITY_NOT_CONFIGURED');
  return pedirCodigo(a);
};
