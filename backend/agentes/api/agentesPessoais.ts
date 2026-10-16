/** Canal agentes:pessoais: Listar os agentes do projeto que a pessoa da sessão pode ver: os dela e os públicos das outras contas. */
import { listarAgentesPessoais } from '../regras/agentesPessoais.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';

export const agentesPessoais: TratadorDoCanal<'agentes:pessoais'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return listarAgentesPessoais(a.espacoId, u.id);
};
