import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { entrarNaConta } from '../../../../dist/login/regras/contas.js';
import { criarPrimeiraConta } from '../../../apoio/contas-por-email.mjs';
import { estadoDaEntradaGithub, iniciarEntradaGithub } from '../../../../dist/login/regras/entradaPeloGithub.js';
import { encerrarSessao, situacaoDaSessao } from '../../../../dist/login/regras/sessao.js';
import { gravarContas } from '../../../../dist/login/banco/gravarContas.js';
import { lerContas } from '../../../../dist/login/banco/lerContas.js';

// GitHub simulado e navegador falso: o teste faz o papel do navegador chamando o endereço local de volta (127.0.0.1) com ou sem o state certo.
// Nenhuma rede externa, nenhum cofre, nenhuma conta real.
const base = async (t) => {
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo gh ')); t.after(() => { encerrarSessao(); estadoDaEntradaGithub(true); fs.rmSync(b, { recursive: true, force: true }); });
  await criarPrimeiraConta({ login: 'admin', nome: 'Admin Teste', senha: 'senha-forte-123' }, b); encerrarSessao(); return b;
};
function montar(b, { perfil = { id: '4242', login: 'Ana-Dev', nome: 'Ana Dev' }, tempoMs, configurado = true } = {}) {
  const chamadas = { trocas: [], conexoes: [], urls: [] };
  const d = {
    base: b, tempoMs,
    configuracao: () => (configurado ? { clientId: 'Iv1.cliente-de-teste', clientSecret: 'segredo-de-teste-xyz' } : null),
    trocarCodigo: async (p) => { chamadas.trocas.push(p); return 'token-de-teste'; },
    lerPerfil: async () => perfil,
    abrirNavegador: async (url) => { chamadas.urls.push(url); },
    guardarConexao: async (token, nome) => { chamadas.conexoes.push({ token, nome }); }
  };
  return { d, chamadas };
}
const volta = (url, params, host) => new Promise((ok, falha) => {
  const u = new URL(url); const r = new URL(u.searchParams.get('redirect_uri')); for (const [k, v] of Object.entries(params)) r.searchParams.set(k, v);
  http.get({ host: '127.0.0.1', port: r.port, path: r.pathname + r.search, headers: host ? { Host: host } : {} }, (res) => { let t = ''; res.on('data', (c) => (t += c)); res.on('end', () => ok({ status: res.statusCode, texto: t })); }).on('error', falha);
});
const esperar = async (fn) => { for (let i = 0; i < 100; i++) { const e = estadoDaEntradaGithub(); if (fn(e)) return e; await new Promise((ok) => setTimeout(ok, 30)); } return estadoDaEntradaGithub(); };

test('a página de autorização leva PKCE S256, state, escopo e retorno em 127.0.0.1; o segredo nunca vai na URL', async (t) => {
  const b = await base(t), { d, chamadas } = montar(b); await iniciarEntradaGithub(d);
  const u = new URL(chamadas.urls[0]); assert.equal(u.origin + u.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256'); assert.match(u.searchParams.get('redirect_uri'), /^http:\/\/127\.0\.0\.1:\d+\/callback$/);
  assert.equal(u.searchParams.get('scope'), 'read:user repo'); assert.ok(u.searchParams.get('state').length >= 30); assert.doesNotMatch(chamadas.urls[0], /segredo-de-teste|client_secret/);
  assert.equal(estadoDaEntradaGithub().estado, 'AGUARDANDO');
});

test('pessoa nova: o cadastro pelo GitHub nasce PENDENTE, sem senha e sem sessão, e o token não é guardado; depois de aprovada, entra já com a conexão', async (t) => {
  const b = await base(t), { d, chamadas } = montar(b); await iniciarEntradaGithub(d);
  const u = new URL(chamadas.urls[0]); const r = await volta(chamadas.urls[0], { code: 'codigo-1', state: u.searchParams.get('state') }); assert.equal(r.status, 200);
  const e = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'PENDENTE');
  const conta = lerContas(b).usuarios.find((x) => x.origem === 'GITHUB'); assert.equal(conta.estado, 'PENDENTE'); assert.equal(conta.senha, null); assert.equal(conta.papel, 'leitor'); assert.match(conta.login, /^gh-ana-dev$/);
  assert.deepEqual(conta.identidades, [{ provedor: 'github', id: '4242', login: 'Ana-Dev' }]); assert.equal(situacaoDaSessao(b).tipo, 'SEM_SESSAO'); assert.equal(chamadas.conexoes.length, 0, 'conta pendente não ganha conexão');
  // O PKCE confere: o verificador enviado na troca gera o desafio da URL.
  assert.equal(createHash('sha256').update(chamadas.trocas[0].codeVerifier).digest('base64url'), u.searchParams.get('code_challenge')); assert.equal(chamadas.trocas[0].clientSecret, 'segredo-de-teste-xyz');
  // Sem senha, o login por senha nunca funciona para essa conta.
  await assert.rejects(entrarNaConta({ login: conta.login, senha: 'qualquer-senha-123' }, b), /LOGIN_INVALID/);
  // Administração aprova; a próxima entrada pelo GitHub abre a sessão e cria a conexão.
  const reg = lerContas(b); reg.usuarios.find((x) => x.id === conta.id).estado = 'ATIVO'; gravarContas(reg, b);
  await iniciarEntradaGithub(d); const u2 = new URL(chamadas.urls[1]); await volta(chamadas.urls[1], { code: 'codigo-2', state: u2.searchParams.get('state') });
  const f = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(f.estado, 'CONCLUIDO'); assert.equal(f.sessao.usuario.login, conta.login); assert.equal(situacaoDaSessao(b).tipo, 'ATIVA');
  assert.deepEqual(chamadas.conexoes, [{ token: 'token-de-teste', nome: 'GitHub de Ana-Dev' }]);
});

