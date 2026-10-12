/** Canal conhecimento:estado: Resumo do banco de conhecimento: arquivo, tabelas, vistas por agente, contagens e perfil. */
import { estadoConhecimento } from '../banco/estadoConhecimento.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoEstado: TratadorDoCanal<'conhecimento:estado'> = a => estadoConhecimento(a.espacoId);
