/** Controlador da funcionalidade administracao: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { excluirPapel, listarPapeis, salvarPapel } from "./servico.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";

export const papeisExcluir: TratadorDoCanal<'papeis:excluir'> = a => excluirPapel(a.id);

export const papeisListar: TratadorDoCanal<'papeis:listar'> = () => listarPapeis();

export const papeisSalvar: TratadorDoCanal<'papeis:salvar'> = a => salvarPapel(a);
