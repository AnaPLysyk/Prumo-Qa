/** Lista o histórico real das execuções com os filtros informados pela interface. */
import { listarRotinas } from '../../agendamentos/banco/agenda.js';
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { Trabalho } from '../../agendamentos/tipos/fila.js';
import { listarEspacos } from '../../projetos/repositorio.js';
import { Espaco } from '../../projetos/contratos.js';
import { FiltroExecucoes, filtroExecucoes } from '../tipos/historicoDeExecucoes.js';

const repositorioDoEspaco = (espaco: Espaco | undefined): string | null =>
  espaco?.vinculos.find(vinculo => vinculo.servico === 'github')?.recurso.chave ?? null;

const duracaoDoTrabalho = (trabalho: Trabalho): number | null =>
  trabalho.iniciadoEm && trabalho.terminadoEm
    ? Math.max(0, Date.parse(trabalho.terminadoEm) - Date.parse(trabalho.iniciadoEm))
    : null;

export function listarExecucoes(filtros: FiltroExecucoes = {}, base?: string) {
  const filtro = filtroExecucoes.parse(filtros);
  const rotinas = new Map(listarRotinas(base).map(rotina => [rotina.id, rotina]));
  const espacos = new Map(listarEspacos(base).map(espaco => [espaco.id, espaco]));

  const execucoes = listarTrabalhos(base).filter(trabalho =>
    (!filtro.espacoId || trabalho.espacoId === filtro.espacoId) &&
    (!filtro.rotinaId || trabalho.rotinaId === filtro.rotinaId) &&
    (!filtro.ticket || trabalho.ticket === filtro.ticket) &&
    (!filtro.estado || trabalho.estado === filtro.estado) &&
    (!filtro.resultado || trabalho.resultado?.status === filtro.resultado) &&
    (!filtro.since || trabalho.criadoEm >= filtro.since) &&
    (!filtro.until || trabalho.criadoEm <= filtro.until) &&
    (!filtro.repositorio || repositorioDoEspaco(espacos.get(trabalho.espacoId)) === filtro.repositorio)
  );

  execucoes.sort(
    (a, b) => (b.slot ?? b.criadoEm).localeCompare(a.slot ?? a.criadoEm)
  );

  return {
    total: execucoes.length,
    execucoes: execucoes.slice(0, filtro.limite).map(trabalho => {
      const rotina = rotinas.get(trabalho.rotinaId);
      const espaco = espacos.get(trabalho.espacoId);
      return {
        id: trabalho.id,
        rotinaId: trabalho.rotinaId,
        rotina: rotina?.nome ?? '(rotina excluída)',
        espacoId: trabalho.espacoId,
        projeto: espaco?.nome ?? '(projeto removido)',
        repositorio: repositorioDoEspaco(espaco),
        tipo: trabalho.tipo,
        capability: trabalho.capability ?? null,
        ambiente: trabalho.ambiente,
        ticket: trabalho.ticket ?? null,
        executor: trabalho.origem === 'AGENDA' ? 'Prumo (agenda)' : 'Prumo (manual)',
        origem: trabalho.origem,
        slot: trabalho.slot,
        criadoEm: trabalho.criadoEm,
        inicio: trabalho.iniciadoEm,
        termino: trabalho.terminadoEm,
        duracaoMs: duracaoDoTrabalho(trabalho),
        estado: trabalho.estado,
        resultado: trabalho.resultado,
        tentativas: trabalho.log.map(tentativa => ({
          n: tentativa.n,
          inicio: tentativa.inicio,
          fim: tentativa.fim,
          estado: tentativa.estado,
          codigo: tentativa.codigo ?? null
        })),
        erro: trabalho.erro,
        jira: trabalho.jira,
        evidenciaId: trabalho.resultado?.evidenciaId ?? null,
        pastaLocal: espaco?.pastaLocal ?? null
      };
    })
  };
}
