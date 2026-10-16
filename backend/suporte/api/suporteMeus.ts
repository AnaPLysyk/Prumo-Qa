/** Canal suporte:meus: Listar os chamados que a pessoa da sessão abriu, com o estado atual. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { meusChamados } from '../regras/chamadosDaPessoa.js';

export const suporteMeus: TratadorDoCanal<'suporte:meus'> = () => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return meusChamados({ usuario: u, protetor: protetorDoSistema(safeStorage) });
};
