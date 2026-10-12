/** Confere os limites do k6: até 50 usuários virtuais e 600 segundos. */
import { ConfigK6, LIMITE_DURACAO_S, LIMITE_USUARIOS } from '../tipos/k6.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';

export function validarLimitesDoK6(c: ConfigK6) {
  if (!Number.isInteger(c.usuarios) || c.usuarios < 1 || c.usuarios > LIMITE_USUARIOS) throw new ErroQa('K6_LIMIT', `Usuários virtuais entre 1 e ${LIMITE_USUARIOS}.`);
  if (!Number.isInteger(c.duracaoSegundos) || c.duracaoSegundos < 1 || c.duracaoSegundos > LIMITE_DURACAO_S) throw new ErroQa('K6_LIMIT', `Duração entre 1 e ${LIMITE_DURACAO_S} segundos.`);
}
