/** Ferramenta MCP revisar_cobertura: revisão estrutural do plano de testes da IA (requisito, riscos, oráculos, repetições); sempre NOT_VERIFIED. */
import { revisarCobertura } from '../../testes/regras/revisarCobertura.js';
import { revisaoSchema } from '../../testes/tipos/revisaoDeCobertura.js';
import { MeiosDoServidorMcp, somenteLeitura } from '../tipos/mcp.js';

export function registrarRevisarCobertura(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('revisar_cobertura', { description: 'Análise estrutural de requisito, riscos, oráculos e redundâncias candidatas. Sempre NOT_VERIFIED; interpretação semântica é da IA.', inputSchema: revisaoSchema, annotations: somenteLeitura },
    (args) => m.guarda('revisar_cobertura', async () => revisarCobertura(await m.projeto(), args)));
}
