/** Reúne os dados já validados e os limites necessários para consultar um recurso externo. */
import { ContextoServico } from './adaptador.js';
import { Pg, Filtros } from './leituras.js';
import { Recurso } from '../../projetos/contratos.js';

export type ParametrosConsulta = {
  ctx: ContextoServico;
  rec: Recurso;
  p: Pg;
  id?: string;
  f: Filtros;
  repo: string;
  pg: string;
  prox: (quantidade: number) => number | null;
  ticket: () => string;
  numero: () => string;
};

/** Estrutura padronizada do retorno da consulta. */
export type ResultadoConsulta = { dados: unknown; proxima: number | null; endpoint: string };
