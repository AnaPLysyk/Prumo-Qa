/** Executa uma operação com o serviço já revalidado (conta, vínculo e projeto); a credencial não sai do adaptador. */
import { registrarConsultaExterna } from '../../projetos/regras/registrarConsultaExterna.js';
import { Recurso, Servico } from '../../projetos/tipos/espacos.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { codigoDoErroDeServico } from './codigoDoErroDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';
import { vinculoDoServico } from './vinculoDoServico.js';

export async function executarComServico<T>(c: ContextoDosServicos, espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>): Promise<T> {
  const v = await verificarVinculoDoServico(c, espacoId, servico); const vi = vinculoDoServico(c, espacoId, servico);
  try { return await fn(v.adaptador.contexto(), v.recurso, { vinculoId: vi.id, conexaoId: vi.conexaoId }); }
  catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}
