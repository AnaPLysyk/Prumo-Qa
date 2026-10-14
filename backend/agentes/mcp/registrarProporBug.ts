/** Ferramenta MCP propor_bug: a IA propõe um bug que fica como RASCUNHO local; não cria ticket no Jira. */
import { z } from 'zod';
import { criarProposta } from '../../tickets/regras/criarProposta.js';
import { esquemaDadosBug } from '../../tickets/tipos/proposta.js';
import { MeiosDoServidorMcp, avisoDeRascunho, rascunhoLocal } from '../tipos/mcp.js';

export function registrarProporBug(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_bug', { description: 'Propõe um bug como RASCUNHO local (resumo, descrição, ticket de origem opcional). Não cria ticket no Jira.', inputSchema: esquemaDadosBug.omit({ classificacao: true, tipoId: true }).extend({ risco: z.string().max(300).optional() }), annotations: rascunhoLocal },
    args => m.guarda('propor_bugs', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: propostas exigem um projeto Prumo com esta raiz.'); const { risco, ...dados } = args;
      const p = criarProposta({ espacoId: e.id, tipo: 'bug', origem: 'IA', cliente: m.cliente(), dados, risco });
      return { id: p.id, estado: p.estado, titulo: p.titulo, similares: p.similares, aviso: avisoDeRascunho };
    }));
}
