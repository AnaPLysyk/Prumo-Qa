import { contextoProjeto, type Projeto } from './projeto.js';
import { detectarFrameworks, conhecimento } from './frameworks.js';
import { contextosParaMcp } from './contextos.js';

/**
 * Resposta de `contexto_projeto` (MCP) e de `prumo context` (CLI): o contexto autorizado do projeto acrescido de
 * frameworks detectados por evidência real, do conhecimento especializado aplicável e dos contextos persistentes
 * (só se a pessoa os habilitou para o MCP). Mantém todos os campos anteriores: apenas acrescenta.
 */
export async function contextoCompleto(p: Projeto, base?: string) {
  const b = await contextoProjeto(p);
  const frameworks = detectarFrameworks(b.sources.map(s => ({ path: s.path, content: s.content })), b.omitted);
  return {
    ...b, frameworks,
    orientacoes: { qa:'skills/qa/SKILL.md', engenharia:'skills/qa/references/engenharia.md', acessibilidade:'skills/acessibilidade/SKILL.md',
      condicoes:'QA: requisitos e cobertura; engenharia: revisão de código/arquitetura; acessibilidade: interfaces e interação. Referências portáteis; cliente deve instalar e invocar, sem carregamento universal garantido.' },
    conhecimento: frameworks.filter(f => f.estado !== 'INCERTO').map(f => ({ id: f.id, skill: f.skill, fontes: conhecimento[f.id].fontes, aplicar: f.estado === 'CONFIRMADO' ? 'sim' : 'somente após confirmar o framework' })),
    contextos: contextosParaMcp(p, base)
  };
}
