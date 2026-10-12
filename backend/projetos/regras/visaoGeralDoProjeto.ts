/** Monta a visão geral de um projeto: contrato, capacidades, métricas e a última chamada de IA observada. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { consultarAtividades } from '../../logs/banco/consultarAtividades.js';
import { calcularMetricas } from '../../metricas/regras/calcularMetricas.js';
import { projetoVinculado } from './projetoVinculado.js';

export async function visaoGeralDoProjeto(raiz: string) {
  const p = await projetoVinculado(raiz, pastaDeDadosEscolhida());
  const h = consultarAtividades(p, pastaDeDadosEscolhida()); const m = calcularMetricas(h);
  const ultimaMcp = h.activities.filter(e => e.origin === 'MCP').at(-1);
  return { project: { id: p.manifesto.id, name: p.manifesto.name, root: p.raiz, capabilities: Object.keys(p.manifesto.commands), readOnly: p.manifesto.execution.readOnly },
    metrics: m, directory: h.directory, lastMcpClient: ultimaMcp?.client ?? null,
    connection: 'Última chamada observada; o Prumo não comprova sessão ativa nem a identidade real do cliente.' };
}
