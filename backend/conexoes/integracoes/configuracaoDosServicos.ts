/** Destinos permitidos e autenticação HTTP dos serviços externos. */
import { ErroServico } from './ErroServico.js';
import { Servico } from '../../projetos/contratos.js';
import { ConfigServico } from '../tipos/adaptador.js';

/** GitHub e Qase usam destinos fixos; Jira aceita somente HTTPS em *.atlassian.net. */
export function instanciaServico(servico: Servico, valor?: string) {
  if (servico === 'github') return 'https://api.github.com';
  if (servico === 'qase') return 'https://api.qase.io';

  let endereco: URL;
  try {
    endereco = new URL(valor ?? '');
  } catch {
    throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  }

  const jiraValido =
    endereco.protocol === 'https:' &&
    !endereco.username &&
    !endereco.password &&
    !endereco.port &&
    endereco.pathname === '/' &&
    !endereco.search &&
    !endereco.hash &&
    /^([a-z0-9][a-z0-9-]{0,62})\.atlassian\.net$/.test(endereco.hostname);

  if (!jiraValido) throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return endereco.origin;
}

/** Aplica o esquema de autenticação correto, sem expor a credencial ao chamador. */
export function cabecalhosDoServico(config: ConfigServico): Record<string, string> {
  if (config.servico === 'jira') {
    const dados = Buffer.from(config.usuario + ':' + config.token).toString('base64');
    return { Authorization: 'Basic ' + dados };
  }
  if (config.servico === 'github') {
    return {
      Authorization: 'Bearer ' + config.token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }
  return { Token: config.token };
}
