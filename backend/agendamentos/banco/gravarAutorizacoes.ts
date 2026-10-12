/** Grava as autorizações e políticas (autorizacoes.json). */
import { Registro, registro } from '../tipos/autorizacoes.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export const gravarAutorizacoes = (r: Registro, base?: string) => gravarLocal('autorizacoes.json', registro.parse(r), base);
