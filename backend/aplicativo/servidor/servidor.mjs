/**
 * Serviço do Prumo QA (Render): manda os códigos de confirmação por e-mail (Resend) e recebe os chamados de suporte (repositório
 * privado no GitHub). O módulo remoto de login usa Better Auth e PostgreSQL. Chaves e tokens ficam apenas no Render, nunca no instalador.
 */
import http from 'node:http';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { criarLimitador, responder } from '../../compartilhado/servidor/comum.mjs';
import { LIMITES, enviarPeloResend, rotaDeCodigos } from '../../login/servidor/codigos.mjs';
import { LIMITES_DE_CHAMADOS, rotaDeChamados } from '../../suporte/servidor/chamados.mjs';
import { clienteDoGitHub } from '../../suporte/servidor/github.mjs';
import { integracoesDoServico } from '../../conexoes/servidor/autorizacao.mjs';
import { SITE } from '../../login/servidor/modeloDeEmail.mjs';

// Caminhos a partir de frontend/: páginas e script ficam no login; o estilo, no Design System (pasta web/, fora do instalador).
const PAGINAS_DOS_EMAILS = new Map([['/conta-confirmada', 'login/web/conta-confirmada.html'], ['/recuperar-senha', 'login/web/recuperar-senha.html'],
  ['/recuperar-senha.js', 'login/web/recuperar-senha.js'], ['/paginas.css', 'design-system/web/paginas.css']]);

export { mensagem, enviarPeloResend } from '../../login/servidor/codigos.mjs';

/**
 * Cria o atendimento HTTP. `enviar` (Resend) e `suporte.github` são injetados: os testes usam uma caixa e um repositório em memória.
 * Sem configuração, cada parte recusa com 503 e o resto continua funcionando.
 */
export function criarServico({ enviar, configurado = true, limites = LIMITES, suporte = null, autenticacao = null, integracoes = null, agora = () => Date.now(), registrar = (linha) => console.log(linha) }) {
  const limitador = criarLimitador(agora);
  const codigos = rotaDeCodigos({ enviar, configurado, limites, limitador, registrar });
  const chamados = rotaDeChamados({ github: suporte?.github, configurado: !!suporte?.github, chaveAdmin: suporte?.chaveAdmin, limites: suporte?.limites ?? LIMITES_DE_CHAMADOS, limitador, registrar, agora });
  return async function atender(req, res) {
    let url; try { url = new URL(req.url || '/', 'http://servico'); } catch { return responder(res, 400, { erro: 'NOT_FOUND' }); }
    const caminho = url.pathname;
    try {
      if(req.method==='GET'&&caminho==='/saude/autenticacao'){
        if(!autenticacao)return responder(res,503,{autenticacao:false});
        try{await autenticacao.checar();return responder(res,200,{autenticacao:true});}
        catch{return responder(res,503,{autenticacao:false});}
      }
      if (req.method === 'GET' && caminho === '/saude') return responder(res, 200, { ok: true, email: configurado, suporte: !!suporte?.github, administracao: typeof suporte?.chaveAdmin === 'string' && suporte.chaveAdmin.length >= 32 });
      if (caminho.startsWith('/api/auth/')) {
        if (!autenticacao) return responder(res, 503, { erro: 'AUTH_NOT_CONFIGURED' });
        return await autenticacao.atender(req,res);
      }
      // Páginas abertas pelos links dos e-mails, com a aparência da tela de entrada. O Better Auth volta para
      // /conta-confirmada?error=... quando o link venceu: nesse caso a página não pode dizer que confirmou.
      const paginaWeb = req.method === 'GET' && PAGINAS_DOS_EMAILS.get(caminho);
      if (paginaWeb) {
        if (!autenticacao) return responder(res, 503, { erro: 'AUTH_NOT_CONFIGURED' });
        const nome = caminho === '/conta-confirmada' && url.searchParams.has('error') ? 'login/web/confirmacao-recusada.html' : paginaWeb;
        res.writeHead(200, {
          'Content-Type': { html: 'text/html', js: 'text/javascript', css: 'text/css' }[nome.split('.').pop()] + '; charset=utf-8',
          'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
          'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
          'Content-Security-Policy': `default-src 'none'; script-src 'self'; style-src 'self'; img-src ${SITE}; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`
        });
        return res.end(fs.readFileSync(new URL('../../../frontend/' + nome, import.meta.url)));
      }
      if (caminho.startsWith('/v1/integracoes/')) {
        // GitHub App e Jira OAuth pelo navegador: sem as variáveis do aplicativo oficial a rota recusa, e o resto do serviço segue.
        if (!integracoes) return responder(res, 503, { erro: 'INTEGRATION_NOT_CONFIGURED' });
        return await integracoes(req, res, caminho, url.searchParams);
      }
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
  // Não inicia login parcial: se alguma variável de autenticação existir, exige todas.
  let autenticacao=null;
  if(env.DATABASE_URL || env.BETTER_AUTH_SECRET || env.BETTER_AUTH_URL){
    const {criarAutenticacao}=await import('../../login/servidor/autenticacao.mjs');
    autenticacao=criarAutenticacao({env});
  }
  const porta = Number(env.PORT) || 10000;
  const integracoes = integracoesDoServico({ env, autenticacao, pool: autenticacao?.pool, limitador: criarLimitador(), registrar: (linha) => console.log(linha) });
  http.createServer(criarServico({ enviar, configurado: comEmail, suporte, autenticacao, integracoes })).listen(porta, () => console.log(`serviço do Prumo QA na porta ${porta} (e-mail: ${comEmail ? 'sim' : 'NÃO'}; suporte: ${comSuporte ? 'sim' : 'NÃO'}; administração: ${(env.PRUMO_SUPORTE_CHAVE_ADMIN || '').length >= 32 ? 'sim' : 'NÃO'})`));
}
