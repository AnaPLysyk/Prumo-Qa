/** Publica o comentário de resultado num ticket do Jira vinculado, depois de revalidar conta, vínculo e projeto. */
import { registrarConsultaExterna } from '../../projetos/regras/registrarConsultaExterna.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { codigoDoErroDeServico } from './codigoDoErroDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';
import { vinculoDoServico } from './vinculoDoServico.js';

export async function comentarNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, adf: unknown) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, 'jira');
    const r = await v.adaptador.publicarComentario(v.recurso, ticket, adf);
    registrarConsultaExterna(espacoId, 'jira', 'COMMENT_OK', c.base);
    const vi = vinculoDoServico(c, espacoId, 'jira');
    return { ...r, vinculoId: vi.id, conexaoId: vi.conexaoId };
  } catch (e) { registrarConsultaExterna(espacoId, 'jira', codigoDoErroDeServico(e), c.base); throw e; }
}
