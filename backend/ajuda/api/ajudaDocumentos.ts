/** Canal ajuda:documentos: Documentos da Central de ajuda. */
import path from 'node:path';
import { lerDocumentosDaAjuda } from '../regras/lerDocumentosDaAjuda.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

export const ajudaDocumentos: TratadorDoCanal<'ajuda:documentos'> = () => lerDocumentosDaAjuda(path.join(raizDoAplicativo, 'app', 'ajuda'), versao);
