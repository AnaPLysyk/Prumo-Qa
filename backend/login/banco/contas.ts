/** Consulta e grava os registros locais de contas usados pela sessão. */
import { RegistroDeContas, registroDeContasSchema, registroDeContasVazio } from "../tipos/contas.js";
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { diretorioBase } from "../../compartilhado/banco/diretorioDados.js";

/** Sem arquivo de contas, mantém o registro inicial vazio e o login desativado. */
export function lerContas(base?: string): RegistroDeContas {
  return lerLocal<RegistroDeContas>(
    'acessos.json',
    registroDeContasSchema,
    structuredClone(registroDeContasVazio),
    base ?? diretorioBase()
  );
}

/** Valida os dados antes da gravação local atômica. */
export function gravarContas(contas: RegistroDeContas, base?: string): RegistroDeContas {
  const valido = registroDeContasSchema.parse(contas);
  gravarLocal('acessos.json', valido, base ?? diretorioBase());
  return valido;
}
