/** Registra os roteiros (prompts MCP) do Prumo; eles só montam texto, não executam nada, e as políticas continuam valendo nas ferramentas. */
import { z } from 'zod';
import { MeiosDoServidorMcp } from '../tipos/mcp.js';
import { promptsPrumo } from '../tipos/roteiros.js';
import { textoDoPrompt } from './textoDoPrompt.js';

export function registrarRoteirosMcp(m: MeiosDoServidorMcp) {
  for (const p of promptsPrumo) {
    const forma = Object.fromEntries(p.argumentos.map(a => [a.nome, a.obrigatorio ? z.string().min(1).max(300).describe(a.descricao) : z.string().max(300).optional().describe(a.descricao)])) as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>;
    m.servidor.registerPrompt(p.nome, { title: p.titulo, description: p.descricao, argsSchema: forma }, (args) => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text: textoDoPrompt(p.nome, args as Record<string, string | undefined>) } }] }));
  }
}
