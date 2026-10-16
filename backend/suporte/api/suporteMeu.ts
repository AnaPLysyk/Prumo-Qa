/** Canal suporte:meu: Ver um chamado da pessoa da sessão com as respostas da equipe. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { meuChamado } from '../regras/chamadosDaPessoa.js';

export const suporteMeu: TratadorDoCanal<'suporte:meu'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return meuChamado(a.numero, { usuario: u, protetor: protetorDoSistema(safeStorage) });
};
