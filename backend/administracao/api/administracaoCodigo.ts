/** Canal administracao:codigo: Mostrar o código de um arquivo do aplicativo na Documentação viva (somente leitura, só arquivos do mapa). */
import { lerCodigoDoAplicativo } from '../banco/lerCodigoDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const administracaoCodigo: TratadorDoCanal<'administracao:codigo'> = a => lerCodigoDoAplicativo(a.caminho);
