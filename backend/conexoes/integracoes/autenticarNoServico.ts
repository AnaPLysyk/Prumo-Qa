/** Confere quem é a conta no serviço (Jira e GitHub devolvem a identidade; o Qase v1 não devolve, então a conta é a desta conexão). */
import { z } from 'zod';
import { PartesDoAdaptador, nome, obj, paginaQase, sid } from '../tipos/adaptador.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './requisicoes.js';
import { limparRespostaDoServico } from '../integracoesFormatos.js';

export async function autenticarNoServico(a: PartesDoAdaptador) {
  try {
    if (a.c.servico === 'jira') { const r = obj.parse(await lerComCredencial(a, '/rest/api/3/myself')); const contaId = z.string().regex(/^[A-Za-z0-9:-]{1,128}$/).parse(r.accountId); if (contaId === a.c.token) throw new Error(); return { contaId, nome: limparRespostaDoServico(a.c, nome.parse(r.displayName)) as string }; }
    if (a.c.servico === 'github') { const r = obj.parse(await lerComCredencial(a, '/user')); const contaId = sid.parse(r.id); if (!/^\d{1,20}$/.test(contaId) || contaId === a.c.token) throw new Error(); return { contaId, nome: limparRespostaDoServico(a.c, nome.parse(r.login)) as string }; }
    // API v1 Qase não fornece /me nem ID de conta em Project. Não inventar principal remoto.
    paginaQase.parse(await lerComCredencial(a, '/v1/project?limit=1&offset=0'));
    return { contaId: 'conexao-local:' + a.c.id, nome: 'Qase (escopo desta conexão; conta não informada pelo Qase)' };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
