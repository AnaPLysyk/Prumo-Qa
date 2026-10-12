/** Junta configuração, teste de protocolo e uso observado num diagnóstico com níveis claros, sem afirmar mais do que foi visto. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { registrosIntegracao } from '../banco/registrosIntegracao.js';
import { assinaturaDaConfiguracao } from './assinaturaDaConfiguracao.js';
import { inspecionarIntegracao } from './inspecionarIntegracao.js';
import { prepararConexao } from './prepararConexao.js';
import { Cliente } from '../tipos/integracaoIa.js';
import { consultarAtividades } from '../../logs/banco/consultarAtividades.js';

export function diagnosticarIntegracao(p: Projeto, client: Cliente) {
  const plano = prepararConexao(p, client); const configuration = inspecionarIntegracao(p, client);
  const h = consultarAtividades(p); const protocolos = registrosIntegracao(p);
  const lastProtocol = protocolos.records.filter(r => r.client === client).at(-1) ?? null;
  const válida = lastProtocol?.manifestHash === p.manifestoHash && lastProtocol.configurationHash === assinaturaDaConfiguracao(plano);
  const chamadas = h.activities.filter(e => e.origin === 'MCP' && e.clientClassificationVersion===2 && e.client === client && e.phase === 'end' && e.state !== 'ERROR' && e.manifestHash === p.manifestoHash);
  const última = chamadas.at(-1);
  const lastObserved = última ? { id: última.operationId, at: última.at, tool: última.tool, durationMs: última.durationMs, state: última.state, contextReferences: última.summary.contextReferences ?? [] } : null;
  const state = configuration.code.endsWith('FAILED') || configuration.code.endsWith('UNAVAILABLE') || protocolos.problems || !h.complete ? 'ERRO'
    : !configuration.found ? 'NAO_CONFIGURADO' : válida && lastProtocol?.state === 'ERRO' ? 'ERRO' : lastObserved ? 'UTILIZADO' : válida && lastProtocol?.state === 'VALIDADO' ? 'VALIDADO' : 'CONFIGURADO';
  return { client, project: p.manifesto.name, state, configuration, inspection:configuration, lastProtocol, protocolCurrent: válida, lastObserved,
    toolsUsed: [...new Set(chamadas.map(e => e.tool))], problems: protocolos.problems + h.problems.length,
    notice: 'O teste SDK comprova o servidor local. Uso observado é a chamada de um cliente com identidade declarada, não autenticada; não comprova sessão ativa nem obediência às referências.' };
}
