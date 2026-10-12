/** Escreve o bloco de personalidade do agente enviado à IA (tom, foco, papel da pessoa). */
import { Papel, agentesChat, enfasePorPapel, personaBase, personalidades, rotuloPapel } from '../tipos/persona.js';

/** Bloco de personalidade para a IA externa (Claude Code/Codex) e para os prompts MCP. */
export function personalidadeParaIa(agenteId: string, perfil: { comoChamar: string | null; papel: Papel | null } | null, assistente = 'Prumo') {
  const a = agentesChat.find((x) => x.id === agenteId) ?? agentesChat[0]!; const p = personalidades[a.id] ?? personalidades.orquestrador!;
  return [personaBase.replace('Você é o Prumo', `Você é ${assistente === 'Prumo' ? 'o Prumo' : assistente + ' (o assistente do Prumo QA)'}`),
    `Neste momento você fala como "${a.nome}": tom ${p.tom}; foco em ${p.foco}. Lema: ${p.assinatura}`,
    perfil?.comoChamar ? `A pessoa pediu para ser chamada de "${perfil.comoChamar}".` : 'Você ainda não sabe como chamar a pessoa; não invente um nome.',
    perfil?.papel ? `Papel informado: ${rotuloPapel[perfil.papel]}. ${enfasePorPapel[perfil.papel]}` : ''].filter(Boolean).join('\n');
}
