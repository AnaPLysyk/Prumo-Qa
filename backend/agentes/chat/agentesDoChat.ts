/** Lista os agentes do chat com especialização, capacidades e o que estão autorizados a fazer neste projeto. */
import { matrizDePoliticas } from '../politicas/matrizDePoliticas.js';
import { agentesChat } from '../tipos/persona.js';
import { especializacoes } from '../tipos/politicas.js';
import { regrasDosAgentes } from '../../administracao/regras/agentesDaPlataforma.js';

/** Retrato do roster para a interface: agentes do chat ligados às especializações e às políticas do projeto. */
export function agentesDoChat(espacoId: string | null, base?: string) {
  const matriz = espacoId ? matrizDePoliticas(espacoId, base) : [];
  const desligados = regrasDosAgentes(base).desligados;
  return agentesChat.filter((a) => a.id === 'orquestrador' || !desligados.includes(a.id)).map((a) => ({ id: a.id, nome: a.nome, dominio: a.dominio, profissao: a.profissao, especialidade: a.especialidade, especializacao: a.especializacao, aba: a.aba,
    // Vocabulário de roteamento (sem os marcadores internos ! e ~), para o Cérebro mostrar o que leva a pergunta a este agente.
    palavras: a.palavras.map((k) => k.replace(/^!/, '').replace('~', '')),
    skill: a.especializacao ? especializacoes.find((s) => s.id === a.especializacao)?.skill ?? null : null,
    capacidades: a.especializacao ? (especializacoes.find((s) => s.id === a.especializacao)?.capacidades ?? []).map((c) => ({ id: c, estado: matriz.find((m) => m.id === c)?.estado ?? null })) : [] }));
}
