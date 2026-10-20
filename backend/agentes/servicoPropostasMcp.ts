/** servicoPropostasMcp: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { z } from "zod";
import { registrarConhecimento } from "./banco/conhecimento.js";
import { tiposConhecimento } from "./tipos/conhecimento.js";
import { MeiosDoServidorMcp, rascunhoLocal, avisoDeRascunho } from "./tipos/mcp.js";
import { criarProposta } from "../tickets/servicoPropostas.js";
import { dadosBug } from "../tickets/contratos.js";
import { esquemaCaso } from "../testes/tipos/escritaQase.js";
import { promptsPrumo, sempre } from "./tipos/roteiros.js";
import { contaAutorizadaMcp, conferirAcessoMcp } from "./mcp/segurancaDaSessao.js";
import { exigirCapacidade } from "./servicoPoliticas.js";
import { personalidadeParaIa } from "./servicoEstiloDoChat.js";

// --- servicoPropostasMcp ---
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

// --- roteirosMcp ---
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
