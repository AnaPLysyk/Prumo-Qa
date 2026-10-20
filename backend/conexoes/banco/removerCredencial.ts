/** Apaga a credencial cifrada de uma conta de credenciais.json. */
import { gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';
import { lerArquivoDeCredenciais } from './lerArquivoDeCredenciais.js';
import { validarIdDaCredencial } from './validarIdDaCredencial.js';

export function removerCredencial(id: string, base?: string) {
  validarIdDaCredencial(id);
  const r = lerArquivoDeCredenciais(base); delete r.entradas[id]; gravarLocal('credenciais.json', r, base);
}
