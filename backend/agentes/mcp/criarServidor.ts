/** criarServidor: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { iniciarAtividade } from "../../logs/regras/iniciarAtividade.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { versaoDoPacote } from "../../compartilhado/raizDoAplicativo.js";
import { espacoDaRaiz, projetoVinculado } from "../../projetos/servicoProjetos.js";
import { exigirCapacidade } from "../servicoPoliticas.js";
import { MeiosDoServidorMcp } from "../tipos/mcp.js";
import { projetoAindaVinculado, contaAutorizadaMcp, conferirAcessoMcp } from "./segurancaDaSessao.js";
import { registrarConsultarEvidencias, registrarContextoProjeto, registrarExecutarValidacao, registrarListarPoliticas, registrarRevisarCobertura, respostaDaFerramentaMcp } from "./consultasDoProjeto.js";
import { registrarPerguntarAoOrquestrador, registrarProporAprendizado, registrarProporBug, registrarProporCaso, registrarRoteirosMcp } from "./consultasDoProjeto.js";
import { definirUsuarioDoEscopo, executarNoEscopoDoUsuario } from "../../compartilhado/banco/diretorioDados.js";

// --- transporteObservado ---
/** Observa tools/call na fronteira do protocolo, inclusive rejeições de schema do SDK. */
export function transporteObservado(transporte:Transport,p:Projeto,cliente:()=>string|undefined):Transport {
  const pendentes=new Map<string|number,ReturnType<typeof iniciarAtividade>>();
  const observado:Transport={
    async start() {
      transporte.onmessage=(mensagem,extra)=>{
        if('method' in mensagem && mensagem.method==='tools/call' && 'id' in mensagem) {
          const params=mensagem.params;
          pendentes.set(mensagem.id,iniciarAtividade(p,typeof params?.name==='string'?params.name:'desconhecida',{origin:'MCP',client:cliente()},params?.arguments));
        }
        observado.onmessage?.(mensagem,extra);
      };
      transporte.onerror=e=>observado.onerror?.(e);
      // Inícios sem término ficam observáveis, sem inventar resultado após desconexão.
      transporte.onclose=()=>{pendentes.clear();observado.onclose?.();};
      await transporte.start();
    },
    async send(mensagem,opcoes) {
      if('id' in mensagem && mensagem.id!==undefined && !('method' in mensagem)) {
        const a=pendentes.get(mensagem.id);
        if(a) {
          pendentes.delete(mensagem.id);
          if('error' in mensagem)a.finalizar({codigo:'TOOL_ERROR'},true);
          else {
            const r=mensagem.result;let dados:unknown={};
            const texto=Array.isArray(r.content)?r.content.find(c=>c?.type==='text')?.text:undefined;
            if(typeof texto==='string') {try{dados=JSON.parse(texto);}catch{ /* Erro textual do SDK: nunca copiar texto livre ao log. */ }}
            a.finalizar(dados,r.isError===true);
          }
        }
      }
      await transporte.send(mensagem,opcoes);
    },
    close:()=>transporte.close(),
    setProtocolVersion:v=>transporte.setProtocolVersion?.(v)
  };
  return observado;
}

// --- criarServidor ---
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
  registrarPerguntarAoOrquestrador(m); registrarRoteirosMcp(m);
  return servidor;
}
