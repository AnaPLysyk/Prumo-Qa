/** Política de capacidades: consulta efetiva, exigência de autorização e matriz da interface. */
import { configuracaoDoEspaco } from '../servicoPoliticas.js';
import {
  Configuracao, EstadoCapacidade, capacidades, especializacoes, idsEsp
} from '../tipos/politicas.js';

export function capacidadeEfetiva(
  espacoId: string | null,
  capacidade: string,
  base?: string
): { estado: EstadoCapacidade; motivo: string } {
  const definicao = capacidades.find(item => item.id === capacidade);
  if (!definicao) return { estado: 'BLOQUEADO', motivo: 'Capacidade desconhecida.' };
  if (definicao.padrao === 'SOMENTE_PESSOA') {
    return { estado: 'SOMENTE_PESSOA', motivo: definicao.explicacao };
  }

  const configuracao = espacoId
    ? configuracaoDoEspaco(espacoId, base)
    : { especializacoes: [...idsEsp], politicas: {} as Configuracao['politicas'], padrao: true };
  const politica = configuracao.politicas[capacidade] ?? definicao.padrao;
  if (politica === 'BLOQUEADO') {
    return { estado: 'BLOQUEADO', motivo: 'Bloqueada pela política deste projeto.' };
  }

  const habilitadas = especializacoes.filter(
    item => (configuracao.especializacoes as string[]).includes(item.id)
      && (item.capacidades as readonly string[]).includes(capacidade)
  );
  if (!habilitadas.length) {
    return { estado: 'BLOQUEADO', motivo: 'Nenhuma especialização habilitada inclui esta capacidade.' };
  }

  return {
    estado: politica,
    motivo: politica === 'EXIGE_AUTORIZACAO'
      ? 'Permitida, mas cada execução exige autorização humana nativa.'
      : 'Permitida pelas especializações: ' + habilitadas.map(item => item.rotulo).join(', ') + '.'
  };
}

export function exigirCapacidade(espacoId: string | null, capacidade: string, base?: string) {
  const avaliada = capacidadeEfetiva(espacoId, capacidade, base);
  if (avaliada.estado === 'BLOQUEADO' || avaliada.estado === 'SOMENTE_PESSOA') {
    throw Object.assign(
      new Error(`POLICY_BLOCKED: ${avaliada.motivo}`),
      { codigo: 'POLICY_BLOCKED' }
    );
  }
  return avaliada;
}

/** Matriz usada pela interface e pela ferramenta listar_politicas. */
export function matrizDePoliticas(espacoId: string | null, base?: string) {
  return capacidades.map(definicao => {
    const avaliada = capacidadeEfetiva(espacoId, definicao.id, base);
    return {
      id: definicao.id,
      rotulo: definicao.rotulo,
      ferramenta: definicao.ferramenta,
      estado: avaliada.estado,
      motivo: avaliada.motivo,
      editavel: definicao.editavel,
      explicacao: definicao.explicacao
    };
  });
}
