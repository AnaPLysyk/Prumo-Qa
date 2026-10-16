/** Como os agentes chamam a pessoa: o nome escolhido no Meu perfil ou, sem ele, o primeiro nome da conta que entrou. Sem sessão, ninguém. */
import { contaDaSessao } from '../../login/regras/sessao.js';
import type { Perfil } from '../tipos/conhecimento.js';

export function nomeParaChamar(perfil: Pick<Perfil, 'comoChamar'> | null, base?: string): string | null {
  if (perfil?.comoChamar) return perfil.comoChamar;
  const nome = contaDaSessao(base)?.nome?.trim();
  return nome ? nome.split(/\s+/)[0]!.slice(0, 30) : null;
}
