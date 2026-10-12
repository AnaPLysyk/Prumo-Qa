/** Lê as configurações de agentes por projeto (agentes.json). */
import { Registro, registro } from '../tipos/politicas.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerConfiguracaoDosAgentes = (b?: string) => lerLocal<Registro>('agentes.json', registro, { version: 1, itens: [] }, b);
