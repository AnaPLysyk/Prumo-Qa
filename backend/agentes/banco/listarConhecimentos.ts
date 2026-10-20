/** Lista os conhecimentos por projeto, agente, estado e busca. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { linhaParaConhecimento } from './formatosDoConhecimento.js';
import { validarAgenteDoConhecimento } from './validacoesDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validacoesDoConhecimento.js';
import { Conhecimento, Filtro, Linha, estadosConhecimento, limitesConhecimento } from '../tipos/conhecimento.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

/** Escopo: conhecimentos gerais (sem projeto) e os do projeto informado; nunca os de outro projeto. Sem agente: todos. */
export function listarConhecimentos(f: Filtro, base?: string): Conhecimento[] {
  const espacoId = validarProjetoDoConhecimento(f.espacoId); const agente = validarAgenteDoConhecimento(f.agente); const estados = (f.estados?.length ? f.estados : [...estadosConhecimento]).filter((e) => estadosConhecimento.includes(e));
  const lim = Math.max(1, Math.min(limitesConhecimento.porConsulta, f.limite ?? limitesConhecimento.porConsulta));
  return comBancoDeConhecimento(base, (db) => {
    const cond = ['(espaco_id IS NULL' + (espacoId ? ' OR espaco_id = ?)' : ')'), `estado IN (${estados.map(() => '?').join(',')})`]; const params: (string | number)[] = [...(espacoId ? [espacoId] : []), ...estados];
    if (agente) { cond.push(f.somenteDoAgente ? 'agente_id = ?' : '(agente_id = ? OR agente_id IS NULL)'); params.push(agente); }
    const linhas = db.prepare(`SELECT * FROM conhecimentos WHERE ${cond.join(' AND ')} ORDER BY CASE estado WHEN 'RASCUNHO' THEN 0 WHEN 'APROVADO' THEN 1 ELSE 2 END, criado_em DESC LIMIT ${f.busca ? limitesConhecimento.itens : lim}`).all(...params) as Linha[];
    const b = f.busca ? semAcentos(f.busca) : ''; return linhas.map(linhaParaConhecimento).filter((c) => !b || semAcentos(c.titulo + ' ' + c.texto).includes(b)).slice(0, lim);
  });
}
