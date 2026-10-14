/** Ferramenta MCP executar_validacao: executa uma capacidade do contrato só com aprovação humana nativa do Windows; sem ela, BLOCKED. */
import { z } from 'zod';
import { executarValidacao } from '../../testes/regras/executarValidacao.js';
import { MeiosDoServidorMcp } from '../tipos/mcp.js';

export function registrarExecutarValidacao(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('executar_validacao', { description: 'Capability do contrato. Sem aprovação humana nativa retorna BLOCKED. solicitarAprovacao abre autenticação Windows, não autoriza por si só.', inputSchema: z.object({ capability: z.string().min(1).max(80), solicitarAprovacao: z.boolean().default(false) }).strict(), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false } },
    (args) => m.guarda('executar_testes', async () => executarValidacao(await m.projeto(), args.capability, args.solicitarAprovacao)));
}
