/**
 * Autorização de GitHub e Jira pelo navegador. O segredo dos aplicativos oficiais do Prumo (GitHub App e Jira OAuth) fica só aqui, no
 * serviço do Prumo: o instalador nunca o leva. O serviço troca o código pelas credenciais, entrega-as UMA vez ao app de quem pediu e
 * as apaga; o app as guarda no cofre do sistema e faz as consultas por conta própria. O mesmo caminho vale em Windows, macOS e Linux.
 */
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { ipDe, lerCorpo, lerObjeto, responder } from '../../compartilhado/servidor/comum.mjs';

const VALIDADE_MS = 5 * 60_000;
const ESCOPOS_DO_JIRA = 'read:jira-work read:jira-user write:jira-work offline_access';
const SERVICOS = ['github', 'jira'];

/** Cada serviço só liga com o conjunto completo de variáveis; sem elas a rota responde 503 e o resto do serviço segue normal. */
export function configuracaoDasIntegracoes(env = process.env) {
  let base = null; try { const u = new URL(String(env.BETTER_AUTH_URL)); if (u.protocol === 'https:') base = u.origin; } catch { /* sem endereço público */ }
  if (!base) return { github: null, jira: null };
  const retorno = (s) => `${base}/v1/integracoes/retorno/${s}`;
  return {
    github: env.PRUMO_GITHUB_APP_CLIENT_ID && env.PRUMO_GITHUB_APP_CLIENT_SECRET && /^[A-Za-z0-9-]{1,60}$/.test(env.PRUMO_GITHUB_APP_SLUG || '')
      ? { clientId: env.PRUMO_GITHUB_APP_CLIENT_ID, clientSecret: env.PRUMO_GITHUB_APP_CLIENT_SECRET, slug: env.PRUMO_GITHUB_APP_SLUG, callbackUrl: retorno('github') } : null,
    jira: env.PRUMO_JIRA_CLIENT_ID && env.PRUMO_JIRA_CLIENT_SECRET
      ? { clientId: env.PRUMO_JIRA_CLIENT_ID, clientSecret: env.PRUMO_JIRA_CLIENT_SECRET, escopos: env.PRUMO_JIRA_ESCOPOS || ESCOPOS_DO_JIRA, callbackUrl: retorno('jira') } : null
  };
}

// --- armazenamento das tentativas ---
const aleatorio = (bytes = 32) => randomBytes(bytes).toString('base64url');
const resumo = (texto) => createHash('sha256').update(texto).digest('hex');

/** Verificador PKCE e credenciais ficam cifrados (AES-256-GCM, chave derivada do segredo do serviço) enquanto esperam a retirada. */
export function cifrador(segredo) {
  const chave = Buffer.from(hkdfSync('sha256', String(segredo), 'prumo-integracoes', 'segredo-da-tentativa', 32));
  return {
    cifrar(valor, id) {
      const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', chave, iv); c.setAAD(Buffer.from(id));
      const dados = Buffer.concat([c.update(JSON.stringify(valor), 'utf8'), c.final()]);
      return Buffer.concat([iv, c.getAuthTag(), dados]).toString('base64');
    },
    abrir(texto, id) {
      const b = Buffer.from(texto, 'base64'); const d = createDecipheriv('aes-256-gcm', chave, b.subarray(0, 12)); d.setAAD(Buffer.from(id)); d.setAuthTag(b.subarray(12, 28));
      return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
    }
  };
}

/** Em memória: para testes e para quando não há banco. Reiniciar o serviço perde as tentativas em andamento (a pessoa só tenta de novo). */
export function armazenamentoEmMemoria() {
  const tentativas = new Map();
  return {
    async criar(t) { for (const [id, x] of tentativas) if (x.expiraEm < t.agora) tentativas.delete(id); tentativas.set(t.id, { ...t, situacao: 'PENDENTE' }); },
    async reivindicar({ servico, estadoHash, agora }) {
      const t = [...tentativas.values()].find((x) => x.servico === servico && x.estadoHash === estadoHash);
      if (!t || t.situacao !== 'PENDENTE' || t.expiraEm < agora) return null;
      t.situacao = 'PROCESSANDO'; return { id: t.id, ator: t.ator, segredo: t.segredo };
    },
    async finalizar(id, situacao, segredo) { const t = tentativas.get(id); if (t) { t.situacao = situacao; if (segredo !== undefined) t.segredo = segredo; } },
    async situacao({ id, ator, agora }) { const t = tentativas.get(id); if (!t || t.ator !== ator) return null; return t.expiraEm < agora && t.situacao !== 'PRONTO' ? 'EXPIRADA' : t.situacao; },
    async consumir({ id, ator, agora }) {
      const t = tentativas.get(id); if (!t || t.ator !== ator || t.situacao !== 'PRONTO' || t.expiraEm < agora) return null;
      tentativas.delete(id); return t.segredo;
    }
  };
}

