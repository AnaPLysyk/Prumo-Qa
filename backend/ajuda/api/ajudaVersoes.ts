/** Canal ajuda:versoes: Histórico de versões e versão instalada. */
import { apresentarVersoes } from '../versoes/apresentarVersoes.js';
import { carregarVersoes } from '../versoes/carregarVersoes.js';
import { conferirInstalada } from '../versoes/conferirInstalada.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { arquivoVersoes, versao } from '../../aplicativo/tipos/aplicativo.js';

export const ajudaVersoes: TratadorDoCanal<'ajuda:versoes'> = () => { const v = carregarVersoes(arquivoVersoes); conferirInstalada(v, versao); return { installed: versao, versions: apresentarVersoes(v, versao) }; };
