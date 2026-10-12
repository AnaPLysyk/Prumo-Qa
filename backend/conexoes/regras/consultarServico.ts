/** Faz uma consulta de leitura no serviço vinculado (tickets, casos, runs, commits...) e anota no histórico do projeto se deu certo. */
import { z } from 'zod';
import { registrarConsultaExterna } from '../../projetos/regras/registrarConsultaExterna.js';
import { Servico } from '../../projetos/tipos/espacos.js';
import { OperacaoServico } from '../tipos/adaptador.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { Filtros } from '../tipos/leituras.js';
import { paginaSchema } from '../tipos/transporte.js';
import { codigoDoErroDeServico } from './codigoDoErroDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';

export async function consultarServico(c: ContextoDosServicos, espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, servico);
    const r = await v.adaptador.consultar(v.recurso, operacao, pagina, id, v.campoAceite, filtros);
    registrarConsultaExterna(espacoId, servico, 'OK', c.base); return r;
  } catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}
