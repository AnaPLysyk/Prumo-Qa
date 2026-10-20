/** Abre o cofre protegido, consulta e grava credenciais das integrações. */
import { Protetor, schema } from "../tipos/credenciais.js";
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { z } from "zod";
import { exigirProtecaoDoWindows } from "./exigirProtecaoDoWindows.js";

// Cada ação está no seu arquivo; aqui só se fixa o protetor do Windows e a pasta de dados.
export function cofreCredenciais(protetor: Protetor, base?: string) {
  return {
    salvar: (id: string, valor: string) => salvarCredencial(protetor, id, valor, base),
    ler: (id: string) => lerCredencial(protetor, id, base),
    remover: (id: string) => removerCredencial(id, base),
  };
}

export function lerArquivoDeCredenciais(base?: string) {
  return lerLocal('credenciais.json', schema, { version: 1, entradas: {} }, base);
}

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
