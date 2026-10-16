/** Canal chamados:chave: Guardar (ou, vazia, apagar) a chave de administração do suporte no cofre do sistema. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { salvarChaveDeAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosChave: TratadorDoCanal<'chamados:chave'> = (a) => salvarChaveDeAdministracao(a.chave, protetorDoSistema(safeStorage));
