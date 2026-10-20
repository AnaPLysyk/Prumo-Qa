/** Persistência de contas e permissões de acesso em acessos.json. */
import { RegistroDeContas, registroDeContasSchema, registroDeContasVazio } from './tipos/contas.js';
import { lerLocal } from '../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../compartilhado/banco/gravarLocal.js';
import { diretorioBase } from '../compartilhado/banco/diretorioDados.js';

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
