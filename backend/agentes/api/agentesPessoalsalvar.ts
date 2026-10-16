/** Canal agentes:pessoalsalvar: Criar ou atualizar um agente da pessoa da sessão (privado ou público). */
import { salvarAgentePessoal } from '../regras/agentesPessoais.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';

export const agentesPessoalsalvar: TratadorDoCanal<'agentes:pessoalsalvar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return salvarAgentePessoal(a.espacoId, a.agente, u.id);
};
