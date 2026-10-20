/** Entrar ou se cadastrar por um provedor externo (GitHub ou Google): abre o navegador, o provedor devolve a pessoa a este computador (127.0.0.1) e a conta entra já. */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { contaNova } from './contas.js';
import { iniciarSessao, loginLigado, sessaoParaJanela } from './sessao.js';
import { gravarContas } from '../banco/gravarContas.js';
import { lerContas } from '../banco/lerContas.js';
import { RegistroDeContas, Usuario, emailSchema } from '../tipos/contas.js';

export type Provedor = 'github' | 'google';
export type DependenciasDeEntrada = {
  /** Client ID e segredo do OAuth App; null enquanto a Administração não configurou. */
  configuracao: () => { clientId: string; clientSecret: string } | null;
  trocarCodigo: (p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string }) => Promise<string>;
  lerPerfil: (token: string) => Promise<{ id: string; login: string; nome: string | null; email?: string }>;
  abrirNavegador: (url: string) => Promise<void>;
  /** Chamado quando a tentativa termina (qualquer desfecho): o aplicativo traz a janela do Prumo para a frente. */
  aoTerminar?: () => void;
  base?: string; tempoMs?: number; agora?: () => Date;
};
/** entrar: login já ligado; ativar: instalação sem nenhuma conta, e a primeira conta (administradora) nasce da autorização. */
type ModoDaEntrada = 'entrar' | 'ativar';
type EstadoDaEntrada = { estado: 'NENHUMA' | 'AGUARDANDO' | 'CONCLUIDO' | 'PENDENTE' | 'ERRO'; mensagem?: string; sessao?: ReturnType<typeof sessaoParaJanela> };

/** Endereços e escopos fixos de cada provedor: nada disso vem da janela. */
const PROVEDORES = {
  github: { nome: 'GitHub', prefixo: 'gh', origem: 'GITHUB', autorizar: 'https://github.com/login/oauth/authorize', escopo: 'read:user', extras: { allow_signup: 'true' } },
  google: { nome: 'Google', prefixo: 'g', origem: 'GOOGLE', autorizar: 'https://accounts.google.com/o/oauth2/v2/auth', escopo: 'openid email profile', extras: { response_type: 'code', prompt: 'select_account' } }
} as const;

let tentativa: { servidor: http.Server; relogio: NodeJS.Timeout } | null = null;
let situacao: EstadoDaEntrada = { estado: 'NENHUMA' };

const igual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const base64url = (b: Buffer) => b.toString('base64url');

function encerrar(): void {
  if (!tentativa) return;
  // Deixa terminar a resposta em andamento (a página "pode voltar ao Prumo"); só depois força o fechamento do que sobrar.
  const { servidor, relogio } = tentativa; clearTimeout(relogio); tentativa = null; servidor.close(); servidor.closeIdleConnections?.();
  setTimeout(() => servidor.closeAllConnections?.(), 2000).unref();
}

/** Login do Prumo a partir do nome no provedor: minúsculas, números, ponto, hífen ou sublinhado, sem repetir login existente. */
function loginLivre(r: RegistroDeContas, prefixo: string, nomeNoProvedor: string): string {
  let base = (prefixo + '-' + nomeNoProvedor.toLowerCase().replace(/[^a-z0-9._-]/g, '-')).slice(0, 36); if (base.length < 3) base = prefixo + '-user';
  let login = base; for (let i = 2; r.usuarios.some((u) => u.login === login); i++) login = base + '-' + i;
  return login;
}

type Perfil = { id: string; login: string; nome: string | null; email?: string };
const nomeDaPessoa = (p: Perfil) => (p.nome && p.nome.length >= 2 ? p.nome : p.login.padEnd(2, '_'));

/** Liga o login com a primeira conta, de administrador: só enquanto não existe nenhuma conta (a mesma regra de ativar o login com senha). */
async function ativarPeloProvedor(d: DependenciasDeEntrada, provedor: Provedor, r: RegistroDeContas, perfil: Perfil, agora: Date): Promise<EstadoDaEntrada> {
  if (loginLigado(r)) throw new Error('LOGIN_ALREADY_ACTIVE: o login já está ligado; entre pela tela de entrada.');
  const p = PROVEDORES[provedor];
  const email = perfil.email && emailSchema.safeParse(perfil.email).success ? perfil.email.toLowerCase() : undefined;
  const u = contaNova(r, { login: loginLivre(r, p.prefixo, perfil.login), nome: nomeDaPessoa(perfil), ...(email ? { email } : {}) }, { papel: 'administrador', estado: 'ATIVO', senha: null, recuperacao: null, trocarSenha: false, origem: p.origem, admin: true, identidades: [{ provedor, id: perfil.id, login: perfil.login }] }, agora);
  u.ultimoAcesso = agora.toISOString(); r.usuarios.push(u); gravarContas(r, d.base); iniciarSessao(u.id, agora.getTime());
  return { estado: 'CONCLUIDO', sessao: sessaoParaJanela(d.base, agora.getTime()) };
}

