/** Lê uma pasta de Skill (SKILL.md e references/*.md) sem seguir atalhos, sem binários e com limite de tamanho por arquivo. */
import fs from 'node:fs';
import path from 'node:path';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { limitesSkills } from '../tipos/skills.js';

/** Um arquivo da Skill: caminho relativo à pasta (com /) e conteúdo em texto. */
export type ArquivoDaSkill = { relativo: string; conteudo: string };

export function lerPastaDeSkill(pasta: string): ArquivoDaSkill[] {
  const arquivos: ArquivoDaSkill[] = [];
  const ler = (relativo: string, obrigatorio: boolean) => {
    const alvo = path.join(pasta, relativo);
    let st: fs.Stats;
    try { st = fs.lstatSync(alvo); } catch { if (obrigatorio) falharCom('SKILL_FILE_MISSING'); return; }
    if (st.isSymbolicLink() || !st.isFile()) falharCom('SKILL_FILE_INVALID');
    if (st.size > limitesSkills.arquivo) falharCom('SKILL_FILE_TOO_LARGE');
    const bytes = fs.readFileSync(alvo);
    if (bytes.includes(0)) falharCom('SKILL_FILE_INVALID');
    arquivos.push({ relativo: relativo.split(path.sep).join('/'), conteudo: bytes.toString('utf8') });
  };
  let raiz: fs.Stats;
  try { raiz = fs.lstatSync(pasta); } catch { falharCom('SKILL_FILE_MISSING'); }
  if (raiz.isSymbolicLink() || !raiz.isDirectory()) falharCom('SKILL_FILE_INVALID');
  ler('SKILL.md', true);
  const referencias = path.join(pasta, 'references');
  let nomes: string[] = [];
  try { if (!fs.lstatSync(referencias).isSymbolicLink()) nomes = fs.readdirSync(referencias).filter((n) => n.endsWith('.md')).sort(); } catch { nomes = []; }
  for (const nome of nomes.slice(0, 20)) ler(path.join('references', nome), false);
  return arquivos;
}
