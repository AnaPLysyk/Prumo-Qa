/** Canal agentes:pessoaisimportar: Trazer as prévias antigas guardadas na janela como agentes privados da pessoa da sessão. */
import { importarPreviasAntigas } from '../regras/agentesPessoais.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';

export const agentesPessoaisimportar: TratadorDoCanal<'agentes:pessoaisimportar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return importarPreviasAntigas(a.espacoId, a.previas, u.id);
};