test('retorno suspeito é recusado e não derruba a tentativa: state errado, host errado, caminho errado', async (t) => {
  const b = await base(t), { d, chamadas } = montar(b); await iniciarEntradaGithub(d); const state = new URL(chamadas.urls[0]).searchParams.get('state');
  assert.equal((await volta(chamadas.urls[0], { code: 'x', state: 'outro-state-qualquer' })).status, 400);
  assert.equal((await volta(chamadas.urls[0], { code: 'x', state }, 'evil.test')).status, 400, 'Host diferente de 127.0.0.1:porta (DNS rebinding)');
  const redirect = new URL(new URL(chamadas.urls[0]).searchParams.get('redirect_uri'));
  const outro = await new Promise((ok) => http.get({ host: '127.0.0.1', port: redirect.port, path: '/outro?state=' + state + '&code=x' }, (res) => { res.resume(); ok(res.statusCode); })); assert.equal(outro, 404);
  assert.equal(chamadas.trocas.length, 0, 'nada foi trocado no GitHub'); assert.equal(estadoDaEntradaGithub().estado, 'AGUARDANDO');
  assert.equal((await volta(chamadas.urls[0], { code: 'bom', state })).status, 200); await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(chamadas.trocas.length, 1);
});

test('autorização negada, tempo esgotado e cancelamento terminam sem conta nem sessão', async (t) => {
  const b = await base(t); const { d, chamadas } = montar(b); await iniciarEntradaGithub(d);
  await volta(chamadas.urls[0], { error: 'access_denied', state: new URL(chamadas.urls[0]).searchParams.get('state') }); assert.equal(estadoDaEntradaGithub().estado, 'ERRO');
  const lento = montar(b, { tempoMs: 60 }); await iniciarEntradaGithub(lento.d); const e = await esperar((x) => x.estado === 'ERRO'); assert.match(e.mensagem, /Tempo esgotado/);
  await iniciarEntradaGithub(montar(b).d); assert.equal(estadoDaEntradaGithub(true).estado, 'NENHUMA');
  assert.equal(lerContas(b).usuarios.filter((x) => x.origem === 'GITHUB').length, 0); assert.equal(situacaoDaSessao(b).tipo, 'SEM_SESSAO');
});

test('a identidade é o id numérico do GitHub: outro id com o mesmo login não assume a conta', async (t) => {
  const b = await base(t); const a = montar(b); await iniciarEntradaGithub(a.d); await volta(a.chamadas.urls[0], { code: 'c', state: new URL(a.chamadas.urls[0]).searchParams.get('state') }); await esperar((x) => x.estado !== 'AGUARDANDO');
  const reg = lerContas(b); reg.usuarios.find((x) => x.origem === 'GITHUB').estado = 'ATIVO'; gravarContas(reg, b);
  const impostor = montar(b, { perfil: { id: '9999', login: 'Ana-Dev', nome: 'Outra Pessoa' } }); await iniciarEntradaGithub(impostor.d); await volta(impostor.chamadas.urls[0], { code: 'c', state: new URL(impostor.chamadas.urls[0]).searchParams.get('state') });
  const e = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'PENDENTE'); assert.equal(impostor.chamadas.conexoes.length, 0); assert.equal(situacaoDaSessao(b).tipo, 'SEM_SESSAO');
  const logins = lerContas(b).usuarios.filter((x) => x.origem === 'GITHUB').map((x) => x.login); assert.deepEqual(logins.sort(), ['gh-ana-dev', 'gh-ana-dev-2']);
});

