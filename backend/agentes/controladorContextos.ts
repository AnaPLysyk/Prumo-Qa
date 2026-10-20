/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { aprovarContextoDaPasta } from "./regras/cicloDosContextos.js";
import { obterContextoDaPasta, desatualizarContextoDaPasta, excluirContextoDaPasta, permitirContextosNoMcp } from "./regras/cicloDosContextos.js";
import { conflitoDeContextoDaPasta } from "./regras/cicloDosContextos.js";
import { listarContextosDaPasta } from "./regras/consultasDeContextos.js";
import { salvarContextoDaPasta } from "./regras/cicloDosContextos.js";

export const contextosAprovar: TratadorDoCanal<'contextos:aprovar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Aprovar contexto', `Aprovar "${c.titulo}" (versão ${c.versao})?`, `Você confirma que este conteúdo é uma regra válida, na origem informada: ${c.origem.referencia || '(sem origem)'}.\nA aprovação vale só para este texto exato; qualquer edição volta o contexto a rascunho. Aprovador registrado: ${usuarioDoWindows()}.`, 'Aprovar'))) return { canceled: true };
  return { canceled: false, contexto: await aprovarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};

export const contextosConflito: TratadorDoCanal<'contextos:conflito'> = async a => conflitoDeContextoDaPasta(a.root, a.id, usuarioDoWindows(), a.outroId);

export const contextosDesatualizar: TratadorDoCanal<'contextos:desatualizar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Marcar como desatualizado', `Marcar "${c.titulo}" como desatualizado?`, 'Um contexto desatualizado deixa de valer, não pode mais ser editado nem aprovado e deixa de ser tratado como regra atual. O histórico é preservado.', 'Marcar desatualizado'))) return { canceled: true };
  return { canceled: false, contexto: await desatualizarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};

export const contextosExcluir: TratadorDoCanal<'contextos:excluir'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Excluir contexto', `Excluir definitivamente "${c.titulo}"?`, 'O contexto e o seu histórico serão apagados; só ficam o identificador, a data e o hash de que ele existiu. O código e os demais arquivos do projeto não são tocados.', 'Excluir'))) return { canceled: true, deleted: false };
  return { canceled: false, ...(await excluirContextoDaPasta(a.root, a.id)) };
};

export const contextosListar: TratadorDoCanal<'contextos:listar'> = a => listarContextosDaPasta(a.root, a.filter);

export const contextosMcp: TratadorDoCanal<'contextos:mcp'> = async (a, janela) => {
  if (a.habilitar && !(await confirmarNoWindows(janela, 'Disponibilizar ao agente de IA', 'Disponibilizar os contextos deste projeto ao agente de IA conectado?', 'O texto dos contextos (até 4000 caracteres cada, com segredos mascarados) passará a ser retornado pelas ferramentas MCP e poderá ser processado pelo provedor da IA conectada. Contextos adulterados nunca são enviados. Você pode desabilitar a qualquer momento.', 'Disponibilizar'))) return { canceled: true };
  return { canceled: false, ...(await permitirContextosNoMcp(a.root, a.habilitar)) };
};

export const contextosObter: TratadorDoCanal<'contextos:obter'> = a => obterContextoDaPasta(a.root, a.id);

export const contextosSalvar: TratadorDoCanal<'contextos:salvar'> = a => salvarContextoDaPasta(a.root, { id: a.id, substituir: a.substituir, dados: a.dados }, usuarioDoWindows());
