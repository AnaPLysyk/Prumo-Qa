/** Canal agentes:orquestracoes: Listar as orquestrações recentes do projeto: agentes, ordem, etapas, tempos, fontes e falhas. */
import { listarOrquestracoes } from '../banco/listarOrquestracoes.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agentesOrquestracoes: TratadorDoCanal<'agentes:orquestracoes'> = a => listarOrquestracoes(a.espacoId);
