/** Testa de verdade o servidor MCP do Prumo com o cliente escolhido e devolve o diagnóstico. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { diagnosticarIntegracao } from './diagnosticarIntegracao.js';
import { testarProtocolo } from './testarProtocolo.js';
import { clientes } from '../tipos/integracaoIa.js';
import { projetoVinculado } from '../../projetos/servicoProjetos.js';

export async function testarIntegracao(raiz:string, client:typeof clientes[number]) {
  const p=await projetoVinculado(raiz,diretorioDados());
  await testarProtocolo(p,client);
  return diagnosticarIntegracao(p,client);
}
