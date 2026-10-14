/** Ferramenta MCP consultar_evidencias: devolve à IA as evidências reais do projeto com integridade conferida; sem evidência, NOT_RUN. */
import { z } from 'zod';
import { consultarEvidencias } from '../../testes/banco/consultarEvidencias.js';
import { MeiosDoServidorMcp, somenteLeitura } from '../tipos/mcp.js';

export function registrarConsultarEvidencias(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('consultar_evidencias', { description: 'Consulta jobs locais com integridade e isolamento. Sem evidência retorna NOT_RUN.', inputSchema: z.object({ jobId: z.string().uuid().optional(), criterio: z.string().max(100).optional() }).strict(), annotations: somenteLeitura },
    (args) => m.guarda('consultar_evidencias', async () => consultarEvidencias(await m.projeto(), args.jobId, args.criterio)));
}
