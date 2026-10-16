/** Canal suporte:enviar: Enviar o chamado revisado (e os anexos) pelo serviço do Prumo, sem precisar de conta no GitHub. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { enviarChamado } from '../regras/chamadosDaPessoa.js';

export const suporteEnviar: TratadorDoCanal<'suporte:enviar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return enviarChamado(a, { usuario: u, protetor: protetorDoSistema(safeStorage), versao });
};
