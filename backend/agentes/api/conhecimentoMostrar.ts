/** Canal conhecimento:mostrar: Mostrar o arquivo conhecimento.db no Explorer (para abrir no Beekeeper Studio ou outro gerenciador SQLite). */
import { shell } from 'electron';
import { caminhoConhecimento } from '../banco/caminhoConhecimento.js';
import { lerPerfil } from '../banco/lerPerfil.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoMostrar: TratadorDoCanal<'conhecimento:mostrar'> = () => { const alvo = caminhoConhecimento(); lerPerfil(); shell.showItemInFolder(alvo); return { arquivo: alvo }; };
