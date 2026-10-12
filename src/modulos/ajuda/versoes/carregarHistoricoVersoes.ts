/** Carrega o histórico JSON de versões e confere seus dados. */
import fs from 'node:fs';
import type { Versao } from './definirFormatoVersao.js';
import { validarVersoes } from './validarHistoricoVersoes.js';

export function carregarVersoes(arquivo: string): Versao[] {
  return validarVersoes(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
}
