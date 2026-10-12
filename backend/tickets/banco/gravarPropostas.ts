/** Grava as propostas em propostas.json depois de conferir o formato. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro } from '../tipos/proposta.js';

export const gravarPropostas = (r: Registro, b?: string) => gravarLocal('propostas.json', registro.parse(r), b);
