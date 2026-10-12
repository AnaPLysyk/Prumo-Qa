/** Cria o servidor MCP do Prumo ligado a um projeto: as oito ferramentas, os roteiros e a política conferida a cada chamada. */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { versaoDoPacote } from '../../compartilhado/versaoDoPacote.js';
import { espacoDaRaiz } from '../../projetos/regras/espacoDaRaiz.js';
import { exigirCapacidade } from '../politicas/exigirCapacidade.js';
import { MeiosDoServidorMcp } from '../tipos/mcp.js';
import { projetoAindaVinculado } from './projetoAindaVinculado.js';
import { registrarConsultarEvidencias } from './registrarConsultarEvidencias.js';
import { registrarContextoProjeto } from './registrarContextoProjeto.js';
import { registrarExecutarValidacao } from './registrarExecutarValidacao.js';
import { registrarListarPoliticas } from './registrarListarPoliticas.js';
import { registrarProporAprendizado } from './registrarProporAprendizado.js';
import { registrarProporBug } from './registrarProporBug.js';
import { registrarProporCaso } from './registrarProporCaso.js';
import { registrarRevisarCobertura } from './registrarRevisarCobertura.js';
import { registrarRoteirosMcp } from './registrarRoteirosMcp.js';
import { respostaDaFerramentaMcp } from './respostaDaFerramentaMcp.js';
import { transporteObservado } from './transporteObservado.js';

export async function criarServidor(raiz: string, contratoLeitura?: string) {
  const vinculo = await carregarProjeto(raiz, contratoLeitura); // configuração local, nunca da tool
  const servidor = new McpServer({ name: 'prumo-qa', version: versaoDoPacote });
  const cliente = () => servidor.server.getClientVersion()?.name;
  const conectar = servidor.connect.bind(servidor);
  servidor.connect = t => conectar(transporteObservado(t, vinculo, cliente));
  const espaco = () => espacoDaRaiz(raiz);
  // 2.9: a política do projeto (especializações e capacidades) é conferida AQUI, no backend, a cada chamada.
  const m: MeiosDoServidorMcp = {
    servidor, espaco, cliente,
    projeto: () => projetoAindaVinculado(raiz, vinculo, contratoLeitura),
    resposta: respostaDaFerramentaMcp,
    guarda: (capacidade, fn) => respostaDaFerramentaMcp(async () => { exigirCapacidade(espaco()?.id ?? null, capacidade); return fn(); }),
  };
  registrarContextoProjeto(m); registrarRevisarCobertura(m); registrarExecutarValidacao(m); registrarConsultarEvidencias(m);
  registrarListarPoliticas(m); registrarProporCaso(m); registrarProporBug(m); registrarProporAprendizado(m);
  registrarRoteirosMcp(m);
  return servidor;
}
