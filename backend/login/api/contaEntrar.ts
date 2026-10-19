/** Canal conta:entrar: Entrar com login e senha. */
import { entrarNaConta } from '../regras/contas.js';
import {entrarRemotamente,usarAutenticacaoRemota} from '../integracoes/autenticacaoRemota.js';
import {entrarComIdentidadeRemota} from '../regras/entrarComIdentidadeRemota.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaEntrar: TratadorDoCanal<'conta:entrar'> = async a => {
  if(usarAutenticacaoRemota())return entrarComIdentidadeRemota(await entrarRemotamente(a.login,a.senha));
  return entrarNaConta(a);
};
