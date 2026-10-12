/** Mostra, para Codex e Claude, se o servidor MCP do Prumo está configurado e o comando proposto para configurar. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { diagnosticarIntegracao } from './diagnosticarIntegracao.js';
import { prepararConexao } from './prepararConexao.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';

/** Propõe a configuração; nada é alterado aqui. */
export async function situacaoDasConexoesDeIa(raiz: string) {
  const p = await projetoVinculado(raiz, pastaDeDadosEscolhida());
  return (['codex', 'claude'] as const).map(c => { const x = prepararConexao(p, c); const d=diagnosticarIntegracao(p,c); return { ...d, name: x.name, installed: x.installed, destination: x.destination, command: x.command, configuration:x.configuration, notice:x.notice+' '+d.notice, automatic: c === 'codex' && x.installed && !x.manualOnly }; });
}
