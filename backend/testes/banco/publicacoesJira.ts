/** Lê e grava o histórico local de publicações no Jira, limitado às últimas 1.000. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro } from '../tipos/comentarioJira.js';

export const lerPublicacoesJira = (base?: string): Registro =>
  lerLocal<Registro>(
    'publicacoes-jira.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, itens: [] },
    base
  );

export const gravarPublicacoesJira = (publicacoes: Registro, base?: string) => {
  if (publicacoes.itens.length > 1000) {
    publicacoes.itens = publicacoes.itens.slice(-1000);
  }
  gravarLocal('publicacoes-jira.json', registro.parse(publicacoes), base);
};
