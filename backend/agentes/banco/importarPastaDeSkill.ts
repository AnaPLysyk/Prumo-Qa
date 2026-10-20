/** Importa uma pasta de Skill aberta (por exemplo um repositório já clonado) como rascunhos de uma especialização, com fonte e licença. Nada é baixado da internet. */
import fs from 'node:fs';
import path from 'node:path';
import { lerPastaDeSkill } from './lerPastaDeSkill.js';
import { registrarTrechosDeSkill } from './registrarTrechosDeSkill.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { dividirSkillEmTrechos } from '../regras/dividirSkillEmTrechos.js';
import { licencaAberta } from '../regras/licencaAberta.js';
import { NovoTrecho } from '../tipos/skills.js';
import { falharCom } from '../../compartilhado/erros.js';

/**
 * Regras: só com licença aberta reconhecida (no SKILL.md ou num LICENSE da pasta ou de até duas pastas acima);
 * cada trecho guarda de onde veio e a licença; tudo nasce RASCUNHO e só vai para o prompt depois que a pessoa aprovar.
 */
export function importarPastaDeSkill(pasta: string, especializacao: string, fonte: string | null, base?: string) {
  validarEspecializacao(especializacao);
  const arquivos = lerPastaDeSkill(pasta);
  const skill = arquivos.find((a) => a.relativo === 'SKILL.md')!;
  const campo = /^---\r?\n[\s\S]*?^license:\s*(.+)$/m.exec(skill.conteudo)?.[1] ?? null;
  const licenca = licencaAberta(campo, textoDaLicenca(pasta));
  if (!licenca) falharCom('SKILL_LICENSE_NOT_ALLOWED');
  const origem = (fonte ?? '').trim() || path.basename(pasta);
  const novos: NovoTrecho[] = arquivos.flatMap((a) => dividirSkillEmTrechos(a.conteudo).map((p) => ({
    especializacao, titulo: p.titulo, texto: p.texto, ordem: 2000 + p.ordem, origem: 'IMPORTADO' as const, fonte: `${origem}/${a.relativo}`, licenca })));
  if (!novos.length) falharCom('SKILL_TEXT_REQUIRED');
  const r = registrarTrechosDeSkill(novos, base);
  return { licenca, fonte: origem, importados: r.filter((x) => !x.duplicado).length, duplicados: r.filter((x) => x.duplicado).length, estado: 'RASCUNHO' as const };
}

/** Procura LICENSE, LICENSE.md ou LICENSE.txt na pasta e em até duas pastas acima (repositórios guardam a licença na raiz). */
function textoDaLicenca(pasta: string): string | null {
  let atual = path.resolve(pasta);
  for (let nivel = 0; nivel < 3; nivel++) {
    for (const nome of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
      const alvo = path.join(atual, nome);
      try { const st = fs.lstatSync(alvo); if (st.isFile() && !st.isSymbolicLink() && st.size < 65536) return fs.readFileSync(alvo, 'utf8'); } catch { /* sem este arquivo */ }
    }
    const acima = path.dirname(atual); if (acima === atual) break; atual = acima;
  }
  return null;
}
