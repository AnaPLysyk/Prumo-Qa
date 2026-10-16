/** Canal chamados:configuracao: Saber se a chave de administração do suporte está guardada neste computador (a chave nunca volta para a janela). */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { ENDERECO_DO_SERVICO } from '../../compartilhado/integracoes/servicoDoPrumo.js';
import { lerChaveDeAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosConfiguracao: TratadorDoCanal<'chamados:configuracao'> = () => ({ configurada: !!lerChaveDeAdministracao(protetorDoSistema(safeStorage)), servico: new URL(process.env.PRUMO_SERVICO || ENDERECO_DO_SERVICO).origin });
