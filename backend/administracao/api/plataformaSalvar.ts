/** Canal plataforma:salvar: Ligar ou desligar agentes, IA externa e orquestração em todos os projetos. */
import { salvarAgentesDaPlataforma } from '../regras/agentesDaPlataforma.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const plataformaSalvar: TratadorDoCanal<'plataforma:salvar'> = a => salvarAgentesDaPlataforma(a);
