/** Monta a resposta da ferramenta MCP contexto_projeto: contexto autorizado, frameworks detectados, contextos e aprendizados permitidos. */
import { aprendizadosParaMcp } from './aprendizadosParaMcp.js';
import { contextoProjeto } from '../../compartilhado/projeto/contextoProjeto.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { contextosParaMcp } from '../../contextos/regras/contextosParaMcp.js';
import { detectarFrameworks } from '../../testes/regras/detectarFrameworks.js';
import { conhecimento } from '../../testes/tipos/frameworks.js';

/**
 * Resposta de `contexto_projeto` (MCP) e de `prumo context` (CLI): o contexto autorizado do projeto acrescido de
 * frameworks detectados por evidência real, do conhecimento especializado aplicável e dos contextos persistentes
 * (só se a pessoa os habilitou para o MCP). Mantém todos os campos anteriores: apenas acrescenta.
 * 2.10: `aprendizados` traz o perfil (como chamar, papel) e o conhecimento APROVADO dos agentes para o projeto Prumo desta raiz,
 * sob a MESMA permissão dos contextos (sem ela, nada é enviado).
 */
export async function contextoCompleto(p: Projeto, base?: string) {
  const b = await contextoProjeto(p);
  const contextos = contextosParaMcp(p, base);
  const frameworks = detectarFrameworks(b.sources.map(s => ({ path: s.path, content: s.content })), b.omitted);
  return {
    ...b, frameworks,
    orientacoes: { qa:'backend/agentes/skills/qa/SKILL.md', engenharia:'backend/agentes/skills/qa/references/engenharia.md', acessibilidade:'backend/agentes/skills/acessibilidade/SKILL.md',
      condicoes:'QA: requisitos e cobertura; engenharia: revisão de código/arquitetura; acessibilidade: interfaces e interação. Referências portáteis; cliente deve instalar e invocar, sem carregamento universal garantido.' },
    conhecimento: frameworks.filter(f => f.estado !== 'INCERTO').map(f => ({ id: f.id, skill: f.skill, fontes: conhecimento[f.id].fontes, aplicar: f.estado === 'CONFIRMADO' ? 'sim' : 'somente após confirmar o framework' })),
    contextos,
    aprendizados: aprendizadosParaMcp(p.raiz, contextos.disponivel, base)
  };
}
