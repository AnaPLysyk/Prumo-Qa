/** Lê e valida o histórico de versões (app/versoes.json). */
import fs from 'node:fs';
import { Versao } from '../tipos/versao.js';
import { validarVersoes } from './validarVersoes.js';

export function carregarVersoes(arquivo: string): Versao[] {
  return validarVersoes(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
}
