/** Lê e grava autorizações de execução, publicação e escrita das rotinas. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro } from '../tipos/autorizacoes.js';

export const lerAutorizacoes = (base?: string): Registro =>
  lerLocal<Registro>(
    'autorizacoes.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, execucoes: [], publicacoes: [], escritas: [] },
    base
  );

export const gravarAutorizacoes = (autorizacoes: Registro, base?: string) =>
  gravarLocal('autorizacoes.json', registro.parse(autorizacoes), base);
