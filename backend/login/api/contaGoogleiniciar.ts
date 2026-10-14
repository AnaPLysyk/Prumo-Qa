/** Canal conta:googleiniciar: Abrir o navegador para entrar ou se cadastrar pelo Google. */
import { dependenciasDoGoogle } from '../regras/configuracaoDoLogin.js';
import { iniciarEntrada } from '../regras/entradaPorProvedor.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGoogleiniciar: TratadorDoCanal<'conta:googleiniciar'> = a => iniciarEntrada('google', dependenciasDoGoogle(), a.ativar ? 'ativar' : 'entrar');
