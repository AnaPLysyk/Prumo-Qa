/** Orquestra uma pergunta entre especialistas: delega uma etapa a cada agente, registra tempo, fontes e falhas e junta as respostas. */
import { randomUUID } from 'node:crypto';
import { responderComDadosLocais } from './responderComDadosLocais.js';
import { Coleta } from '../tipos/chat.js';
import { EtapaDaOrquestracao, Orquestracao } from '../tipos/orquestracao.js';
import { AgenteChat } from '../tipos/persona.js';
import { Fonte } from '../../inicio/contratos.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

type Responder = typeof responderComDadosLocais;

/**
 * Cada etapa roda mesmo que a anterior falhe: a falha fica registrada (FALHOU, com o motivo mascarado) e entra na resposta.
 * O registro guarda só metadados; a pergunta e as respostas não são gravadas.
 */
export async function orquestrar(agentes: AgenteChat[], motivo: { agente: string; pontos: number }[], pergunta: string, espacoId: string | null, base?: string, responder: Responder = responderComDadosLocais, agora: () => Date = () => new Date()): Promise<{ coleta: Coleta; registro: Orquestracao }> {
  const inicio = agora(); const etapas: EtapaDaOrquestracao[] = []; const partes: string[] = []; const fontes: Fonte[] = []; const fatos: string[] = [];
  for (const [i, agente] of agentes.entries()) {
    const t0 = agora();
    try {
      const r = await responder(agente, pergunta, espacoId, base);
      const fim = agora(); const vazio = !!r.vazio;
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: vazio ? 'SEM_DADOS' : 'CONCLUIDA', fontes: r.fontes.map((f) => f.rotulo).slice(0, 10), fatos: r.fatos.slice(0, 20), linhas: r.linhas.length });
      partes.push(`${agente.nome}: ${vazio ? 'não encontrou dados sobre isso neste projeto.' : r.linhas.slice(0, 2).join(' ')}`);
      for (const f of r.fontes) if (!fontes.some((x) => x.aba === f.aba)) fontes.push(f);
      fatos.push(...r.fatos.map((f) => `${agente.id}:${f}`));
    } catch (e) {
      const fim = agora(); const erro = mascarar(String((e as Error)?.message ?? e)).slice(0, 200);
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: 'FALHOU', fontes: [], fatos: [], linhas: 0, erro });
      partes.push(`${agente.nome}: não consegui consultar agora (${erro}).`);
    }
  }
  const concluidas = etapas.filter((e) => e.estado === 'CONCLUIDA').length; const fim = agora();
  const registro: Orquestracao = {
    id: randomUUID(), em: inicio.toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL', motivo: motivo.slice(0, 6), agentes: agentes.map((a) => a.id),
    dependencias: 'INDEPENDENTES', etapas, estado: concluidas === etapas.length ? 'CONCLUIDA' : concluidas ? 'PARCIAL' : 'FALHOU', duracaoMs: fim.getTime() - inicio.getTime()
  };
  const coleta: Coleta = { linhas: [`Consultei ${agentes.length} especialistas, um de cada vez:`, ...partes], fontes, fatos, generico: false, vazio: concluidas === 0 };
  return { coleta, registro };
}
