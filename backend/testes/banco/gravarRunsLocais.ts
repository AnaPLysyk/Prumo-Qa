/** Grava as runs locais em runs-qase.json. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro } from '../tipos/runLocal.js';

export const gravarRunsLocais = (r: Registro, b?: string) => gravarLocal('runs-qase.json', registro.parse(r), b);
