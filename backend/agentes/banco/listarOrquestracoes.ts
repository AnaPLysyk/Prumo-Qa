/** Lista as orquestrações mais recentes de um projeto (ou as gerais), ignorando e contando linhas inválidas. */
import fs from 'node:fs';
import { arquivoDeOrquestracoes } from './registrarOrquestracao.js';
import { Orquestracao, limitesOrquestracao } from '../tipos/orquestracao.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function listarOrquestracoes(espacoId: string | null, base?: string): { orquestracoes: Orquestracao[]; invalidas: number } {
  const alvo = arquivoDeOrquestracoes(base); semLinks(alvo);
  if (!fs.existsSync(alvo)) return { orquestracoes: [], invalidas: 0 };
  let invalidas = 0; const lidas: Orquestracao[] = [];
  for (const l of fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean)) {
    try { const o = JSON.parse(l) as Orquestracao; if (!o || typeof o.id !== 'string' || !Array.isArray(o.etapas) || !Array.isArray(o.agentes)) throw Error(); if (o.espacoId === espacoId) lidas.push(o); }
    catch { invalidas++; }
  }
  return { orquestracoes: lidas.slice(-limitesOrquestracao.porConsulta).reverse(), invalidas };
}
