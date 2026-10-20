/** Lê e atualiza as políticas de capacidades dos agentes por projeto. */
import { lerConfiguracaoDosAgentes } from "./banco/lerConfiguracaoDosAgentes.js";
import { Configuracao, idsEsp, EstadoCapacidade, capacidades, registro } from "./tipos/politicas.js";
import { especializacaoLigada } from "../administracao/servico.js";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { obterEspaco } from "../projetos/banco/projetos.js";

/** Sem configuração salva vale o padrão: todas as especializações habilitadas e as políticas padrão (comportamento anterior à 2.9). */
export function configuracaoDoEspaco(espacoId: string, b?: string): Configuracao {
  const i = lerConfiguracaoDosAgentes(b).itens.find(x => x.espacoId === espacoId);
  // Administração: especialização desligada na plataforma fica fora em todos os projetos, inclusive no MCP.
  return i ? { especializacoes: i.especializacoes.filter(e => idsEsp.includes(e as never) && especializacaoLigada(e, b)), politicas: i.politicas, padrao: false } : { especializacoes: idsEsp.filter(e => especializacaoLigada(e, b)), politicas: {}, padrao: true };
}

export function salvarConfiguracao(espacoId: string, c: { especializacoes: string[]; politicas: Record<string, string> }, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const esp = [...new Set(c.especializacoes)]; if (esp.some(e => !idsEsp.includes(e as never))) throw new Error('AGENT_SPECIALIZATION_UNKNOWN');
  const pol: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'> = {};
  for (const [cap, estado] of Object.entries(c.politicas)) { const d = capacidades.find(x => x.id === cap); if (!d) throw new Error('AGENT_CAPABILITY_UNKNOWN'); if (!d.editavel.includes(estado as EstadoCapacidade)) throw new Error('AGENT_POLICY_NOT_ALLOWED: ' + cap + ' não aceita ' + estado); pol[cap] = estado as 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'; }
  const r = lerConfiguracaoDosAgentes(b); r.itens = r.itens.filter(i => i.espacoId !== espacoId); r.itens.push({ espacoId, especializacoes: esp, politicas: pol, alteradoEm: agora.toISOString(), por: por.slice(0, 200) });
  gravarLocal('agentes.json', registro.parse(r), b); return configuracaoDoEspaco(espacoId, b);
}
