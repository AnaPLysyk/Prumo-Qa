/** Lista as rotinas para a tela Agendamentos, com próxima e última execução, permissões e autorizações. */
import { estadoDaAutorizacao } from '../autorizacoes/estadoERevogacao.js';
import { lerAutorizacoes } from '../banco/autorizacoes.js';
import { listarRotinas } from '../repositorioAgenda.js';
import { listarTrabalhos } from '../repositorioFila.js';
import { capacidadesDaRotina } from './capacidadesDaRotina.js';
import { permissoesDaRotina } from './permissoes.js';
import { proximoHorario } from '../servicoHorarios.js';

export function listarAgenda(espacoId?: string, base?: string, agora = new Date()) {
  const trab = listarTrabalhos(base); const aut = lerAutorizacoes(base);
  return listarRotinas(base).filter(r => !espacoId || r.espacoId === espacoId).map(r => {
    const meus = trab.filter(t => t.rotinaId === r.id && t.estado !== 'PERDIDO'); const ultimo = meus.filter(t => t.terminadoEm).sort((a, b) => b.terminadoEm!.localeCompare(a.terminadoEm!))[0];
    const caps = capacidadesDaRotina(r, base);
    const autorizacoes = caps.map(c => { const a = aut.execucoes.filter(x => x.espacoId === r.espacoId && x.capability === c && x.ambiente === r.ambiente).sort((p, q) => q.criadaEm.localeCompare(p.criadaEm))[0]; return { capability: c, estado: a ? estadoDaAutorizacao(a, agora) : 'AUSENTE', id: a?.id ?? null, validaAte: a?.validaAte ?? null, usos: a ? `${a.usos}/${a.maxUsos}` : null }; });
    const proximo = r.estado === 'ATIVA' ? proximoHorario(r, agora.getTime()) : null;
    return { ...r, proximaExecucao: proximo ? new Date(proximo).toISOString() : null, ultimaExecucao: ultimo ? { id: ultimo.id, em: ultimo.terminadoEm, estado: ultimo.estado, resultado: ultimo.resultado?.status ?? null, motivo: ultimo.resultado?.motivo ?? ultimo.erro } : null,
      permissoes: permissoesDaRotina(r, base), autorizacoes, erros: meus.filter(t => t.estado === 'ERRO' || t.resultado?.status === 'ERRO_INFRA' || t.resultado?.status === 'BLOCKED').slice(-5).map(t => ({ id: t.id, codigo: t.erro ?? t.resultado?.status, motivo: t.resultado?.motivo ?? '' })) };
  });
}
