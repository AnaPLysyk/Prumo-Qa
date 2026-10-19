/** Canal conta:entrar: Entrar com login e senha. */
import { entrarNaConta } from '../regras/contas.js';
import {entrarRemotamente,sairRemotamente,usarAutenticacaoRemota} from '../integracoes/autenticacaoRemota.js';
import {entrarComIdentidadeRemota} from '../regras/entrarComIdentidadeRemota.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaEntrar: TratadorDoCanal<'conta:entrar'> = async a => {
  if(usarAutenticacaoRemota()){
    const identidade=await entrarRemotamente(a.login,a.senha);
    try{return entrarComIdentidadeRemota(identidade);}
    catch(erro){
      // Login remoto pode funcionar mesmo quando o vínculo local é recusado
      // (ex.: e-mail da conta antiga). Não deixar cookie válido sem sessão local.
      await sairRemotamente();
      throw erro;
    }
  }
  return entrarNaConta(a);
};
