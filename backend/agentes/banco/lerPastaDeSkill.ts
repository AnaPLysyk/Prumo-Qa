/** lerPastaDeSkill: fluxo completo por responsabilidade. */
import fs from "node:fs";
import path from "node:path";
import { falharCom } from "../../compartilhado/erros.js";
import { limitesSkills, TrechoDeSkill } from "../tipos/conhecimento.js";
import { dividirSkillEmTrechos } from "../regras/regrasDasSkills.js";
import { especializacoes } from "../tipos/persona.js";
import { raizDoAplicativo } from "../../compartilhado/raizDoAplicativo.js";
import { hash } from "../../compartilhado/seguranca/hash.js";

// lerPastaDeSkill
/** Um arquivo da Skill: caminho relativo à pasta (com /) e conteúdo em texto. */
type ArquivoDaSkill = { relativo: string; conteudo: string };

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

// sementeDasSkills
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