export const SQL_DAS_TENTATIVAS = `CREATE TABLE IF NOT EXISTS prumo_integracao_tentativa (
  id text PRIMARY KEY, ator text NOT NULL, servico text NOT NULL, estado_hash text NOT NULL UNIQUE,
  situacao text NOT NULL, segredo text NOT NULL, expira_em timestamptz NOT NULL)`;

/** PostgreSQL do próprio serviço: sobrevive a reinício e cada passo é atômico (UPDATE ... RETURNING e DELETE ... RETURNING). */
export function armazenamentoPostgres(pool) {
  let pronta = null; const preparar = () => (pronta ||= pool.query(SQL_DAS_TENTATIVAS).then(() => undefined));
  const em = (ms) => new Date(ms);
  return {
    async criar(t) {
      await preparar(); await pool.query('DELETE FROM prumo_integracao_tentativa WHERE expira_em < $1', [em(t.agora)]);
      await pool.query('INSERT INTO prumo_integracao_tentativa (id, ator, servico, estado_hash, situacao, segredo, expira_em) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [t.id, t.ator, t.servico, t.estadoHash, 'PENDENTE', t.segredo, em(t.expiraEm)]);
    },
    async reivindicar({ servico, estadoHash, agora }) {
      await preparar();
      const r = await pool.query("UPDATE prumo_integracao_tentativa SET situacao='PROCESSANDO' WHERE estado_hash=$1 AND servico=$2 AND situacao='PENDENTE' AND expira_em>=$3 RETURNING id, ator, segredo", [estadoHash, servico, em(agora)]);
      return r.rows[0] ?? null;
    },
    async finalizar(id, situacao, segredo) {
      await preparar();
      if (segredo === undefined) await pool.query('UPDATE prumo_integracao_tentativa SET situacao=$2 WHERE id=$1', [id, situacao]);
      else await pool.query('UPDATE prumo_integracao_tentativa SET situacao=$2, segredo=$3 WHERE id=$1', [id, situacao, segredo]);
    },
    async situacao({ id, ator, agora }) {
      await preparar();
      const r = await pool.query('SELECT situacao, expira_em FROM prumo_integracao_tentativa WHERE id=$1 AND ator=$2', [id, ator]);
      const t = r.rows[0]; if (!t) return null;
      return new Date(t.expira_em).getTime() < agora && t.situacao !== 'PRONTO' ? 'EXPIRADA' : t.situacao;
    },
    async consumir({ id, ator, agora }) {
      await preparar();
      const r = await pool.query("DELETE FROM prumo_integracao_tentativa WHERE id=$1 AND ator=$2 AND situacao='PRONTO' AND expira_em>=$3 RETURNING segredo", [id, ator, em(agora)]);
      return r.rows[0]?.segredo ?? null;
    }
  };
}

// --- troca de credenciais com o provedor ---
const falha = (codigo) => Object.assign(new Error(codigo), { codigo });

/** Valida a resposta de credenciais do provedor e converte "expira em N segundos" em data absoluta. */
function credencialDe(resposta, agora) {
  const acesso = resposta?.access_token;
  if (resposta?.error || typeof acesso !== 'string' || !acesso || acesso.length > 4000) throw falha('TOKEN_EXCHANGE_FAILED');
  const renovacao = typeof resposta.refresh_token === 'string' && resposta.refresh_token && resposta.refresh_token.length <= 2000 ? resposta.refresh_token : undefined;
  const segundos = Number(resposta.expires_in);
  return { acesso, ...(renovacao ? { renovacao } : {}), ...(Number.isFinite(segundos) && segundos > 0 ? { expiraEm: agora + segundos * 1000 } : {}) };
}

export function criarBroker({ config, armazenamento, cifra, fetcher = fetch, agora = Date.now }) {
  const configurado = (servico) => { if (!SERVICOS.includes(servico)) throw falha('INVALID_SERVICE'); if (!config[servico]) throw falha('INTEGRATION_NOT_CONFIGURED'); return config[servico]; };
  const pedir = async (url, opcoes) => {
    let r; try { r = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(15_000), ...opcoes }); } catch { throw falha('PROVIDER_UNAVAILABLE'); }
    if (!r.ok) throw falha('PROVIDER_HTTP_' + r.status);
    try { return await r.json(); } catch { throw falha('PROVIDER_INVALID_RESPONSE'); }
  };
  const json = (corpo) => ({ method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });

  function urlDeAutorizacao(servico, c, estado, desafio) {
    if (servico === 'github') return 'https://github.com/login/oauth/authorize?' + new URLSearchParams({ client_id: c.clientId, redirect_uri: c.callbackUrl, state: estado, code_challenge: desafio, code_challenge_method: 'S256' });
    return 'https://auth.atlassian.com/authorize?' + new URLSearchParams({ audience: 'api.atlassian.com', client_id: c.clientId, scope: c.escopos, redirect_uri: c.callbackUrl, state: estado, response_type: 'code', prompt: 'consent' });
  }

  async function trocarCodigo(servico, c, codigo, verificador) {
    if (servico === 'github') return credencialDe(await pedir('https://github.com/login/oauth/access_token', json({ client_id: c.clientId, client_secret: c.clientSecret, code: codigo, redirect_uri: c.callbackUrl, code_verifier: verificador })), agora());
    return credencialDe(await pedir('https://auth.atlassian.com/oauth/token', json({ grant_type: 'authorization_code', client_id: c.clientId, client_secret: c.clientSecret, code: codigo, redirect_uri: c.callbackUrl })), agora());
  }

  /** Sites Jira que a pessoa autorizou; só id de nuvem, nome e endereço *.atlassian.net seguem para o app. */
  async function sitesDoJira(acesso) {
    const lista = await pedir('https://api.atlassian.com/oauth/token/accessible-resources', { headers: { Authorization: 'Bearer ' + acesso, Accept: 'application/json' } });
    if (!Array.isArray(lista)) throw falha('JIRA_RESOURCES_INVALID');
    return lista.filter((s) => typeof s?.id === 'string' && /^[0-9a-f-]{36}$/.test(s.id) && typeof s.url === 'string' && /^https:\/\/[a-z0-9-]+\.atlassian\.net\/?$/.test(s.url))
      .slice(0, 50).map((s) => ({ id: s.id, nome: String(s.name || s.url).slice(0, 200), url: s.url.replace(/\/$/, '') }));
  }

  return {
    /** Só depois de o app provar a sessão: `ator` vem da sessão verificada, nunca do corpo do pedido. */
    async iniciar({ ator, servico }) {
      const c = configurado(servico); const id = aleatorio(24); const estado = aleatorio(); const verificador = aleatorio(48);
      const t = agora();
      await armazenamento.criar({ id, ator, servico, estadoHash: resumo(estado), expiraEm: t + VALIDADE_MS, agora: t, segredo: cifra.cifrar({ verificador }, id) });
      return { tentativa: id, url: urlDeAutorizacao(servico, c, estado, createHash('sha256').update(verificador).digest('base64url')),
        ...(servico === 'github' ? { instalarUrl: `https://github.com/apps/${c.slug}/installations/new` } : {}) };
    },
    /** Retorno do navegador: só code e state; consumo único, e o navegador nunca recebe credencial. */
    async concluirRetorno({ servico, estado, codigo, erro }) {
      const c = configurado(servico);
      const t = await armazenamento.reivindicar({ servico, estadoHash: resumo(String(estado || '')), agora: agora() });
      if (!t) throw falha('OAUTH_STATE_INVALID');
      if (erro || !codigo || String(codigo).length > 2000) { await armazenamento.finalizar(t.id, 'NEGADO'); return 'NEGADO'; }
      try {
        const { verificador } = cifra.abrir(t.segredo, t.id);
        const credencial = await trocarCodigo(servico, c, String(codigo), verificador);
        const entrega = servico === 'jira' ? { ...credencial, sites: await sitesDoJira(credencial.acesso) } : credencial;
        await armazenamento.finalizar(t.id, 'PRONTO', cifra.cifrar(entrega, t.id)); return 'PRONTO';
      } catch { await armazenamento.finalizar(t.id, 'ERRO'); return 'ERRO'; }
    },
    /** O app pergunta antes de oferecer "Conectar pelo navegador": só os serviços com o aplicativo oficial configurado aparecem como disponíveis. */
    disponiveis: () => ({ github: !!config.github, jira: !!config.jira }),
    async estado({ ator, tentativa }) {
      const s = await armazenamento.situacao({ id: String(tentativa), ator, agora: agora() });
      if (!s) throw falha('ATTEMPT_NOT_FOUND');
      return { estado: { PENDENTE: 'PENDENTE', PROCESSANDO: 'PENDENTE', PRONTO: 'PRONTO', NEGADO: 'NEGADO', ERRO: 'ERRO', EXPIRADA: 'EXPIRADO' }[s] ?? 'ERRO' };
    },
    /** Entrega única: depois disto o serviço não guarda mais nada da pessoa. */
    async retirar({ ator, tentativa }) {
      const id = String(tentativa); const segredo = await armazenamento.consumir({ id, ator, agora: agora() });
      if (!segredo) throw falha('ATTEMPT_NOT_FOUND');
      return cifra.abrir(segredo, id);
    },
    /** O refresh token gira a cada uso (GitHub e Atlassian): quem renova recebe o novo par e deve guardá-lo no mesmo instante. */
    async renovar({ servico, renovacao }) {
      const c = configurado(servico); if (typeof renovacao !== 'string' || !renovacao || renovacao.length > 2000) throw falha('INVALID_REFRESH_TOKEN');
      if (servico === 'github') return credencialDe(await pedir('https://github.com/login/oauth/access_token', json({ client_id: c.clientId, client_secret: c.clientSecret, grant_type: 'refresh_token', refresh_token: renovacao })), agora());
      return credencialDe(await pedir('https://auth.atlassian.com/oauth/token', json({ grant_type: 'refresh_token', client_id: c.clientId, client_secret: c.clientSecret, refresh_token: renovacao })), agora());
    },
    /** GitHub revoga o acesso do aplicativo; a Atlassian não tem revogação por API, então o acesso só vence sozinho (a pessoa pode retirá-lo em id.atlassian.com). */
    async revogar({ servico, acesso }) {
      const c = configurado(servico); if (typeof acesso !== 'string' || !acesso || acesso.length > 4000) throw falha('INVALID_ACCESS_TOKEN');
      if (servico !== 'github') return { revogado: false };
      let r; try { r = await fetcher(`https://api.github.com/applications/${encodeURIComponent(c.clientId)}/token`, { method: 'DELETE', redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Prumo-QA', Authorization: 'Basic ' + Buffer.from(c.clientId + ':' + c.clientSecret).toString('base64'), 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: acesso }) }); }
      catch { throw falha('PROVIDER_UNAVAILABLE'); }
      return { revogado: r.status === 204 || r.status === 404 };
    }
  };
}

// --- rotas HTTP ---
const PAGINAS = {
  PRONTO: ['Autorização concluída', 'Tudo certo. Volte ao Prumo QA: a conexão termina sozinha.'],
  NEGADO: ['Autorização cancelada', 'Nada foi conectado. Volte ao Prumo QA para tentar de novo.'],
  ERRO: ['Não foi possível conectar', 'Volte ao Prumo QA e tente novamente.'],
  INVALIDO: ['Pedido recusado', 'Este link de autorização não é válido ou já foi usado. Volte ao Prumo QA e comece de novo.']
};
const pagina = (res, status, chave) => {
  const [titulo, texto] = PAGINAS[chave];
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" });
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prumo QA</title><body style="font:16px system-ui;margin:12vh auto;max-width:28rem;text-align:center;padding:0 1rem"><h1>${titulo}</h1><p>${texto}</p></body></html>`);
};
const STATUS_DOS_ERROS = { INTEGRATION_NOT_CONFIGURED: 503, INVALID_SERVICE: 400, ATTEMPT_NOT_FOUND: 404, INVALID_REFRESH_TOKEN: 400, INVALID_ACCESS_TOKEN: 400, OAUTH_STATE_INVALID: 400 };

/**
 * `sessao(req)` devolve o id da conta do Prumo (Better Auth, e-mail confirmado) ou null. Rotas que mexem em credenciais exigem sessão e
 * JSON com Content-Type próprio (o navegador de outro site não consegue enviar isso sem pré-verificação); o retorno do provedor só aceita GET.
 */
export function rotaDeIntegracoes({ broker, sessao, limitador, registrar = () => {} }) {
  const limitado = (chave, janela, max) => { const j = [[chave, janela, max]]; if (limitador.excede(j)) return true; limitador.marcar(j); return false; };
  return async function atender(req, res, caminho, parametros) {
    const rota = caminho.slice('/v1/integracoes/'.length);
    if (req.method === 'GET' && rota.startsWith('retorno/')) {
      if (limitado('integracao-retorno:' + ipDe(req), 60_000, 30)) return responder(res, 429, { erro: 'RATE_LIMIT' });
      try {
        const situacao = await broker.concluirRetorno({ servico: rota.slice('retorno/'.length), estado: parametros.get('state'), codigo: parametros.get('code'), erro: parametros.get('error') });
        return pagina(res, 200, situacao);
      } catch (e) { return pagina(res, e.codigo === 'INTEGRATION_NOT_CONFIGURED' ? 503 : 400, 'INVALIDO'); }
    }
    const ator = await sessao(req);
    if (!ator) return responder(res, 401, { erro: 'SESSION_REQUIRED' });
    try {
      if (req.method === 'GET' && rota === 'disponiveis') return responder(res, 200, broker.disponiveis());
      if (req.method === 'GET' && rota === 'estado') {
        if (limitado('integracao-estado:' + ator, 60_000, 90)) return responder(res, 429, { erro: 'RATE_LIMIT' });
        return responder(res, 200, await broker.estado({ ator, tentativa: parametros.get('tentativa') }));
      }
      if (req.method !== 'POST' || !['iniciar', 'retirar', 'renovar', 'revogar'].includes(rota)) return responder(res, 404, { erro: 'NOT_FOUND' });
      if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return responder(res, 415, { erro: 'UNSUPPORTED_MEDIA_TYPE' });
      if (limitado(`integracao-${rota}:${ator}`, 60_000, rota === 'iniciar' ? 10 : 30)) return responder(res, 429, { erro: 'RATE_LIMIT' });
      const buffer = await lerCorpo(req, 4096); if (!buffer) return responder(res, 413, { erro: 'TOO_LARGE' });
      const corpo = lerObjeto(buffer); if (!corpo) return responder(res, 400, { erro: 'INVALID_BODY' });
      const resposta = rota === 'iniciar' ? await broker.iniciar({ ator, servico: corpo.servico })
        : rota === 'retirar' ? await broker.retirar({ ator, tentativa: corpo.tentativa })
        : rota === 'renovar' ? await broker.renovar({ servico: corpo.servico, renovacao: corpo.renovacao })
        : await broker.revogar({ servico: corpo.servico, acesso: corpo.acesso });
      return responder(res, 200, resposta);
    } catch (e) {
      // Só códigos fixos vão ao registro e à resposta: mensagens de provedor podem carregar tokens.
      const codigo = e?.codigo || 'INTEGRATION_FAILED'; registrar('INTEGRATION_' + codigo);
      return responder(res, STATUS_DOS_ERROS[codigo] ?? 502, { erro: STATUS_DOS_ERROS[codigo] ? codigo : 'INTEGRATION_FAILED' });
    }
  };
}

/** Atalho do servidor real: liga o broker ao PostgreSQL e à sessão do Better Auth, ou devolve null quando nada está configurado. */
export function integracoesDoServico({ env = process.env, autenticacao, pool, limitador, registrar, fetcher }) {
  const config = configuracaoDasIntegracoes(env);
  if (!autenticacao || (!config.github && !config.jira)) return null;
  const broker = criarBroker({ config, fetcher, cifra: cifrador(env.BETTER_AUTH_SECRET), armazenamento: pool ? armazenamentoPostgres(pool) : armazenamentoEmMemoria() });
  const sessao = async (req) => {
    try { const s = await autenticacao.auth.api.getSession({ headers: new Headers(req.headers) }); return s?.user?.emailVerified === true ? String(s.user.id) : null; } catch { return null; }
  };
  return rotaDeIntegracoes({ broker, sessao, limitador, registrar });
}

