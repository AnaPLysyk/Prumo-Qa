/** Monta o cabeçalho de autenticação do serviço: Basic no Jira, Bearer no GitHub e Token no Qase. */
import { ConfigServico } from '../tipos/adaptador.js';

export function cabecalhosDoServico(c: ConfigServico): Record<string, string> {
  if (c.servico === 'jira') return { Authorization: 'Basic ' + Buffer.from(c.usuario + ':' + c.token).toString('base64') };
  if (c.servico === 'github') return { Authorization: 'Bearer ' + c.token, 'X-GitHub-Api-Version': '2022-11-28' };
  return { Token: c.token };
}
