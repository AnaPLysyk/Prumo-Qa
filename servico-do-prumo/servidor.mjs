/**
 * Serviço do Prumo QA (Render): manda os códigos de confirmação por e-mail (Resend) e recebe os chamados de suporte (repositório
 * privado no GitHub). Sem dependências e sem banco. Chaves e tokens ficam só nas variáveis do serviço, nunca no aplicativo distribuído.
 */
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { criarLimitador, responder } from './comum.mjs';
import { LIMITES, enviarPeloResend, rotaDeCodigos } from './codigos.mjs';
import { LIMITES_DE_CHAMADOS, rotaDeChamados } from './chamados.mjs';
import { clienteDoGitHub } from './github.mjs';

export { mensagem, enviarPeloResend } from './codigos.mjs';

/**
 * Cria o atendimento HTTP. `enviar` (Resend) e `suporte.github` são injetados: os testes usam uma caixa e um repositório em memória.
 * Sem configuração, cada parte recusa com 503 e o resto continua funcionando.
 */
export function criarServico({ enviar, configurado = true, limites = LIMITES, suporte = null, agora = () => Date.now(), registrar = (linha) => console.log(linha) }) {
  const limitador = criarLimitador(agora);
  const codigos = rotaDeCodigos({ enviar, configurado, limites, limitador, registrar });
  const chamados = rotaDeChamados({ github: suporte?.github, configurado: !!suporte?.github, chaveAdmin: suporte?.chaveAdmin, limites: suporte?.limites ?? LIMITES_DE_CHAMADOS, limitador, registrar, agora });
  return async function atender(req, res) {
    let url; try { url = new URL(req.url || '/', 'http://servico'); } catch { return responder(res, 400, { erro: 'NOT_FOUND' }); }
    const caminho = url.pathname;
    try {
      if (req.method === 'GET' && caminho === '/saude') return responder(res, 200, { ok: true, email: configurado, suporte: !!suporte?.github, administracao: typeof suporte?.chaveAdmin === 'string' && suporte.chaveAdmin.length >= 32 });
      if (caminho === '/v1/codigos') return await codigos(req, res);
      if (caminho.startsWith('/v1/chamados') || caminho.startsWith('/v1/admin/')) return await chamados(req, res, caminho, url.searchParams);
      return responder(res, 404, { erro: 'NOT_FOUND' });
    } catch (e) {
      registrar('erro inesperado: ' + String(e?.message || e).slice(0, 120));
      if (!res.headersSent) responder(res, 500, { erro: 'INTERNAL' });
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  const comEmail = !!(env.RESEND_API_KEY && env.PRUMO_EMAIL_REMETENTE);
  const enviar = comEmail ? enviarPeloResend({ chave: env.RESEND_API_KEY, remetente: env.PRUMO_EMAIL_REMETENTE }) : async () => { throw new Error('sem configuração'); };
  const comSuporte = !!(env.PRUMO_SUPORTE_TOKEN && env.PRUMO_SUPORTE_REPOSITORIO);
  const suporte = comSuporte ? { github: clienteDoGitHub({ token: env.PRUMO_SUPORTE_TOKEN, repositorio: env.PRUMO_SUPORTE_REPOSITORIO }), chaveAdmin: env.PRUMO_SUPORTE_CHAVE_ADMIN } : null;
  const porta = Number(env.PORT) || 10000;
  http.createServer(criarServico({ enviar, configurado: comEmail, suporte })).listen(porta, () => console.log(`serviço do Prumo QA na porta ${porta} (e-mail: ${comEmail ? 'sim' : 'NÃO'}; suporte: ${comSuporte ? 'sim' : 'NÃO'}; administração: ${(env.PRUMO_SUPORTE_CHAVE_ADMIN || '').length >= 32 ? 'sim' : 'NÃO'})`));
}
