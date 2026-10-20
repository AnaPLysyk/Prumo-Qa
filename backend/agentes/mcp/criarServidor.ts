/** Cria o servidor MCP do Prumo ligado a um projeto: as oito ferramentas, os roteiros e a política conferida a cada chamada. */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { versaoDoPacote } from '../../compartilhado/versaoDoPacote.js';
import { espacoDaRaiz } from '../../projetos/servicoProjetos.js';
import { projetoVinculado } from '../../projetos/servicoProjetos.js';
import { exigirCapacidade } from '../servicoCapacidades.js';
import { MeiosDoServidorMcp } from '../tipos/mcp.js';
import { projetoAindaVinculado } from './segurancaDaSessao.js';
import { registrarConsultarEvidencias } from './registroDeFerramentas.js';
import { registrarContextoProjeto } from './registroDeFerramentas.js';
import { registrarExecutarValidacao } from './registroDeFerramentas.js';
import { registrarListarPoliticas } from './registroDeFerramentas.js';
import { registrarProporAprendizado } from '../servicoPropostasMcp.js';
import { registrarProporBug } from '../servicoPropostasMcp.js';
import { registrarProporCaso } from '../servicoPropostasMcp.js';
import { registrarRevisarCobertura } from './registroDeFerramentas.js';
import { registrarRoteirosMcp } from './roteirosMcp.js';
import { respostaDaFerramentaMcp } from './formatoDasFerramentas.js';
import { transporteObservado } from './transporteObservado.js';
import { contaAutorizadaMcp, conferirAcessoMcp } from './segurancaDaSessao.js';
import { definirUsuarioDoEscopo, executarNoEscopoDoUsuario } from '../../compartilhado/banco/escopoDeUsuario.js';

export async function criarServidor(raiz: string, contratoLeitura?: string) {
  const dono = await contaAutorizadaMcp();
  definirUsuarioDoEscopo(dono);
  const vinculo = await carregarProjeto(raiz, contratoLeitura); // configuração local, nunca da tool
  const servidor = new McpServer({ name: 'prumo-qa', version: versaoDoPacote });
  const cliente = () => servidor.server.getClientVersion()?.name;
  const conectar = servidor.connect.bind(servidor);
  servidor.connect = t => conectar(transporteObservado(t, vinculo, cliente));
  const espaco = () => espacoDaRaiz(raiz);
  // A cada chamada, o MCP revalida a sessão do Electron. Logout ou troca de conta revogam o acesso.
  const autorizado = async (capacidade: string, fn: () => Promise<unknown>) => {
    const usuarioId = await contaAutorizadaMcp();
    if (usuarioId !== dono) throw new Error('MCP_SESSION_CHANGED: reinicie a conexão MCP após trocar de conta.');
    return executarNoEscopoDoUsuario(usuarioId, async () => {
      conferirAcessoMcp(usuarioId, capacidade);
      if (usuarioId) await projetoVinculado(raiz); // A lista de pastas vinculadas pertence à conta; espaço é opcional.
      return fn();
    });
  };
  const m: MeiosDoServidorMcp = {
    servidor, espaco, cliente,
    projeto: () => projetoAindaVinculado(raiz, vinculo, contratoLeitura),
    resposta: fn => respostaDaFerramentaMcp(() => autorizado('consultar_contexto', fn)),
    guarda: (capacidade, fn) => respostaDaFerramentaMcp(() => autorizado(capacidade, async () => { exigirCapacidade(espaco()?.id ?? null, capacidade); return fn(); })),
  };
  registrarContextoProjeto(m); registrarRevisarCobertura(m); registrarExecutarValidacao(m); registrarConsultarEvidencias(m);
  registrarListarPoliticas(m); registrarProporCaso(m); registrarProporBug(m); registrarProporAprendizado(m);
  registrarRoteirosMcp(m);
  return servidor;
}
