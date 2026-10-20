/** Registra propostas de aprendizado, casos e bugs recebidas pelas ferramentas MCP. */
import { z } from "zod";
import { registrarConhecimento } from "./banco/conhecimento.js";
import { tiposConhecimento } from "./tipos/conhecimento.js";
import { MeiosDoServidorMcp, rascunhoLocal, avisoDeRascunho } from "./tipos/mcp.js";
import { criarProposta } from "../tickets/servicoPropostas.js";
import { dadosBug } from "../tickets/contratos.js";
import { esquemaCaso } from "../testes/tipos/escritaQase.js";

export function registrarProporAprendizado(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_aprendizado', { description: 'Sugere um aprendizado (fato, glossário, preferência, procedimento ou risco) para o banco de conhecimento dos agentes deste projeto. Entra como RASCUNHO, com limite por hora; só a pessoa aprova no Cérebro do agente. Não use para opinião nem para dado pessoal sensível.', inputSchema: z.object({ tipo: z.enum(tiposConhecimento), titulo: z.string().min(2).max(120), texto: z.string().min(2).max(2000), agente: z.string().regex(/^[a-z0-9-]{1,40}$/).optional() }).strict(), annotations: rascunhoLocal },
    args => m.guarda('propor_aprendizado', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: aprendizados exigem um projeto Prumo com esta raiz.');
      const { item, duplicado } = registrarConhecimento({ espacoId: e.id, agente: args.agente ?? null, tipo: args.tipo, titulo: args.titulo, texto: args.texto, origem: 'IA', cliente: m.cliente() ?? 'mcp' });
      return { id: item.id, estado: item.estado, duplicado, aviso: 'Rascunho: a pessoa decide no Cérebro do agente se aprova ou descarta.' };
    }));
}

export function registrarProporBug(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_bug', { description: 'Propõe um bug como RASCUNHO local (resumo, descrição, ticket de origem opcional). Não cria ticket no Jira.', inputSchema: dadosBug.omit({ classificacao: true, tipoId: true }).extend({ risco: z.string().max(300).optional() }), annotations: rascunhoLocal },
    args => m.guarda('propor_bugs', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: propostas exigem um projeto Prumo com esta raiz.'); const { risco, ...dados } = args;
      const p = criarProposta({ espacoId: e.id, tipo: 'bug', origem: 'IA', cliente: m.cliente(), dados, risco });
      return { id: p.id, estado: p.estado, titulo: p.titulo, similares: p.similares, aviso: avisoDeRascunho };
    }));
}

export function registrarProporCaso(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_caso', { description: 'Propõe um caso de teste como RASCUNHO local, com checagem de duplicidade e limite por hora. Não publica no Qase. Informe o requisito que o caso cobre e o risco.', inputSchema: esquemaCaso.extend({ requisito: z.string().max(500).optional(), risco: z.string().max(300).optional() }), annotations: rascunhoLocal },
    args => m.guarda('propor_casos', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: propostas exigem um projeto Prumo com esta raiz.'); const { requisito, risco, ...dados } = args;
      const p = criarProposta({ espacoId: e.id, tipo: 'caso', origem: 'IA', cliente: m.cliente(), dados, requisito, risco });
      return { id: p.id, estado: p.estado, titulo: p.titulo, similares: p.similares, aviso: avisoDeRascunho };
    }));
}
