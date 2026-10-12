/** Canal assistente:conversar: Rotear a pergunta do chat para um agente local e responder com dados deste computador; opcionalmente delegar ao Claude Code/Codex já autorizado. */
import { registrarAtendimento } from '../banco/registrarAtendimento.js';
import { conversar } from '../chat/conversar.js';
import { executarCliDeIa } from '../chat/executarCliDeIa.js';
import { executavelDaIa } from '../chat/executavelDaIa.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';

export const assistenteConversar: TratadorDoCanal<'assistente:conversar'> = async a => {
  const ia = lerPreferencias().ia;
  const r = await conversar({ espacoId: a.espacoId, pergunta: a.pergunta, agente: a.agente ?? null, provedor: a.provedor ?? 'local', primeira: a.primeira, historico: a.historico, contexto: a.contexto ?? null, estilo: ia.estilo, nome: ia.nome, autorizados: ia.delegacao, executavel: executavelDaIa, executor: executarCliDeIa });
  // 2.10: a conversa NÃO é gravada; fica só o atendimento (agente, modo e fontes, sem pergunta nem resposta).
  let atendimentoId: number | null = null; try { atendimentoId = registrarAtendimento({ espacoId: a.espacoId, agente: r.agente.id, modo: r.modo, fontes: r.fontes.map(f => f.rotulo) }); } catch { atendimentoId = null; r.aviso = [r.aviso, 'Não foi possível registrar o atendimento; a avaliação desta resposta está indisponível.'].filter(Boolean).join(' '); }
  return { ...r, assistente: ia.nome, atendimentoId };
};
