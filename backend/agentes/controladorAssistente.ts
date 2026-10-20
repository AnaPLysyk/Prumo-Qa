/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { agentesDoChat } from "./chat/selecaoDoAgente.js";
import { executavelDaIa } from "./chat/execucaoCli.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { localizarClienteDeIa } from "../conexoes/ia/localizarClienteDeIa.js";
import { lerPreferencias } from "../configuracoes/banco/configuracoes.js";
import { regrasDosAgentes } from "../administracao/servico.js";
import { aprenderTermos } from "./banco/aprendizados.js";
import { avaliarAtendimento } from "./banco/atendimentos.js";
import { registrarAtendimento } from "./banco/atendimentos.js";
import { conversar } from "./chat/conversar.js";
import { executarCliDeIa } from "./chat/execucaoCli.js";
import { listarAtendimentos } from "./banco/atendimentos.js";

export const assistenteAgentes: TratadorDoCanal<'assistente:agentes'> = a => { const ia = lerPreferencias().ia; return { agentes: agentesDoChat(a.espacoId), assistente: { nome: ia.nome, estilo: ia.estilo }, provedores: (['claude', 'codex'] as const).map(p => { const l = localizarClienteDeIa(p); return { id: p, encontrado: !!l, atalho: !!l?.shim, disponivel: regrasDosAgentes().iaExterna && !!executavelDaIa(p), autorizado: ia.delegacao[p], desligadaPelaAdministracao: !regrasDosAgentes().iaExterna }; }) }; };

// Avaliar uma resposta. Corrigir o agente ensina só os termos da pergunta ao agente certo (a pergunta não é gravada).
export const assistenteAvaliar: TratadorDoCanal<'assistente:avaliar'> = a => { const r = avaliarAtendimento(a.id, a.avaliacao); const termos = a.avaliacao === 'NAO_UTIL' && a.agenteCorreto && a.pergunta ? aprenderTermos(a.agenteCorreto, a.pergunta).termos : []; return { ...r, termos }; };

export const assistenteConversar: TratadorDoCanal<'assistente:conversar'> = async a => {
  const ia = lerPreferencias().ia;
  const r = await conversar({ espacoId: a.espacoId, pergunta: a.pergunta, agente: a.agente ?? null, provedor: a.provedor ?? 'local', primeira: a.primeira, historico: a.historico, contexto: a.contexto ?? null, estilo: ia.estilo, nome: ia.nome, autorizados: ia.delegacao, executavel: executavelDaIa, executor: executarCliDeIa });
  // A conversa não é gravada; fica só o atendimento (agente, modo e fontes, sem pergunta nem resposta).
  let atendimentoId: number | null = null; try { atendimentoId = registrarAtendimento({ espacoId: a.espacoId, agente: r.agente.id, modo: r.modo, fontes: r.fontes.map(f => f.rotulo) }); } catch { atendimentoId = null; r.aviso = [r.aviso, 'Não foi possível registrar o atendimento; a avaliação desta resposta está indisponível.'].filter(Boolean).join(' '); }
  return { ...r, assistente: ia.nome, atendimentoId };
};

// As conversas com texto gravadas até a 2.9 são de antes do login, sem dono: ficam no disco e não aparecem para ninguém.
export const conversasListar: TratadorDoCanal<'conversas:listar'> = a => { let atend: ReturnType<typeof listarAtendimentos> = []; try { atend = listarAtendimentos(a.espacoId, a.agente, 40); } catch { atend = []; }
  return [...atend.map(x => ({ id: 'atendimento-' + x.id, em: x.em, agente: x.agente, pergunta: '', linhas: [] as string[], fontes: x.fontes.map(f => ({ rotulo: f, aba: '' })), modo: x.modo, estilo: 'amigavel', semTexto: true, avaliacao: x.avaliacao }))]
    .sort((x, y) => y.em.localeCompare(x.em)).slice(0, 40); };
