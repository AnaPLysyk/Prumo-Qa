/** Registra os roteiros MCP, exigindo acesso antes de entregar os prompts protegidos. */
import { z } from 'zod';
import { MeiosDoServidorMcp } from '../tipos/mcp.js';
import { promptsPrumo, sempre } from '../tipos/roteiros.js';
import { contaAutorizadaMcp, conferirAcessoMcp } from './segurancaDaSessao.js';
import { exigirCapacidade } from '../servicoPoliticas.js';
import { personalidadeParaIa } from '../servicoEstiloDoChat.js';

/** Prepara as entradas disponíveis e verifica as autorizações exigidas por cada roteiro. */
export function registrarRoteirosMcp(m: MeiosDoServidorMcp) {
  for (const roteiro of promptsPrumo) {
    const argumentos = Object.fromEntries(
      roteiro.argumentos.map(arg => [
        arg.nome,
        arg.obrigatorio
          ? z.string().min(1).max(300).describe(arg.descricao)
          : z.string().max(300).optional().describe(arg.descricao)
      ])
    ) as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>;

    m.servidor.registerPrompt(
      roteiro.nome,
      { title: roteiro.titulo, description: roteiro.descricao, argsSchema: argumentos },
      async (args) => {
        if (roteiro.nome === 'auditar-codigo') {
          const usuarioId = await contaAutorizadaMcp();
          if (!usuarioId) throw new Error('MCP_SESSION_REQUIRED');
          conferirAcessoMcp(usuarioId, 'consultar_contexto');
          exigirCapacidade(m.espaco()?.id ?? null, 'consultar_contexto');
        }
        return {
          messages: [{
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: textoDoPrompt(roteiro.nome, args as Record<string, string | undefined>)
            }
          }]
        };
      }
    );
  }
}

/** Monta o texto descritivo: personalidade, regras e passos, sem executar nenhuma ação. */
export function textoDoPrompt(nome: string, args: Record<string, string | undefined> = {}): string {
  const roteiro = promptsPrumo.find(item => item.nome === nome);
  if (!roteiro) throw new Error('PROMPT_UNKNOWN: ' + nome);

  for (const arg of roteiro.argumentos) {
    if (arg.obrigatorio && !(args[arg.nome] ?? '').trim()) {
      throw new Error('PROMPT_ARGUMENT_REQUIRED: ' + arg.nome);
    }
  }

  return [
    personalidadeParaIa(roteiro.agente, null),
    'Tarefa: ' + roteiro.titulo + '.',
    ...sempre.map(regra => '- ' + regra),
    ...roteiro.passos(args).map(passo => '- ' + passo),
    'Responda em português do Brasil, a menos que a pessoa escreva em outro idioma.'
  ].join('\n');
}
