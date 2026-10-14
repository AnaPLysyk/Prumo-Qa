/** Canal propostas:criar: Criar uma proposta de caso de teste ou de bug em rascunho. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { criarProposta } from '../regras/criarProposta.js';

export const propostasCriar: TratadorDoCanal<'propostas:criar'> = a => criarProposta({ espacoId: a.espacoId, tipo: a.tipo, origem: 'PESSOA', dados: a.dados, requisito: a.requisito, risco: a.risco, falhaDeOrigem: a.falhaDeOrigem });
