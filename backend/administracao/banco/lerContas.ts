/** Lê as contas, os papéis e a configuração de acesso (contas.json); sem arquivo, o login está desligado. */
import { RegistroDeContas, registroDeContasSchema, registroDeContasVazio } from '../tipos/contas.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerContas = (b?: string): RegistroDeContas => lerLocal<RegistroDeContas>('contas.json', registroDeContasSchema, structuredClone(registroDeContasVazio), b);
