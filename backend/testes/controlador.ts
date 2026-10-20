/** Controlador da funcionalidade testes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { listarExecucoes } from "./regras/listarExecucoes.js";
import { listarEvidenciasDoProjeto } from "./regras/listarEvidenciasDoProjeto.js";
import { mapaDeVinculos } from "./regras/mapaDeVinculos.js";

export const execucoesListar: TratadorDoCanal<'execucoes:listar'> = a => listarExecucoes(a.filtro);

export const projetoEvidencias: TratadorDoCanal<'projeto:evidencias'> = a => listarEvidenciasDoProjeto(a.root, a.jobId);

export const vinculosMapa: TratadorDoCanal<'vinculos:mapa'> = a => mapaDeVinculos(a.espacoId);
