/** Salva as especializações habilitadas e as capacidades bloqueadas da IA neste projeto. */
import { lerConfiguracaoDosAgentes } from '../banco/lerConfiguracaoDosAgentes.js';
import { configuracaoDoEspaco } from './configuracaoDoEspaco.js';
import { EstadoCapacidade, capacidades, idsEsp, registro } from '../tipos/politicas.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { obterEspaco } from '../../projetos/repositorio.js';

export function salvarConfiguracao(espacoId: string, c: { especializacoes: string[]; politicas: Record<string, string> }, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const esp = [...new Set(c.especializacoes)]; if (esp.some(e => !idsEsp.includes(e as never))) throw new Error('AGENT_SPECIALIZATION_UNKNOWN');
  const pol: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'> = {};
  for (const [cap, estado] of Object.entries(c.politicas)) { const d = capacidades.find(x => x.id === cap); if (!d) throw new Error('AGENT_CAPABILITY_UNKNOWN'); if (!d.editavel.includes(estado as EstadoCapacidade)) throw new Error('AGENT_POLICY_NOT_ALLOWED: ' + cap + ' não aceita ' + estado); pol[cap] = estado as 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'; }
  const r = lerConfiguracaoDosAgentes(b); r.itens = r.itens.filter(i => i.espacoId !== espacoId); r.itens.push({ espacoId, especializacoes: esp, politicas: pol, alteradoEm: agora.toISOString(), por: por.slice(0, 200) });
  gravarLocal('agentes.json', registro.parse(r), b); return configuracaoDoEspaco(espacoId, b);
}
