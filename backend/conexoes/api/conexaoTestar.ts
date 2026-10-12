/** Canal conexao:testar: Verificar handshake, quatro ferramentas e consulta de evidências pelo SDK real, separadamente do uso observado pelo cliente. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { testarIntegracao } from '../ia/testarIntegracao.js';

export const conexaoTestar: TratadorDoCanal<'conexao:testar'> = a => testarIntegracao(a.root,a.client);
