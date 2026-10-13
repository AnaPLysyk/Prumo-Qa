/** Confere que a especialização existe no Prumo antes de ler ou gravar Skill dela. */
import { especializacoes } from '../tipos/politicas.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';

export function validarEspecializacao(id: string): string {
  if (!especializacoes.some((e) => e.id === id)) falharCom('SKILL_SPECIALIZATION_INVALID');
  return id;
}
