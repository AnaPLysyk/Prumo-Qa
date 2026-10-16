/** Canal chamados:anexo: Ler uma imagem ou um vídeo anexado a um chamado, para mostrar na tela. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { chamadosDaAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosAnexo: TratadorDoCanal<'chamados:anexo'> = (a) => chamadosDaAdministracao.anexo(a.numero, a.indice, { protetor: protetorDoSistema(safeStorage) });