test('sem configuração, com cadastro fechado ou com o login desligado, nada abre', async (t) => {
  const b = await base(t);
  await assert.rejects(iniciarEntradaGithub(montar(b, { configurado: false }).d), /GITHUB_LOGIN_NOT_CONFIGURED/);
  const fechado = lerContas(b); fechado.acesso.cadastroAberto = false; gravarContas(fechado, b); const { d, chamadas } = montar(b); await iniciarEntradaGithub(d);
  await volta(chamadas.urls[0], { code: 'c', state: new URL(chamadas.urls[0]).searchParams.get('state') }); const e = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'ERRO'); assert.match(e.mensagem, /SIGNUP_CLOSED/);
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo gh vazio ')); t.after(() => fs.rmSync(vazio, { recursive: true, force: true }));
  await assert.rejects(iniciarEntradaGithub(montar(vazio).d), /LOGIN_NOT_ACTIVE/);
});

test('sem concluir o login ou o cadastro nada fica habilitado: sem sessão, sem conexão, sem conta ativa e sem token guardado', async (t) => {
  const b = await base(t); const todos = [];
  const tentar = async (perfil, antes) => {
    const { d, chamadas } = montar(b, { perfil }); todos.push(chamadas); await iniciarEntradaGithub(d); if (antes) antes(); return { d, chamadas };
  };
  // 1) cadastro novo; 2) autorização negada; 3) cancelada; 4) conta desativada pela Administração.
  let x = await tentar({ id: '1', login: 'nova', nome: 'Nova Pessoa' }); await volta(x.chamadas.urls[0], { code: 'c', state: new URL(x.chamadas.urls[0]).searchParams.get('state') }); await esperar((e) => e.estado !== 'AGUARDANDO');
  x = await tentar({ id: '2', login: 'negou', nome: 'Negou' }); await volta(x.chamadas.urls[0], { error: 'access_denied', state: new URL(x.chamadas.urls[0]).searchParams.get('state') });
  await tentar({ id: '3', login: 'cancelou', nome: 'Cancelou' }); estadoDaEntradaGithub(true);
  const reg = lerContas(b); reg.usuarios.find((u) => u.identidades.some((i) => i.id === '1')).estado = 'DESATIVADO'; gravarContas(reg, b);
  x = await tentar({ id: '1', login: 'nova', nome: 'Nova Pessoa' }); await volta(x.chamadas.urls[0], { code: 'c', state: new URL(x.chamadas.urls[0]).searchParams.get('state') }); const e = await esperar((s) => s.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'ERRO'); assert.match(e.mensagem, /ACCOUNT_DISABLED/);
  assert.equal(situacaoDaSessao(b).tipo, 'SEM_SESSAO'); assert.equal(todos.flatMap((c) => c.conexoes).length, 0, 'nenhuma conexão do GitHub foi criada');
  assert.deepEqual(lerContas(b).usuarios.filter((u) => u.origem === 'GITHUB' && u.estado === 'ATIVO'), [], 'nenhuma conta do GitHub nasce ativa');
  assert.ok(!fs.readFileSync(path.join(b, 'plataforma', 'acessos.json'), 'utf8').includes('token-de-teste'), 'o token não é gravado nas contas');
});

test('ativar o login pelo GitHub: sem nenhuma conta, a primeira (administradora) nasce da autorização, entra já e ganha a conexão; com contas, recusa', async (t) => {
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo gh ativar ')); t.after(() => { encerrarSessao(); estadoDaEntradaGithub(true); fs.rmSync(vazio, { recursive: true, force: true }); });
  const { d, chamadas } = montar(vazio); let terminou = 0; d.aoTerminar = () => { terminou++; };
  await assert.rejects(iniciarEntradaGithub(d), /LOGIN_NOT_ACTIVE/, 'o modo entrar não vale sem conta');
  await iniciarEntradaGithub(d, 'ativar'); await volta(chamadas.urls[0], { code: 'c', state: new URL(chamadas.urls[0]).searchParams.get('state') });
  const e = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'CONCLUIDO'); assert.equal(e.sessao.usuario.papel, 'administrador'); assert.equal(e.sessao.loginAtivo, true);
  const conta = lerContas(vazio).usuarios[0]; assert.equal(conta.estado, 'ATIVO'); assert.equal(conta.senha, null); assert.equal(conta.origem, 'GITHUB');
  assert.deepEqual(chamadas.conexoes, [{ token: 'token-de-teste', nome: 'GitHub de Ana-Dev' }]); assert.ok(terminou >= 1, 'a janela do Prumo é trazida para a frente');
  encerrarSessao(); await assert.rejects(iniciarEntradaGithub(montar(vazio).d, 'ativar'), /LOGIN_ALREADY_ACTIVE/, 'com contas, ativar não vale mais');
});

