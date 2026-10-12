/** Diz se a IA pode usar uma capacidade agora: permitido, bloqueado ou só a pessoa, com o motivo. */
import { configuracaoDoEspaco } from './configuracaoDoEspaco.js';
import { Configuracao, EstadoCapacidade, capacidades, especializacoes, idsEsp } from '../tipos/politicas.js';

export function capacidadeEfetiva(espacoId: string | null, cap: string, b?: string): { estado: EstadoCapacidade; motivo: string } {
  const d = capacidades.find(x => x.id === cap); if (!d) return { estado: 'BLOQUEADO', motivo: 'Capacidade desconhecida.' };
  if (d.padrao === 'SOMENTE_PESSOA') return { estado: 'SOMENTE_PESSOA', motivo: d.explicacao };
  const c = espacoId ? configuracaoDoEspaco(espacoId, b) : { especializacoes: [...idsEsp], politicas: {} as Configuracao['politicas'], padrao: true };
  const politica = c.politicas[cap] ?? d.padrao; if (politica === 'BLOQUEADO') return { estado: 'BLOQUEADO', motivo: 'Bloqueada pela política deste projeto.' };
  const cobre = especializacoes.filter(e => (c.especializacoes as string[]).includes(e.id) && (e.capacidades as readonly string[]).includes(cap));
  if (!cobre.length) return { estado: 'BLOQUEADO', motivo: 'Nenhuma especialização habilitada inclui esta capacidade.' };
  return { estado: politica, motivo: politica === 'EXIGE_AUTORIZACAO' ? 'Permitida, mas cada execução exige autorização humana nativa.' : 'Permitida pelas especializações: ' + cobre.map(e => e.rotulo).join(', ') + '.' };
}
