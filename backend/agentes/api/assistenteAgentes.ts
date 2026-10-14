/** Canal assistente:agentes: Listar os agentes do chat, suas especializações, capacidades e a disponibilidade de Claude Code/Codex. */
import { agentesDoChat } from '../chat/agentesDoChat.js';
import { executavelDaIa } from '../chat/executavelDaIa.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { localizarClienteDeIa } from '../../conexoes/ia/localizarClienteDeIa.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';
import { regrasDosAgentes } from '../../administracao/regras/agentesDaPlataforma.js';

export const assistenteAgentes: TratadorDoCanal<'assistente:agentes'> = a => { const ia = lerPreferencias().ia; return { agentes: agentesDoChat(a.espacoId), assistente: { nome: ia.nome, estilo: ia.estilo }, provedores: (['claude', 'codex'] as const).map(p => { const l = localizarClienteDeIa(p); return { id: p, encontrado: !!l, atalho: !!l?.shim, disponivel: regrasDosAgentes().iaExterna && !!executavelDaIa(p), autorizado: ia.delegacao[p], desligadaPelaAdministracao: !regrasDosAgentes().iaExterna }; }) }; };
