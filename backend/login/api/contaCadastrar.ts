/** Canal conta:cadastrar: Criar a própria conta por e-mail na tela de entrada, com o código de confirmação (pode aguardar aprovação). */
import { cadastrarConta } from '../regras/contas.js';
import {cadastrarRemotamente} from '../integracoes/autenticacaoRemota.js';
import {usarAutenticacaoRemota} from '../integracoes/configuracaoDaAutenticacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaCadastrar: TratadorDoCanal<'conta:cadastrar'> = a =>
  usarAutenticacaoRemota()?cadastrarRemotamente(a.nome,a.email,a.senha):cadastrarConta({...a,codigo:a.codigo??''});
