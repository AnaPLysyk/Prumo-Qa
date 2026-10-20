/** Monta o texto de um roteiro MCP do Prumo com os valores informados. */
import { personalidadeParaIa } from '../servicoEstiloDoChat.js';
import { promptsPrumo, sempre } from '../tipos/roteiros.js';

/** Texto completo de um prompt: personalidade + regras + passos. Mesmo resultado no MCP e no CLI. */
export function textoDoPrompt(nome: string, args: Record<string, string | undefined> = {}): string {
  const p = promptsPrumo.find((x) => x.nome === nome); if (!p) throw new Error('PROMPT_UNKNOWN: ' + nome);
  for (const a of p.argumentos) if (a.obrigatorio && !(args[a.nome] ?? '').trim()) throw new Error(`PROMPT_ARGUMENT_REQUIRED: ${a.nome}`);
  return [personalidadeParaIa(p.agente, null), `Tarefa: ${p.titulo}.`, ...sempre.map((s) => '- ' + s), ...p.passos(args).map((s) => '- ' + s), 'Responda em português do Brasil, a menos que a pessoa escreva em outro idioma.'].join('\n');
}
