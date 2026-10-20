/** Grava acessos.json conferindo o formato antes (cópia temporária e troca, sem atalhos). */
import { RegistroDeContas, registroDeContasSchema } from '../tipos/contas.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { diretorioBase } from '../../compartilhado/banco/diretorioDados.js';

export function gravarContas(r: RegistroDeContas, b?: string): RegistroDeContas {
  const valido = registroDeContasSchema.parse(r); gravarLocal('acessos.json', valido, b ?? diretorioBase()); return valido;
}
