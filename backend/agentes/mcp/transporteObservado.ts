/** Envolve a conversa MCP para registrar no diário o início e o término de cada chamada de ferramenta. */
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { iniciarAtividade } from '../../logs/regras/iniciarAtividade.js';

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
