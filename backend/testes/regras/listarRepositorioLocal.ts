/** Combina casos locais próprios e casos pessoais antigos, sem duplicar IDs nem modificar propostas.json. */
import { obterEspaco } from '../../projetos/repositorio.js';
import { listarPropostas } from '../../tickets/repositorio.js';
import { dadosCasoLocal } from '../tipos/repositorioLocal.js';
import { lerRepositorioLocal } from '../banco/lerRepositorioLocal.js';

export function listarRepositorioLocal(espacoId: string, base?: string) {
  obterEspaco(espacoId, base);
  const repo = lerRepositorioLocal(base);
  const novos = repo.casos.filter(c => c.espacoId === espacoId);
  const ids = new Set(novos.map(c => c.id));
  const antigos = listarPropostas(espacoId, base)
    .filter(p => p.tipo === 'caso' && p.origem === 'PESSOA' && p.estado !== 'DESCARTADA' && !p.remoto && !ids.has(p.id))
    .map(p => ({
      id: p.id, espacoId, tipo: 'caso' as const, origem: 'PESSOA' as const,
      titulo: p.titulo, dados: dadosCasoLocal.parse((({ suiteId: _suite, ticket: _ticket, ...dados }) => dados)(p.dados as Record<string, unknown>)), requisito: p.requisito, risco: p.risco,
      suiteLocalId: null,
      // Referências textuais da proposta original são históricas; não declaram um vínculo verificado no Jira/Qase.
      referenciasLegadas: {
        ...(typeof p.dados.ticket === 'string' ? { ticket: p.dados.ticket } : {}),
        ...(typeof p.dados.suiteId === 'number' && Number.isSafeInteger(p.dados.suiteId) && p.dados.suiteId > 0 ? { suiteId: p.dados.suiteId } : {})
      },
      criadaEm: p.criadaEm, atualizadaEm: p.atualizadaEm,
      legado: true
    }));
  return {
    casos: [...novos, ...antigos].sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm)),
    suites: repo.suites.filter(s => s.espacoId === espacoId)
  };
}
