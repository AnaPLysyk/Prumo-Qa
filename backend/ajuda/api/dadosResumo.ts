/** Canal dados:resumo: Mostrar onde ficam os dados locais e quanto espaço ocupam. */
import { resumirDados } from '../privacidade/resumirDados.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const dadosResumo: TratadorDoCanal<'dados:resumo'> = () => resumirDados();
