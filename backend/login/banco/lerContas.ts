/** Lê as contas, os papéis e a configuração de acesso (acessos.json); sem arquivo, o login está desligado. */
import { RegistroDeContas, registroDeContasSchema, registroDeContasVazio } from '../tipos/contas.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { diretorioBase } from '../../compartilhado/banco/diretorioDados.js';

export const lerContas = (b?: string): RegistroDeContas => lerLocal<RegistroDeContas>('acessos.json', registroDeContasSchema, structuredClone(registroDeContasVazio), b ?? diretorioBase());
