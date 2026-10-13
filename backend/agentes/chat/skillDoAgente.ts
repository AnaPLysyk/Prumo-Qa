/** Lê integralmente apenas a Skill cadastrada da especialização, com limite em bytes. */
import fs from 'node:fs';
import path from 'node:path';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';
import { especializacoes } from '../tipos/politicas.js';

export class SkillUnavailable extends Error {
  readonly code = 'SKILL_UNAVAILABLE';
  constructor() { super('SKILL_UNAVAILABLE: instruções da especialização indisponíveis; resposta local.'); this.name = 'SkillUnavailable'; }
}

export function skillDoAgente(especializacao: string | null): string {
  const item = especializacoes.find(e => e.id === (especializacao ?? 'qa-geral'));
  if (!item) throw new SkillUnavailable();
  const limite = 64 * 1024;
  let arquivo: number | undefined;
  try {
    arquivo = fs.openSync(path.join(raizDoAplicativo, item.skill, 'SKILL.md'), 'r');
    const info = fs.fstatSync(arquivo);
    if (!info.isFile() || info.size === 0 || info.size > limite) throw new SkillUnavailable();
    const bytes = Buffer.alloc(limite + 1);
    let total = 0;
    while (total < bytes.length) {
      const lidos = fs.readSync(arquivo, bytes, total, bytes.length - total, null);
      if (!lidos) break;
      total += lidos;
    }
    if (!total || total > limite) throw new SkillUnavailable();
    return bytes.subarray(0, total).toString('utf8');
  } catch { throw new SkillUnavailable(); }
  finally {
    if (arquivo !== undefined) {
      try { fs.closeSync(arquivo); } catch { throw new SkillUnavailable(); }
    }
  }
}
