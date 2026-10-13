/** Monta a resposta de um agente com fontes, ações e segredos mascarados. */
import { AgenteChat } from '../tipos/persona.js';
import { Coleta, Estilo, Resposta } from '../tipos/chat.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

export function montarResposta(agente: AgenteChat, c: Coleta, modo: Resposta['modo'], estilo: Estilo, pessoa: string | null, extra: Partial<Resposta> & { rota?: Resposta['rota'] } = {}): Resposta {
  return ({ agente: { id: agente.id, nome: agente.nome, especializacao: agente.especializacao },
    linhas: c.linhas.map((l) => mascarar(l)), fontes: c.fontes, modo, estilo, rota: extra.rota ?? [], fatos: c.fatos, proximos: extra.proximos ?? [], acoes: extra.acoes ?? [], pendente: extra.pendente ?? null, pessoa: extra.pessoa !== undefined ? extra.pessoa : pessoa, continuou: extra.continuou ?? false, ...(extra.aviso ? { aviso: extra.aviso } : {}), ...(extra.orquestracao ? { orquestracao: extra.orquestracao } : {}) });
}