// ---- Google: a mesma lógica (entradaPorProvedor) com endereços, escopos e identidade próprios; o Google serve só para entrar.
import { iniciarEntrada } from '../../../../dist/login/regras/entradaPorProvedor.js';

test('Google: autorização com PKCE e escopo mínimo; cadastro novo fica PENDENTE e nenhuma conexão é criada', async (t) => {
  const b = await base(t), { d, chamadas } = montar(b, { perfil: { id: '104857600000000000001', login: 'maria.silva', nome: 'Maria Silva' } }); delete d.guardarConexao;
  await iniciarEntrada('google', d); const u = new URL(chamadas.urls[0]);
  assert.equal(u.origin + u.pathname, 'https://accounts.google.com/o/oauth2/v2/auth'); assert.equal(u.searchParams.get('scope'), 'openid email profile'); assert.equal(u.searchParams.get('response_type'), 'code');
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256'); assert.match(u.searchParams.get('redirect_uri'), /^http:\/\/127\.0\.0\.1:\d+\/callback$/); assert.doesNotMatch(chamadas.urls[0], /segredo-de-teste|client_secret/);
  await volta(chamadas.urls[0], { code: 'g-1', state: u.searchParams.get('state') }); const e = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(e.estado, 'PENDENTE'); assert.match(e.mensagem, /Google/);
  const conta = lerContas(b).usuarios.find((x) => x.origem === 'GOOGLE'); assert.equal(conta.estado, 'PENDENTE'); assert.equal(conta.senha, null); assert.equal(conta.login, 'g-maria.silva');
  assert.deepEqual(conta.identidades, [{ provedor: 'google', id: '104857600000000000001', login: 'maria.silva' }]); assert.equal(situacaoDaSessao(b).tipo, 'SEM_SESSAO');
});

test('Google: depois de aprovada entra já; o mesmo número em outro provedor não é a mesma pessoa', async (t) => {
  const b = await base(t); const perfil = { id: '4242', login: 'Ana-Dev', nome: 'Ana Dev' };
  const g = montar(b, { perfil }); delete g.d.guardarConexao; await iniciarEntrada('google', g.d); await volta(g.chamadas.urls[0], { code: 'c', state: new URL(g.chamadas.urls[0]).searchParams.get('state') }); await esperar((x) => x.estado !== 'AGUARDANDO');
  const reg = lerContas(b); reg.usuarios.find((x) => x.origem === 'GOOGLE').estado = 'ATIVO'; gravarContas(reg, b);
  // O mesmo id 4242, agora vindo do GitHub, cria OUTRA conta pendente (a identidade é provedor + id).
  const h = montar(b, { perfil }); await iniciarEntradaGithubComo(h.d); await volta(h.chamadas.urls[0], { code: 'c', state: new URL(h.chamadas.urls[0]).searchParams.get('state') });
  const outra = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(outra.estado, 'PENDENTE'); assert.equal(h.chamadas.conexoes.length, 0);
  const g2 = montar(b, { perfil }); delete g2.d.guardarConexao; await iniciarEntrada('google', g2.d); await volta(g2.chamadas.urls[0], { code: 'c', state: new URL(g2.chamadas.urls[0]).searchParams.get('state') });
  const f = await esperar((x) => x.estado !== 'AGUARDANDO'); assert.equal(f.estado, 'CONCLUIDO'); assert.equal(situacaoDaSessao(b).tipo, 'ATIVA'); assert.equal(f.sessao.usuario.origem, 'GOOGLE');
});
const iniciarEntradaGithubComo = (d) => iniciarEntrada('github', d);

test('Google: ativar o login sem nenhuma conta cria a administradora; a falta de configuração é recusada com o código do Google', async (t) => {
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo g ativar ')); t.after(() => { encerrarSessao(); estadoDaEntradaGithub(true); fs.rmSync(vazio, { recursive: true, force: true }); });
  await assert.rejects(iniciarEntrada('google', montar(vazio, { configurado: false }).d, 'ativar'), /GOOGLE_LOGIN_NOT_CONFIGURED/);
  const { d, chamadas } = montar(vazio, { perfil: { id: '777', login: 'admin.g', nome: 'Admin G' } }); delete d.guardarConexao; await iniciarEntrada('google', d, 'ativar');
  await volta(chamadas.urls[0], { code: 'c', state: new URL(chamadas.urls[0]).searchParams.get('state') }); const e = await esperar((x) => x.estado !== 'AGUARDANDO');
  assert.equal(e.estado, 'CONCLUIDO'); assert.equal(e.sessao.usuario.papel, 'administrador'); assert.equal(lerContas(vazio).usuarios[0].origem, 'GOOGLE');
});
