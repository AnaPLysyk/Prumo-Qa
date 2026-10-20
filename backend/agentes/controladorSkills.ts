/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { registrarTrechosDeSkill } from "./banco/skills.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { decidirTrechoDeSkill } from "./banco/skills.js";
import { dialog } from "electron";
import { importarPastaDeSkill } from "./banco/importarPastaDeSkill.js";
import { validarEspecializacao } from "./regras/regrasDasSkills.js";
import { listarTrechosDeSkill } from "./banco/skills.js";

export const skillsCriar: TratadorDoCanal<'skills:criar'> = a => registrarTrechosDeSkill([{ especializacao: a.especializacao, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' }])[0];

export const skillsDecidir: TratadorDoCanal<'skills:decidir'> = a => decidirTrechoDeSkill(a.id, a.estado);

// A pasta vem do diálogo do sistema, nunca do renderer. Nada é baixado: a pessoa escolhe uma pasta já presente no computador.
export const skillsImportar: TratadorDoCanal<'skills:importar'> = async (a, j) => {
  validarEspecializacao(a.especializacao);
  const opcoes = { title: 'Pasta da Skill (com SKILL.md e licença aberta)', properties: ['openDirectory' as const] };
  const r = j ? await dialog.showOpenDialog(j, opcoes) : await dialog.showOpenDialog(opcoes);
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return importarPastaDeSkill(r.filePaths[0], a.especializacao, a.fonte ?? null);
};

export const skillsListar: TratadorDoCanal<'skills:listar'> = a => listarTrechosDeSkill({ especializacao: a.especializacao ?? null, estados: a.estados, busca: a.busca });
