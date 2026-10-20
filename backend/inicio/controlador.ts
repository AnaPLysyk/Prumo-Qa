/** Controlador da funcionalidade inicio: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { saudacao } from "../agentes/servicoEstiloDoChat.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { lerPreferencias } from "../configuracoes/servico.js";

export const assistenteAbertura: TratadorDoCanal<'assistente:abertura'> = a => ({ ...saudacao(a.espacoId, lerPreferencias().ia.nome), assistente: lerPreferencias().ia.nome });
