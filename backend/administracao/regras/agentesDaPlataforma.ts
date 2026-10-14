/** Configuração geral dos agentes da plataforma: quais respondem, se a IA externa pode ser usada e se o Orchestrator combina agentes. */
import { contaDaSessao } from './sessao.js';
import { gravarAgentesDaPlataforma } from '../banco/gravarAgentesDaPlataforma.js';
import { lerAgentesDaPlataforma } from '../banco/lerAgentesDaPlataforma.js';
import { AgentesDaPlataforma, agentesDaPlataformaPadrao } from '../tipos/agentesDaPlataforma.js';
import { agentesChat } from '../../agentes/tipos/persona.js';
import { especializacoes } from '../../agentes/tipos/politicas.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';

/** Arquivo ilegível não derruba o chat nem o MCP: vale o padrão e a tela da Administração mostra o problema ao abrir. */
export function regrasDosAgentes(b?: string): AgentesDaPlataforma {
  try { return lerAgentesDaPlataforma(b); } catch { return structuredClone(agentesDaPlataformaPadrao); }
}

/** Especialização ligada na plataforma: agente desligado some do chat e das políticas do MCP em todos os projetos. */
export const especializacaoLigada = (id: string, b?: string) => !regrasDosAgentes(b).desligados.includes(id);

export function agentesDaPlataformaParaJanela(b?: string) {
  const c = lerAgentesDaPlataforma(b);
  return { ...c, agentes: agentesChat.map((a) => ({ id: a.id, nome: a.nome, dominio: a.dominio, profissao: a.profissao, especialidade: a.especialidade, fixo: a.id === 'orquestrador', ligado: a.id === 'orquestrador' || !c.desligados.includes(a.id),
    capacidades: a.especializacao ? [...(especializacoes.find((e) => e.id === a.especializacao)?.capacidades ?? [])] : [] })) };
}

export function salvarAgentesDaPlataforma(d: { desligados: string[]; iaExterna: boolean; orquestracao: boolean }, b?: string, agora = new Date()) {
  const validos = new Set(agentesChat.filter((a) => a.id !== 'orquestrador').map((a) => a.id));
  const desconhecido = d.desligados.find((id) => !validos.has(id)); if (desconhecido) throw new Error('AGENT_UNKNOWN: agente desconhecido ou que não pode ser desligado: ' + desconhecido + '.');
  const conta = contaDaSessao(b);
  gravarAgentesDaPlataforma({ version: 1, desligados: [...new Set(d.desligados)], iaExterna: d.iaExterna, orquestracao: d.orquestracao, alteradoEm: agora.toISOString(), por: conta ? conta.nome + ' (' + conta.login + ')' : usuarioDoWindows() }, b);
  return agentesDaPlataformaParaJanela(b);
}
