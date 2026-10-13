/** Canal skills:importar: Importar uma pasta de Skill aberta (com SKILL.md e licença) como rascunhos de uma especialização. */
import { dialog } from 'electron';
import { importarPastaDeSkill } from '../banco/importarPastaDeSkill.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

// A pasta vem do diálogo do sistema, nunca do renderer. Nada é baixado: a pessoa escolhe uma pasta já presente no computador.
export const skillsImportar: TratadorDoCanal<'skills:importar'> = async (a, j) => {
  validarEspecializacao(a.especializacao);
  const opcoes = { title: 'Pasta da Skill (com SKILL.md e licença aberta)', properties: ['openDirectory' as const] };
  const r = j ? await dialog.showOpenDialog(j, opcoes) : await dialog.showOpenDialog(opcoes);
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return importarPastaDeSkill(r.filePaths[0], a.especializacao, a.fonte ?? null);
};
