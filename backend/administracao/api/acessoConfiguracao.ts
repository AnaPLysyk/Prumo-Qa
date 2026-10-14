/** Canal acesso:configuracao: Ler as configurações gerais de acesso. */
import { configuracaoDeAcesso } from '../regras/papeis.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const acessoConfiguracao: TratadorDoCanal<'acesso:configuracao'> = () => configuracaoDeAcesso();
