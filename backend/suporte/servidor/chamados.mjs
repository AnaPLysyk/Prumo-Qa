/**
 * Rotas dos chamados de suporte. Quem abre não precisa de conta no GitHub: o serviço grava cada chamado como issue no
 * repositório PRIVADO da equipe e os anexos (imagem e vídeo) como arquivos nesse repositório.
 *
 * - Quem abre recebe uma chave aleatória (256 bits), mostrada uma vez; o serviço guarda só o resumo SHA-256 dela no chamado.
 *   Com a chave a pessoa envia os anexos (até 2 horas depois) e acompanha estado e respostas. Sem a chave certa, o chamado "não existe".
 * - A equipe lê tudo, responde e muda o estado com a chave de administração (PRUMO_SUPORTE_CHAVE_ADMIN), conferida em tempo constante.
 * - Texto da pessoa vai no chamado dentro de blocos de código (sem menção, link ou HTML ativos) e, para leitura, num bloco base64.
 * - Anexo só com tipo permitido, tamanho declarado e assinatura do arquivo conferida (extensão trocada não passa).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { EMAIL, ipDe, lerCorpo, lerObjeto, responder, textoLimpo } from '../../compartilhado/servidor/comum.mjs';

export const CATEGORIAS = { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' };
export const ESTADOS = ['NOVO', 'EM_ANALISE', 'RESOLVIDO', 'FECHADO'];
const MB = 1024 * 1024;
export const TIPOS_DE_ANEXO = {
  'image/png': { tipo: 'imagem', maximo: 5 * MB, extensao: 'png' }, 'image/jpeg': { tipo: 'imagem', maximo: 5 * MB, extensao: 'jpg' }, 'image/webp': { tipo: 'imagem', maximo: 5 * MB, extensao: 'webp' },
  'video/mp4': { tipo: 'video', maximo: 25 * MB, extensao: 'mp4' }, 'video/webm': { tipo: 'video', maximo: 25 * MB, extensao: 'webm' }
};
export const QUANTOS_ANEXOS = { imagem: 3, video: 1 };
export const LIMITES_DE_CHAMADOS = { porIpHora: 10, totalHora: 200, anexosPorIpHora: 40, leiturasPorIpHora: 240, errosDeAdminPorIpHora: 10 };
const ROTULO = 'prumo-suporte';
const PRAZO_DOS_ANEXOS = 2 * 3_600_000;
const MARCA_DE_RESPOSTA = '<!-- prumo-resposta -->';

/** A assinatura (primeiros bytes) precisa bater com o tipo declarado. */
export function assinaturaConfere(tipo, b) {
  const comeca = (...bytes) => bytes.every((x, i) => b[i] === x);
  if (tipo === 'image/png') return comeca(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (tipo === 'image/jpeg') return comeca(0xff, 0xd8, 0xff);
  if (tipo === 'image/webp') return b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
  if (tipo === 'video/mp4') return b.length > 12 && b.toString('latin1', 4, 8) === 'ftyp';
  if (tipo === 'video/webm') return comeca(0x1a, 0x45, 0xdf, 0xa3);
  return false;
}

const resumo = (chave) => createHash('sha256').update(String(chave)).digest('hex');
const iguais = (a, b) => { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const umaLinha = (t) => (t ? t.replace(/\s*\n\s*/g, ' ') : t);
/** Bloco de código que nenhum trecho do texto consegue fechar (a cerca é maior que qualquer sequência de ~ do texto). */
const cerca = (texto) => { const f = '~'.repeat(Math.max(3, ...[...texto.matchAll(/~+/g)].map((m) => m[0].length + 1))); return `${f}text\n${texto}\n${f}`; };
const nomeSeguro = (nome, tipo) => { const base = nome.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'anexo'; return base + '.' + TIPOS_DE_ANEXO[tipo].extensao; };

/** Confere o chamado enviado pelo aplicativo: só campos conhecidos, tamanhos e anexos declarados dentro dos limites. */
export function lerChamado(d) {
  const permitidos = ['categoria', 'titulo', 'descricao', 'passos', 'esperado', 'versao', 'sistema', 'diagnostico', 'contato', 'anexos'];
  if (!d || Object.keys(d).some((k) => !permitidos.includes(k)) || !Object.hasOwn(CATEGORIAS, d.categoria)) return null;
  const opcional = (v, max) => (v === undefined || v === null || v === '' ? undefined : textoLimpo(v, 1, max) ?? false);
  const titulo = umaLinha(textoLimpo(d.titulo, 5, 120)); const descricao = textoLimpo(d.descricao, 10, 4000);
  const passos = opcional(d.passos, 2000), esperado = opcional(d.esperado, 2000), diagnostico = opcional(d.diagnostico, 4000), sistema = umaLinha(opcional(d.sistema, 120));
  if (!titulo || !descricao || [passos, esperado, diagnostico, sistema].includes(false)) return null;
  if (d.versao !== undefined && !(typeof d.versao === 'string' && /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(d.versao))) return null;
  let contato;
  if (d.contato !== undefined) {
    const c = d.contato; if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).some((k) => !['nome', 'email'].includes(k))) return null;
    const nome = umaLinha(textoLimpo(c.nome, 2, 80)); if (!nome) return null;
    const email = c.email === undefined || c.email === null ? undefined : typeof c.email === 'string' && c.email.length <= 254 && EMAIL.test(c.email.trim().toLowerCase()) ? c.email.trim().toLowerCase() : false;
    if (email === false) return null; contato = { nome, ...(email ? { email } : {}) };
  }
  const lista = d.anexos ?? []; if (!Array.isArray(lista) || lista.length > QUANTOS_ANEXOS.imagem + QUANTOS_ANEXOS.video) return null;
  const anexos = []; const contagem = { imagem: 0, video: 0 };
  for (const a of lista) {
    if (!a || typeof a !== 'object' || Object.keys(a).some((k) => !['nome', 'tipo', 'tamanho'].includes(k))) return null;
    const regra = Object.hasOwn(TIPOS_DE_ANEXO, a.tipo) ? TIPOS_DE_ANEXO[a.tipo] : null; const nome = umaLinha(textoLimpo(a.nome, 1, 120));
    if (!regra || !nome || !Number.isInteger(a.tamanho) || a.tamanho < 1 || a.tamanho > regra.maximo) return null;
    if (++contagem[regra.tipo] > QUANTOS_ANEXOS[regra.tipo]) return null;
    anexos.push({ nome, tipo: a.tipo, tamanho: a.tamanho, arquivo: anexos.length + '-' + nomeSeguro(nome, a.tipo) });
  }
  return { categoria: d.categoria, titulo, descricao, ...(passos ? { passos } : {}), ...(esperado ? { esperado } : {}), ...(d.versao ? { versao: d.versao } : {}), ...(sistema ? { sistema } : {}), ...(diagnostico ? { diagnostico } : {}), ...(contato ? { contato } : {}), anexos };
}

