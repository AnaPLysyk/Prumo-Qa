/** Trechos das Skills que acompanham o aplicativo (pasta skills/), já divididos e com identificador estável pelo conteúdo. */
import path from 'node:path';
import { lerPastaDeSkill } from './lerPastaDeSkill.js';
import { dividirSkillEmTrechos } from '../regras/dividirSkillEmTrechos.js';
import { TrechoDeSkill } from '../tipos/skills.js';
import { especializacoes } from '../tipos/politicas.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';
import { hash } from '../../compartilhado/seguranca/hash.js';

let guardada: TrechoDeSkill[] | null = null;

/** Lida uma vez por processo: os arquivos só mudam com uma nova versão do aplicativo. Uma Skill ilegível fica de fora. */
export function sementeDasSkills(raiz: string = raizDoAplicativo): TrechoDeSkill[] {
  if (guardada && raiz === raizDoAplicativo) return guardada;
  const trechos: TrechoDeSkill[] = []; const em = '1970-01-01T00:00:00.000Z';
  for (const e of especializacoes) {
    let arquivos;
    try { arquivos = lerPastaDeSkill(path.join(raiz, e.skill)); } catch { continue; }
    for (const a of arquivos) {
      const fonte = `${e.skill}/${a.relativo}`;
      for (const p of dividirSkillEmTrechos(a.conteudo)) {
        const id = `prumo:${e.id}:${hash(`${fonte}\n${p.ordem}\n${p.titulo}\n${p.texto}`).slice(0, 12)}`;
        trechos.push({ id, especializacao: e.id, titulo: p.titulo, texto: p.texto, ordem: p.ordem, origem: 'PRUMO', estado: 'APROVADO', fonte, licenca: null, criadoEm: em, decididoEm: em });
      }
    }
  }
  if (raiz === raizDoAplicativo) guardada = trechos;
  return trechos;
}
