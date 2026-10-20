/** Repositório de credenciais externas: leitura, proteção e remoção no cofre local. */
import { z } from 'zod';
import { Protetor } from '../tipos/credenciais.js';
import { exigirProtecaoDoWindows } from './exigirProtecaoDoWindows.js';
import { lerArquivoDeCredenciais } from './lerArquivoDeCredenciais.js';
import { gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';

/** Apenas IDs UUID podem identificar entradas do cofre. */
export const validarIdDaCredencial = (id: string) => z.string().uuid().parse(id);

/** A leitura só funciona com proteção nativa disponível e devolve erro sem segredo. */
export function lerCredencial(protetor: Protetor, id: string, base?: string) {
  validarIdDaCredencial(id);
  exigirProtecaoDoWindows(protetor);
  const registro = lerArquivoDeCredenciais(base);
  if (!registro.entradas[id]) throw new Error('CREDENTIAL_UNAVAILABLE');

  try {
    return protetor.abrir(Buffer.from(registro.entradas[id]!, 'base64'));
  } catch {
    throw new Error('CREDENTIAL_UNAVAILABLE');
  }
}

/** Recusa valores vazios, controles e segredos grandes antes de proteger e persistir. */
export function salvarCredencial(
  protetor: Protetor, id: string, valor: string, base?: string
) {
  validarIdDaCredencial(id);
  exigirProtecaoDoWindows(protetor);
  if (!valor || valor.length > 6000 || /[\x00-\x1f]/.test(valor)) {
    throw new Error('CREDENTIAL_INVALID');
  }

  const registro = lerArquivoDeCredenciais(base);
  try {
    registro.entradas[id] = protetor.proteger(valor).toString('base64');
  } catch {
    throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
  }
  gravarLocal('credenciais.json', registro, base);
}

/** Revoga uma entrada do cofre sem acessar ou retornar o segredo protegido. */
export function removerCredencial(id: string, base?: string) {
  validarIdDaCredencial(id);
  const registro = lerArquivoDeCredenciais(base);
  delete registro.entradas[id];
  gravarLocal('credenciais.json', registro, base);
}
