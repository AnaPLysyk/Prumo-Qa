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

export { mensagem, enviarPeloResend } from '../../login/servidor/codigos.mjs';

/**
 * Cria o atendimento HTTP. `enviar` (Resend) e `suporte.github` são injetados: os testes usam uma caixa e um repositório em memória.
 * Sem configuração, cada parte recusa com 503 e o resto continua funcionando.
 */
export function criarServico({ enviar, configurado = true, limites = LIMITES, suporte = null, autenticacao = null, agora = () => Date.now(), registrar = (linha) => console.log(linha) }) {
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
      if (req.method === 'GET' && caminho === '/conta-confirmada') {
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});
        return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Prumo QA — E-mail confirmado</title><body style="font-family:system-ui;background:#101820;color:#fff;text-align:center;padding:4rem"><h1>E-mail confirmado</h1><p>Volte ao aplicativo Prumo QA para entrar com sua conta.</p></body></html>');
      }
      if (req.method === 'GET' && (caminho === '/recuperar-senha' || caminho === '/recuperar-senha.js')) {
        if (!autenticacao) return responder(res, 503, { erro: 'AUTH_NOT_CONFIGURED' });
        const js=caminho.endsWith('.js');const nome=js?'recuperar-senha.js':'recuperar-senha.html';
        res.writeHead(200,{
          'Content-Type':js?'text/javascript; charset=utf-8':'text/html; charset=utf-8',
          'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
          'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
          'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
        });
        return res.end(fs.readFileSync(new URL('../../../frontend/login/web/'+nome,import.meta.url)));
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

/** Inicialização segura durante a configuração gradual de credenciais no Render.
 * Nunca habilita sessões enquanto banco, segredo e envio de e-mails estiverem incompletos.
 */
export function estadoDaAutenticacao(env = process.env) {
  const chaves = ['BETTER_AUTH_URL', 'DATABASE_URL', 'BETTER_AUTH_SECRET', 'RESEND_API_KEY', 'PRUMO_EMAIL_REMETENTE'];
  const informadas = chaves.filter(chave => !!String(env[chave] ?? '').trim()).length;
  return { configurada: informadas === chaves.length, incompleta: informadas > 0 && informadas < chaves.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  const comEmail = !!(env.RESEND_API_KEY && env.PRUMO_EMAIL_REMETENTE);
  const enviar = comEmail ? enviarPeloResend({ chave: env.RESEND_API_KEY, remetente: env.PRUMO_EMAIL_REMETENTE }) : async () => { throw new Error('sem configuração'); };
  const comSuporte = !!(env.PRUMO_SUPORTE_TOKEN && env.PRUMO_SUPORTE_REPOSITORIO);
  const suporte = comSuporte ? { github: clienteDoGitHub({ token: env.PRUMO_SUPORTE_TOKEN, repositorio: env.PRUMO_SUPORTE_REPOSITORIO }), chaveAdmin: env.PRUMO_SUPORTE_CHAVE_ADMIN } : null;
  // Credenciais podem ser provisionadas em etapas no Render. Sem o conjunto completo,
  // login segue desabilitado (503), mas as rotas existentes continuam disponíveis.
  const estado = estadoDaAutenticacao(env);
  let autenticacao=null;
  if(estado.configurada){
    const {criarAutenticacao}=await import('../../login/servidor/autenticacao.mjs');
    autenticacao=criarAutenticacao({env});
  } else if (estado.incompleta) {
    console.warn('Autenticação central incompleta: login permanece desabilitado.');
  }
  const porta = Number(env.PORT) || 10000;
  http.createServer(criarServico({ enviar, configurado: comEmail, suporte, autenticacao })).listen(porta, () => console.log(`serviço do Prumo QA na porta ${porta} (e-mail: ${comEmail ? 'sim' : 'NÃO'}; suporte: ${comSuporte ? 'sim' : 'NÃO'}; administração: ${(env.PRUMO_SUPORTE_CHAVE_ADMIN || '').length >= 32 ? 'sim' : 'NÃO'})`));
}
