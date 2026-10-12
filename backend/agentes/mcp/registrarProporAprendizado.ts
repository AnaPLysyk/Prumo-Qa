/** Ferramenta MCP propor_aprendizado: a IA sugere um conhecimento para os agentes do projeto, que entra como RASCUNHO até a pessoa decidir. */
import { z } from 'zod';
import { registrarConhecimento } from '../banco/registrarConhecimento.js';
import { tiposConhecimento } from '../tipos/conhecimento.js';
import { MeiosDoServidorMcp, rascunhoLocal } from '../tipos/mcp.js';

export function registrarProporAprendizado(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_aprendizado', { description: 'Sugere um aprendizado (fato, glossário, preferência, procedimento ou risco) para o banco de conhecimento dos agentes deste projeto. Entra como RASCUNHO, com limite por hora; só a pessoa aprova no Cérebro do agente. Não use para opinião nem para dado pessoal sensível.', inputSchema: z.object({ tipo: z.enum(tiposConhecimento), titulo: z.string().min(2).max(120), texto: z.string().min(2).max(2000), agente: z.string().regex(/^[a-z0-9-]{1,40}$/).optional() }).strict(), annotations: rascunhoLocal },
    args => m.guarda('propor_aprendizado', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: aprendizados exigem um projeto Prumo com esta raiz.');
      const { item, duplicado } = registrarConhecimento({ espacoId: e.id, agente: args.agente ?? null, tipo: args.tipo, titulo: args.titulo, texto: args.texto, origem: 'IA', cliente: m.cliente() ?? 'mcp' });
      return { id: item.id, estado: item.estado, duplicado, aviso: 'Rascunho: a pessoa decide no Cérebro do agente se aprova ou descarta.' };
    }));
}
