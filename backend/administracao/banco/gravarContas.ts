/** Grava contas.json conferindo o formato antes (cópia temporária e troca, sem atalhos). */
import { RegistroDeContas, registroDeContasSchema } from '../tipos/contas.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export function gravarContas(r: RegistroDeContas, b?: string): RegistroDeContas {
  const valido = registroDeContasSchema.parse(r); gravarLocal('contas.json', valido, b); return valido;
}
