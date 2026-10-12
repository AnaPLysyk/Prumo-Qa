/** Confere o destino do teste k6: http(s), sem senha na URL, só localhost em ambiente local e nunca produção. */
import { enderecoLocal } from './enderecoLocal.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';

export function validarAlvoDoK6(alvo: string, ambiente: string) {
  let u: URL; try { u = new URL(alvo); } catch { throw new ErroQa('K6_TARGET_INVALID', 'Destino inválido.'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new ErroQa('K6_TARGET_INVALID', 'Destino deve ser http(s) sem credenciais na URL.');
  if (ambiente === 'producao') throw new ErroQa('POLICY_BLOCKED', 'Teste de carga em produção está bloqueado por padrão nesta versão.');
  if (ambiente === 'local' && !enderecoLocal(u.hostname)) throw new ErroQa('K6_TARGET_NOT_LOCAL', 'Ambiente "local" só aceita localhost/127.0.0.1.');
  return u.origin;
}
