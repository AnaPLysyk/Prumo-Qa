/** Lista os trechos de Skill por especialização, estado e busca; rascunhos primeiro, depois na ordem de leitura. */
import { comBancoDeSkills, linhaParaTrecho } from './comBancoDeSkills.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { EstadoTrecho, TrechoDeSkill, estadosTrecho, limitesSkills } from '../tipos/skills.js';
import { semAcentos } from '../../compartilhado/texto.js';

export function listarTrechosDeSkill(f: { especializacao?: string | null; estados?: EstadoTrecho[]; busca?: string }, base?: string): TrechoDeSkill[] {
  const esp = f.especializacao ? validarEspecializacao(f.especializacao) : null;
  const estados = (f.estados?.length ? f.estados : [...estadosTrecho]).filter((e) => estadosTrecho.includes(e));
  return comBancoDeSkills(base, (db) => {
    const cond = [`estado IN (${estados.map(() => '?').join(',')})`]; const params: string[] = [...estados];
    if (esp) { cond.push('especializacao = ?'); params.push(esp); }
    const linhas = db.prepare(`SELECT * FROM trechos WHERE ${cond.join(' AND ')}
      ORDER BY CASE estado WHEN 'RASCUNHO' THEN 0 WHEN 'APROVADO' THEN 1 ELSE 2 END, especializacao,
        CASE origem WHEN 'PRUMO' THEN 0 WHEN 'PESSOA' THEN 1 WHEN 'IMPORTADO' THEN 2 ELSE 3 END, fonte, ordem`).all(...params) as Record<string, unknown>[];
    const b = f.busca ? semAcentos(f.busca) : '';
    return linhas.map(linhaParaTrecho).filter((t) => !b || semAcentos(t.titulo + ' ' + t.texto).includes(b)).slice(0, limitesSkills.porConsulta);
  });
}
