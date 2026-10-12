/** Testa de verdade o servidor MCP do Prumo com o cliente escolhido e devolve o diagnóstico. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { diagnosticarIntegracao } from './diagnosticarIntegracao.js';
import { testarProtocolo } from './testarProtocolo.js';
import { clientes } from '../tipos/integracaoIa.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';

export async function testarIntegracao(raiz:string, client:typeof clientes[number]) {
  const p=await projetoVinculado(raiz,pastaDeDadosEscolhida());
  await testarProtocolo(p,client);
  return diagnosticarIntegracao(p,client);
}
