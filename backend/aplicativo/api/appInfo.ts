/** Canal app:info: Informar versão, pasta de dados e se o app está empacotado. */
import { app } from 'electron';
import { TratadorDoCanal } from './TratadorDoCanal.js';
import { versao } from '../tipos/aplicativo.js';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const appInfo: TratadorDoCanal<'app:info'> = () => ({ version: versao, dataDir: diretorioDados(), platform: process.platform, packaged: app.isPackaged });
