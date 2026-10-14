/** Canal acesso:salvar: Salvar as configurações gerais de acesso. */
import { salvarConfiguracaoDeAcesso } from '../regras/papeis.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const acessoSalvar: TratadorDoCanal<'acesso:salvar'> = a => salvarConfiguracaoDeAcesso(a);
