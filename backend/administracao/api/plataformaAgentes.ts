/** Canal plataforma:agentes: Ler a configuração geral dos agentes da plataforma. */
import { agentesDaPlataformaParaJanela } from '../regras/agentesDaPlataforma.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const plataformaAgentes: TratadorDoCanal<'plataforma:agentes'> = () => agentesDaPlataformaParaJanela();
