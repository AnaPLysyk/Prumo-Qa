/** Canal agentes:pessoalexcluir: Excluir um agente da pessoa da sessão. */
import { excluirAgentePessoal } from '../regras/agentesPessoais.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';

export const agentesPessoalexcluir: TratadorDoCanal<'agentes:pessoalexcluir'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return excluirAgentePessoal(a.id, u.id);
};
