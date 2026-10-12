/** Lê a Skill (instruções de QA) da especialização do agente para enviar à IA externa. */
import fs from 'node:fs';
import path from 'node:path';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

export function skillDoAgente(especializacao: string | null) {
  const pasta = especializacao === 'qa-geral' || !especializacao ? 'qa' : especializacao;
  try { return fs.readFileSync(path.join(raizDoAplicativo, 'skills', pasta, 'SKILL.md'), 'utf8').slice(0, 6000); } catch { return ''; }
}