/** Decide o que a autorização vira: conta existente entra; pessoa nova segue a política de aprovação da Administração. */
async function resolverConta(d: DependenciasDeEntrada, provedor: Provedor, token: string, modo: ModoDaEntrada): Promise<EstadoDaEntrada> {
  const perfil = await d.lerPerfil(token); const agora = (d.agora ?? (() => new Date()))(); const r = lerContas(d.base); const p = PROVEDORES[provedor];
  if (modo === 'ativar') return ativarPeloProvedor(d, provedor, r, perfil, agora);
  if (!loginLigado(r)) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  let u: Usuario | undefined = r.usuarios.find((x) => x.identidades.some((i) => i.provedor === provedor && i.id === perfil.id));
  if (!u) {
    // Não associar uma identidade externa a uma conta local apenas pelo e-mail.
    const email = perfil.email && emailSchema.safeParse(perfil.email).success ? perfil.email.toLowerCase() : undefined;
    if (email && r.usuarios.some(x => x.email === email)) throw new Error('EMAIL_TAKEN: e-mail já registrado; entre pela conta existente.');
    if (!r.acesso.cadastroAberto) throw new Error('SIGNUP_CLOSED: o cadastro está fechado; peça uma conta à Administração.');
    const papel = r.papeis.some((x) => x.id === r.acesso.papelDoCadastro) ? r.acesso.papelDoCadastro : 'leitor';
    u = contaNova(r, { login: loginLivre(r, p.prefixo, perfil.login), nome: nomeDaPessoa(perfil), ...(email ? { email } : {}) }, { papel, estado: r.acesso.aprovarCadastros ? 'PENDENTE' : 'ATIVO', senha: null, recuperacao: null, trocarSenha: false, origem: p.origem, identidades: [{ provedor, id: perfil.id, login: perfil.login }] }, agora);
    r.usuarios.push(u); gravarContas(r, d.base);
    if (u.estado === 'PENDENTE') return { estado: 'PENDENTE', mensagem: 'Cadastro criado com o ' + p.nome + '. Ele aguarda aprovação da Administração; depois de aprovado, é só entrar de novo pelo ' + p.nome + '.' };
    iniciarSessao(u.id, agora.getTime()); return { estado: 'CONCLUIDO', sessao: sessaoParaJanela(d.base, agora.getTime()) };
  }
  if (u.estado === 'PENDENTE') return { estado: 'PENDENTE', mensagem: 'O cadastro aguarda aprovação da Administração.' };
  if (u.estado === 'DESATIVADO') throw new Error('ACCOUNT_DISABLED: esta conta foi desativada pela Administração.');
  if (u.bloqueadoAte && Date.parse(u.bloqueadoAte) > agora.getTime()) throw new Error('ACCOUNT_LOCKED: conta bloqueada; peça o desbloqueio à Administração.');
  const atual = r.usuarios.find((x) => x.id === u!.id)!; atual.ultimoAcesso = agora.toISOString(); atual.falhas = 0; gravarContas(r, d.base); iniciarSessao(atual.id, agora.getTime());
  return { estado: 'CONCLUIDO', sessao: sessaoParaJanela(d.base, agora.getTime()) };
}

const pagina = (titulo: string, texto: string) => `<!doctype html><meta charset="utf-8"><title>Prumo QA</title><body style="font-family:system-ui;margin:12vh auto;max-width:30rem;text-align:center"><h1>${titulo}</h1><p>${texto}</p></body>`;

