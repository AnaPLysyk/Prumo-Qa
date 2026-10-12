/** Lista os projetos ou repositórios que uma conta enxerga no serviço, para escolher qual vincular. */
import { z } from 'zod';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { paginaSchema } from '../tipos/transporte.js';
import { adaptadorDaConta } from './adaptadorDaConta.js';
import { contaAtiva } from './contaAtiva.js';

export async function listarRecursosDaConta(c: ContextoDosServicos, id: string, pagina: z.input<typeof paginaSchema> = {}) {
  return adaptadorDaConta(c, contaAtiva(c, id)).listar(pagina);
}
