/** Consulta campos-sistema no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { camposDeSistema } from '../../testes/integracoes/camposDeSistema.js';

export async function consultarCamposSistemaQase(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx } = parametros;
  if (ctx.servico !== 'qase') return null; return { dados: await camposDeSistema(ctx), proxima: null, endpoint: '/v1/system_field' };
}
