/** Monta a busca JQL dos tickets do projeto Jira com os filtros da tela (texto, status, tipo, responsável, datas). */
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { textoEntreAspasJql } from '../../conexoes/integracoes/textoEntreAspasJql.js';
import { Filtros } from '../../conexoes/tipos/leituras.js';

/** JQL do projeto vinculado com filtros validados. O projeto é sempre fixado pelo ID numérico do vínculo. */
export function jqlDeTickets(projetoId: string, f: Filtros = {}): string {
  if (!/^\d{1,20}$/.test(projetoId)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const c = [`project = ${projetoId}`];
  if (f.q) c.push(/^[A-Z][A-Z0-9_]*-\d+$/.test(f.q) ? `key = ${f.q}` : `text ~ ${textoEntreAspasJql(f.q)}`);
  if (f.tipo) c.push(`issuetype = ${textoEntreAspasJql(f.tipo)}`); if (f.status) c.push(`status = ${textoEntreAspasJql(f.status)}`);
  if (f.desde) c.push(`updated >= ${textoEntreAspasJql(f.desde)}`); if (f.ate) c.push(`updated <= ${textoEntreAspasJql(f.ate + ' 23:59')}`); if (f.pai) c.push(`parent = ${f.pai}`);
  return c.join(' AND ') + ' ORDER BY updated DESC';
}
