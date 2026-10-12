/** Canal conhecimento:criar: Ensinar um conhecimento a um agente (ou a todos), geral ou do projeto. */
import { registrarConhecimento } from '../banco/registrarConhecimento.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoCriar: TratadorDoCanal<'conhecimento:criar'> = a => registrarConhecimento({ espacoId: a.espacoId, agente: a.agente, tipo: a.tipo, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' });
