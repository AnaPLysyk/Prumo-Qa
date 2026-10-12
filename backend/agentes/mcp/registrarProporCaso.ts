/** Ferramenta MCP propor_caso: a IA propõe um caso de teste que fica como RASCUNHO local; não publica no Qase. */
import { z } from 'zod';
import { esquemaCaso } from '../../testes/tipos/escritaQase.js';
import { criarProposta } from '../../tickets/regras/criarProposta.js';
import { MeiosDoServidorMcp, avisoDeRascunho, rascunhoLocal } from '../tipos/mcp.js';

export function registrarProporCaso(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('propor_caso', { description: 'Propõe um caso de teste como RASCUNHO local, com checagem de duplicidade e limite por hora. Não publica no Qase. Informe o requisito que o caso cobre e o risco.', inputSchema: esquemaCaso.extend({ requisito: z.string().max(500).optional(), risco: z.string().max(300).optional() }), annotations: rascunhoLocal },
    args => m.guarda('propor_casos', async () => {
      const e = m.espaco(); if (!e) throw new Error('NO_WORKSPACE: propostas exigem um projeto Prumo com esta raiz.'); const { requisito, risco, ...dados } = args;
      const p = criarProposta({ espacoId: e.id, tipo: 'caso', origem: 'IA', cliente: m.cliente(), dados, requisito, risco });
      return { id: p.id, estado: p.estado, titulo: p.titulo, similares: p.similares, aviso: avisoDeRascunho };
    }));
}