/** Começa a entrada: abre o navegador na página de autorização do provedor e espera a volta em http://127.0.0.1:porta/callback. */
export async function iniciarEntrada(provedor: Provedor, d: DependenciasDeEntrada, modo: ModoDaEntrada = 'entrar'): Promise<{ iniciado: true }> {
  const p = PROVEDORES[provedor]; const ligado = loginLigado(lerContas(d.base));
  if (modo === 'entrar' && !ligado) throw new Error('LOGIN_NOT_ACTIVE: ainda não existe conta neste computador. Use Criar conta.');
  if (modo === 'ativar' && ligado) throw new Error('LOGIN_ALREADY_ACTIVE: o login já está ligado; entre pela tela de entrada.');
  const cfg = d.configuracao(); if (!cfg) throw new Error(provedor.toUpperCase() + '_LOGIN_NOT_CONFIGURED: a Administração ainda não configurou o login pelo ' + p.nome + '.');
  encerrar(); situacao = { estado: 'AGUARDANDO' };
  const state = base64url(randomBytes(24)), verificador = base64url(randomBytes(48)), desafio = base64url(createHash('sha256').update(verificador).digest());
  const servidor = http.createServer((req, res) => {
    const porta = (servidor.address() as AddressInfo).port;
    const fim = (codigo: number, titulo: string, texto: string) => { res.writeHead(codigo, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", 'X-Content-Type-Options': 'nosniff' }); res.end(pagina(titulo, texto)); };
    // Só a volta esperada, vinda do próprio computador: método, host (contra DNS rebinding) e caminho fixos.
    if (req.method !== 'GET' || req.headers.host !== `127.0.0.1:${porta}`) return fim(400, 'Pedido recusado', 'Este endereço só atende o login do Prumo.');
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${porta}`);
    if (url.pathname !== '/callback') return fim(404, 'Não encontrado', 'Este endereço só atende o login do Prumo.');
    if (!tentativa || situacao.estado !== 'AGUARDANDO' || situacao.mensagem) return fim(409, 'Login já tratado', 'Volte ao Prumo.');
    const recebido = url.searchParams.get('state') ?? ''; const code = url.searchParams.get('code') ?? '';
    if (!igual(recebido, state)) return fim(400, 'Pedido recusado', 'O login não foi iniciado por este Prumo. Tente de novo pelo Prumo.');
    if (url.searchParams.get('error') || !code || code.length > 2000) { situacao = { estado: 'ERRO', mensagem: 'A autorização no ' + p.nome + ' foi negada ou cancelada.' }; encerrar(); d.aoTerminar?.(); return fim(200, 'Autorização não concluída', 'Volte ao Prumo e tente de novo, se quiser.'); }
    situacao = { estado: 'AGUARDANDO', mensagem: 'Concluindo…' };
    void (async () => {
      try {
        const token = await d.trocarCodigo({ clientId: cfg.clientId, clientSecret: cfg.clientSecret, code, redirectUri: `http://127.0.0.1:${porta}/callback`, codeVerifier: verificador });
        situacao = await resolverConta(d, provedor, token, modo);
        fim(200, situacao.estado === 'CONCLUIDO' ? 'Tudo certo' : 'Cadastro recebido', situacao.estado === 'CONCLUIDO' ? 'Pode voltar ao Prumo: você já entrou.' : 'Volte ao Prumo para ver o próximo passo.');
      } catch (e) { situacao = { estado: 'ERRO', mensagem: (e as Error).message }; fim(200, 'Não deu certo', 'Volte ao Prumo para ver o motivo.'); }
      finally { encerrar(); d.aoTerminar?.(); }
    })();
  });
  await new Promise<void>((ok, falha) => { servidor.once('error', falha); servidor.listen(0, '127.0.0.1', ok); });
  const relogio = setTimeout(() => { if (situacao.estado === 'AGUARDANDO') situacao = { estado: 'ERRO', mensagem: 'Tempo esgotado: a autorização no ' + p.nome + ' não foi concluída.' }; encerrar(); }, d.tempoMs ?? 300_000);
  relogio.unref(); tentativa = { servidor, relogio };
  const porta = (servidor.address() as AddressInfo).port;
  const url = p.autorizar + '?' + new URLSearchParams({ client_id: cfg.clientId, redirect_uri: `http://127.0.0.1:${porta}/callback`, scope: p.escopo, state, code_challenge: desafio, code_challenge_method: 'S256', ...p.extras }).toString();
  try { await d.abrirNavegador(url); } catch { situacao = { estado: 'ERRO', mensagem: 'Não foi possível abrir o navegador.' }; encerrar(); }
  return { iniciado: true };
}

/** Como está a entrada por provedor externo; `cancelar` desiste e fecha o endereço local. */
export function estadoDaEntrada(cancelar = false): EstadoDaEntrada {
  if (cancelar && situacao.estado === 'AGUARDANDO') { encerrar(); situacao = { estado: 'NENHUMA' }; }
  return situacao;
}