function corpoDoChamado(dados, resumoDaChave) {
  const bloco = Buffer.from(JSON.stringify({ v: 1, chave: resumoDaChave, dados })).toString('base64');
  const secao = (titulo, texto) => (texto ? [`### ${titulo}`, cerca(texto)] : []);
  return [`<!-- prumo-chamado:${bloco} -->`, `**Categoria:** ${CATEGORIAS[dados.categoria]}${dados.versao ? ` · **Versão:** ${dados.versao}` : ''}`,
    ...secao('Quem abriu', dados.contato ? dados.contato.nome + (dados.contato.email ? ' <' + dados.contato.email + '>' : '') : 'Não informado'),
    ...secao('Descrição', dados.descricao), ...secao('Passos para reproduzir', dados.passos), ...secao('Resultado ou benefício esperado', dados.esperado),
    ...secao('Sistema', dados.sistema), ...secao('Diagnóstico da interface', dados.diagnostico),
    ...secao('Anexos', dados.anexos.map((a) => `${a.arquivo} (${a.tipo}, ${a.tamanho} bytes)`).join('\n')),
    '', '_Aberto pelo Suporte do Prumo QA._'].join('\n');
}

/** Lê o bloco do chamado gravado no corpo do issue; issue sem o rótulo ou sem o bloco não é chamado do Prumo. */
function lerDoIssue(issue) {
  if (!issue || issue.pull_request || !(issue.labels || []).some((l) => (l.name ?? l) === ROTULO)) return null;
  const m = /<!-- prumo-chamado:([A-Za-z0-9+/=]+) -->/.exec(issue.body || ''); if (!m) return null;
  try { const b = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')); return b && b.v === 1 && typeof b.chave === 'string' && b.dados ? b : null; } catch { return null; }
}
function estadoDo(issue) {
  const r = (issue.labels || []).map((l) => l.name ?? l).find((n) => n.startsWith('estado:'));
  const e = r ? r.slice(7).toUpperCase().replace('-', '_') : null;
  return ESTADOS.includes(e) ? e : issue.state === 'closed' ? 'FECHADO' : 'NOVO';
}
const respostasDe = (comentarios) => comentarios.filter((c) => typeof c.body === 'string' && c.body.startsWith(MARCA_DE_RESPOSTA)).map((c) => ({ em: c.created_at, texto: c.body.slice(MARCA_DE_RESPOSTA.length).trim() }));
const resumoDoChamado = (issue, b) => ({ numero: issue.number, titulo: b.dados.titulo, categoria: b.dados.categoria, estado: estadoDo(issue), contato: b.dados.contato?.nome ?? null, criadoEm: issue.created_at, atualizadoEm: issue.updated_at, anexos: b.dados.anexos.length });

/** Todas as rotas de chamados. `github` é injetado: os testes usam um repositório em memória e nunca falam com o GitHub. */
export function rotaDeChamados({ github, configurado, chaveAdmin, limites = LIMITES_DE_CHAMADOS, limitador, registrar, agora = () => Date.now() }) {
  const adminPronto = typeof chaveAdmin === 'string' && chaveAdmin.length >= 32;
  const falhaDoGitHub = (res, e) => { registrar('falha ao falar com o GitHub: ' + String(e?.message || e).slice(0, 120)); responder(res, 502, { erro: 'SUPPORT_UPSTREAM_FAILED' }); };
  const naoExiste = (res) => responder(res, 404, { erro: 'TICKET_NOT_FOUND' });
  /** Chamado com a chave da pessoa; chave errada e chamado inexistente respondem igual. */
  const comChave = async (req, n) => { const chave = String(req.headers['x-prumo-chamado'] || ''); if (chave.length < 20 || chave.length > 100) return null; const issue = await github.lerIssue(n); const b = lerDoIssue(issue); return b && iguais(b.chave, resumo(chave)) ? { issue, b } : null; };

  async function abrir(req, res) {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return responder(res, 415, { erro: 'BODY_INVALID' });
    const corpo = await lerCorpo(req, 32 * 1024); if (!corpo) return responder(res, 413, { erro: 'BODY_INVALID' });
    const dados = lerChamado(lerObjeto(corpo)); if (!dados) return responder(res, 400, { erro: 'TICKET_INVALID' });
    const janelas = [['chamados-ip:' + ipDe(req), 3_600_000, limites.porIpHora], ['chamados-total', 3_600_000, limites.totalHora]];
    if (limitador.excede(janelas)) return responder(res, 429, { erro: 'SUPPORT_RATE_LIMIT' }, { 'Retry-After': '3600' });
    limitador.marcar(janelas);
    const chave = randomBytes(32).toString('base64url');
    let issue; try { issue = await github.criarIssue({ titulo: `[${CATEGORIAS[dados.categoria]}] ${dados.titulo}`, corpo: corpoDoChamado(dados, resumo(chave)), rotulos: [ROTULO, 'categoria:' + dados.categoria, 'estado:novo'] }); } catch (e) { return falhaDoGitHub(res, e); }
    registrar('chamado #' + issue.number + ' aberto (' + dados.categoria + ', ' + dados.anexos.length + ' anexo(s))');
    responder(res, 201, { numero: issue.number, chave, anexos: dados.anexos.map((a, i) => ({ indice: i, tipo: a.tipo, tamanho: a.tamanho })) });
  }

  async function anexar(req, res, n, i) {
    const janelas = [['anexos-ip:' + ipDe(req), 3_600_000, limites.anexosPorIpHora]];
    if (limitador.excede(janelas)) return responder(res, 429, { erro: 'SUPPORT_RATE_LIMIT' }, { 'Retry-After': '3600' });
    limitador.marcar(janelas);
    let achado; try { achado = await comChave(req, n); } catch (e) { return falhaDoGitHub(res, e); }
    if (!achado) return naoExiste(res);
    const a = achado.b.dados.anexos[i]; if (!a) return responder(res, 400, { erro: 'ATTACHMENT_INVALID' });
    if (agora() - Date.parse(achado.issue.created_at) > PRAZO_DOS_ANEXOS) return responder(res, 410, { erro: 'ATTACHMENT_WINDOW_CLOSED' });
    if (String(req.headers['content-type'] || '') !== a.tipo) return responder(res, 415, { erro: 'ATTACHMENT_INVALID' });
    const bytes = await lerCorpo(req, a.tamanho); if (!bytes) return responder(res, 413, { erro: 'ATTACHMENT_TOO_LARGE' });
    if (bytes.length !== a.tamanho || !assinaturaConfere(a.tipo, bytes)) return responder(res, 400, { erro: 'ATTACHMENT_INVALID' });
    let novo; try { novo = await github.gravarArquivo(`chamados/${n}/${a.arquivo}`, bytes, `Anexo ${i} do chamado #${n}`); } catch (e) { return falhaDoGitHub(res, e); }
    if (!novo) return responder(res, 409, { erro: 'ATTACHMENT_EXISTS' });
    registrar('anexo ' + i + ' do chamado #' + n + ' recebido (' + a.tipo + ', ' + bytes.length + ' bytes)');
    responder(res, 201, { recebido: true });
  }

  async function acompanhar(req, res, n) {
    const janelas = [['leituras-ip:' + ipDe(req), 3_600_000, limites.leiturasPorIpHora]];
    if (limitador.excede(janelas)) return responder(res, 429, { erro: 'SUPPORT_RATE_LIMIT' }, { 'Retry-After': '3600' });
    limitador.marcar(janelas);
    try {
      const achado = await comChave(req, n); if (!achado) return naoExiste(res);
      const { issue, b } = achado;
      responder(res, 200, { numero: n, titulo: b.dados.titulo, categoria: b.dados.categoria, estado: estadoDo(issue), criadoEm: issue.created_at, atualizadoEm: issue.updated_at, respostas: respostasDe(await github.comentarios(n)) });
    } catch (e) { return falhaDoGitHub(res, e); }
  }

  /** Chave de administração: erros seguidos de um mesmo IP bloqueiam por uma hora, antes mesmo de comparar. */
  function admin(req, res) {
    if (!adminPronto) { responder(res, 503, { erro: 'SUPPORT_ADMIN_NOT_CONFIGURED' }); return false; }
    const janelas = [['admin-erros-ip:' + ipDe(req), 3_600_000, limites.errosDeAdminPorIpHora]];
    if (limitador.excede(janelas)) { responder(res, 429, { erro: 'SUPPORT_RATE_LIMIT' }, { 'Retry-After': '3600' }); return false; }
    const m = /^Bearer (.{1,200})$/.exec(String(req.headers.authorization || ''));
    if (!m || !iguais(resumo(m[1]), resumo(chaveAdmin))) { limitador.marcar(janelas); registrar('chave de administração recusada'); responder(res, 401, { erro: 'SUPPORT_ADMIN_DENIED' }); return false; }
    return true;
  }

  async function administrar(req, res, caminho, consulta) {
    if (!admin(req, res)) return;
    try {
      if (caminho === '/v1/admin/chamados' && req.method === 'GET') {
        const estado = consulta.get('estado'); if (estado && !ESTADOS.includes(estado)) return responder(res, 400, { erro: 'TICKET_INVALID' });
        const lista = (await github.listarIssues(ROTULO)).map((i) => { const b = lerDoIssue(i); return b ? resumoDoChamado(i, b) : null; }).filter(Boolean);
        return responder(res, 200, { chamados: estado ? lista.filter((c) => c.estado === estado) : lista });
      }
      const m = /^\/v1\/admin\/chamados\/(\d{1,9})(?:\/(anexos)\/(\d)|\/(respostas))?$/.exec(caminho); if (!m) return responder(res, 404, { erro: 'NOT_FOUND' });
      const n = Number(m[1]); const issue = await github.lerIssue(n); const b = lerDoIssue(issue); if (!b) return naoExiste(res);
      if (m[2] && req.method === 'GET') {
        const a = b.dados.anexos[Number(m[3])]; if (!a) return naoExiste(res);
        const bytes = await github.lerArquivo(`chamados/${n}/${a.arquivo}`); if (!bytes) return responder(res, 404, { erro: 'ATTACHMENT_NOT_RECEIVED' });
        res.writeHead(200, { 'Content-Type': a.tipo, 'Content-Length': bytes.length, 'Content-Disposition': `attachment; filename="${a.arquivo}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(bytes);
      }
      if (m[4] && req.method === 'POST') {
        const corpo = await lerCorpo(req, 16 * 1024); const d = corpo && lerObjeto(corpo); const texto = d && Object.keys(d).length === 1 ? textoLimpo(d.texto, 1, 4000) : null;
        if (!texto) return responder(res, 400, { erro: 'TICKET_INVALID' });
        await github.comentar(n, MARCA_DE_RESPOSTA + '\n' + texto); registrar('resposta ao chamado #' + n);
        return responder(res, 201, { respondido: true });
      }
      if (!m[2] && !m[4] && req.method === 'PATCH') {
        const corpo = await lerCorpo(req, 1024); const d = corpo && lerObjeto(corpo);
        if (!d || Object.keys(d).length !== 1 || !ESTADOS.includes(d.estado)) return responder(res, 400, { erro: 'TICKET_INVALID' });
        const rotulos = [...(issue.labels || []).map((l) => l.name ?? l).filter((r) => !r.startsWith('estado:')), 'estado:' + d.estado.toLowerCase().replace('_', '-')];
        const fechado = d.estado === 'RESOLVIDO' || d.estado === 'FECHADO';
        await github.atualizarIssue(n, { rotulos, estado: fechado ? 'closed' : 'open', ...(fechado ? { motivo: d.estado === 'RESOLVIDO' ? 'completed' : 'not_planned' } : {}) });
        registrar('chamado #' + n + ' agora ' + d.estado);
        return responder(res, 200, { estado: d.estado });
      }
      if (!m[2] && !m[4] && req.method === 'GET') {
        const recebidos = new Set((await github.listarArquivos(`chamados/${n}`)).map((a) => a.nome));
        return responder(res, 200, { ...resumoDoChamado(issue, b), dados: b.dados, anexos: b.dados.anexos.map((a, i) => ({ indice: i, nome: a.nome, tipo: a.tipo, tamanho: a.tamanho, recebido: recebidos.has(a.arquivo) })), respostas: respostasDe(await github.comentarios(n)) });
      }
      return responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' });
    } catch (e) { return falhaDoGitHub(res, e); }
  }

  return async (req, res, caminho, consulta) => {
    if (!configurado) return responder(res, 503, { erro: 'SUPPORT_NOT_CONFIGURED' });
    if (caminho.startsWith('/v1/admin/')) return administrar(req, res, caminho, consulta);
    if (caminho === '/v1/chamados') return req.method === 'POST' ? abrir(req, res) : responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' });
    const m = /^\/v1\/chamados\/(\d{1,9})(?:\/anexos\/(\d))?$/.exec(caminho); if (!m) return responder(res, 404, { erro: 'NOT_FOUND' });
    if (m[2] !== undefined) return req.method === 'PUT' ? anexar(req, res, Number(m[1]), Number(m[2])) : responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' }, { Allow: 'PUT' });
    return req.method === 'GET' ? acompanhar(req, res, Number(m[1])) : responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' });
  };
}
