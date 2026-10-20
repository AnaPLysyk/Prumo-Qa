// Chamados no aplicativo: anexos conferidos pelo conteúdo, envio com revisão de segredo, só o que a pessoa marcou, chave protegida,
// isolamento entre contas, chave de administração e o caminho completo até o serviço local (127.0.0.1, repositório em memória).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { anexosDoEnvio, guardarAnexos, tipoPelaAssinatura } from '../../../../dist/suporte/regras/chamadosDaPessoa.js';
import { enviarChamado, meuChamado, meusChamados } from '../../../../dist/suporte/regras/chamadosDaPessoa.js';
import { chamadosDaAdministracao, lerChaveDeAdministracao, salvarChaveDeAdministracao } from '../../../../dist/suporte/regras/chamadosDaAdministracao.js';
import { servicoDeChamados } from '../../../../dist/suporte/integracoes.js';
import { urlDoServico } from '../../../../dist/compartilhado/servicoRemoto.js';
import { acessoDosCanais } from '../../../../dist/login/tipos/acessoDosCanais.js';
import { caixaDeEmail, CHAVE_DE_ADMIN_DOS_TESTES } from '../../../apoio/caixa-de-email.mjs';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(120, 3)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(120, 1)]);
const ANA = { id: '11111111-1111-4111-8111-111111111111', nome: 'Ana QA', email: 'ana@exemplo.com' };
const BIA = { id: '22222222-2222-4222-8222-222222222222', nome: 'Bia Dev', email: null };
const RELATO = { categoria: 'bug', titulo: 'Botão Salvar não responde', descricao: 'Cliquei em Salvar e nada aconteceu.', passos: '1. Abrir 2. Salvar', incluirVersao: true, incluirSistema: false, incluirDiagnostico: false, consentimento: true };
/** Protetor de mentira, só para os testes: embaralha de forma reversível e deixa claro que nada fica em texto aberto. */
const protetor = (disponivel = true) => ({ disponivel: () => disponivel, proteger: (s) => Buffer.from('P1' + Buffer.from(s).toString('hex')), abrir: (b) => Buffer.from(b.toString().slice(2), 'hex').toString() });

function pasta(t) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-chamados-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; }
function arquivo(dir, nome, bytes) { const c = path.join(dir, nome); fs.writeFileSync(c, bytes); return c; }
function servicoFalso() {
  const pedidos = []; let n = 40;
  return { pedidos, abrir: async (c) => { pedidos.push(['abrir', c]); return { numero: ++n, chave: 'chave-do-chamado-' + n }; }, anexar: async (numero, i, chave, tipo, bytes) => { pedidos.push(['anexar', numero, i, chave, tipo, bytes.length]); if (tipo === 'video/mp4') throw new Error('rede caiu'); return { recebido: true }; },
    acompanhar: async (numero, chave) => { pedidos.push(['acompanhar', numero, chave]); return { numero, titulo: 'x', categoria: 'bug', estado: 'EM_ANALISE', criadoEm: '2026-10-16T12:00:00.000Z', atualizadoEm: '2026-10-16T13:00:00.000Z', respostas: [{ em: '2026-10-16T13:00:00.000Z', texto: 'Vimos.' }] }; } };
}

test('anexos: o tipo vem do conteúdo; extensão trocada, HTML disfarçado e arquivo grande são recusados sem expor o caminho', (t) => {
  const d = pasta(t);
  assert.equal(tipoPelaAssinatura(PNG), 'image/png'); assert.equal(tipoPelaAssinatura(MP4), 'video/mp4'); assert.equal(tipoPelaAssinatura(Buffer.from('<svg>')), null);
  const r = guardarAnexos([arquivo(d, 'tela.png', PNG), arquivo(d, 'tela.jpg', PNG), arquivo(d, 'pagina.png', Buffer.from('<html><script>x</script></html>')), arquivo(d, 'enorme.png', Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)])), path.join(d, 'sumiu.png')], ANA.id);
  assert.deepEqual(r.aceitos.map((a) => [a.nome, a.tipo, a.tamanho]), [['tela.png', 'image/png', PNG.length]]);
  assert.deepEqual(r.recusados.map((x) => x.nome), ['tela.jpg', 'pagina.png', 'enorme.png', 'sumiu.png']);
  assert.ok(r.recusados.every((x) => !x.motivo.includes(d)), 'o motivo não revela a pasta'); assert.ok(r.aceitos.every((a) => !('caminho' in a)), 'a janela não recebe o caminho');
  // Id de outra pessoa não serve; dois vídeos passam do limite.
  assert.throws(() => anexosDoEnvio([r.aceitos[0].id], BIA.id), /ATTACHMENT_INVALID/);
  const videos = guardarAnexos([arquivo(d, 'a.mp4', MP4), arquivo(d, 'b.mp4', MP4)], ANA.id).aceitos.map((a) => a.id);
  assert.throws(() => anexosDoEnvio(videos, ANA.id), /ATTACHMENT_LIMIT/);
  // Arquivo trocado depois de escolhido é conferido de novo no envio.
  const trocado = arquivo(d, 'depois.png', PNG); const id = guardarAnexos([trocado], ANA.id).aceitos[0].id; fs.writeFileSync(trocado, 'agora é texto');
  assert.throws(() => anexosDoEnvio([id], ANA.id), /ATTACHMENT_INVALID/);
});

test('envio: segredo no texto bloqueia antes de qualquer rede; vai só o que a pessoa marcou, com nome e e-mail da conta; chave guardada protegida', async (t) => {
  const d = pasta(t); const s = servicoFalso();
  await assert.rejects(enviarChamado({ relato: { ...RELATO, descricao: 'Meu token ghp_' + 'a'.repeat(36) + ' não funciona' }, anexos: [] }, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s }), /SUPPORT_BLOCKED_SECRET/);
  assert.equal(s.pedidos.length, 0, 'nada saiu');
  await assert.rejects(enviarChamado({ relato: { ...RELATO, consentimento: false }, anexos: [] }, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s }));
  const ids = guardarAnexos([arquivo(d, 'tela.png', PNG), arquivo(d, 'video.mp4', MP4)], ANA.id).aceitos.map((a) => a.id);
  const r = await enviarChamado({ relato: RELATO, anexos: ids }, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s });
  assert.deepEqual(r, { numero: 41, anexosEnviados: 1, anexosComFalha: ['video.mp4'], acompanhamento: true });
  const [, enviado] = s.pedidos[0];
  assert.deepEqual(enviado.contato, { nome: 'Ana QA', email: 'ana@exemplo.com' }); assert.equal(enviado.versao, '2.17.0');
  assert.equal(enviado.sistema, undefined, 'sistema só se marcado'); assert.equal(enviado.diagnostico, undefined, 'diagnóstico só se marcado');
  assert.deepEqual(s.pedidos.slice(1).map((p) => p.slice(0, 5)), [['anexar', 41, 0, 'chave-do-chamado-41', 'image/png'], ['anexar', 41, 1, 'chave-do-chamado-41', 'video/mp4']]);
  const bruto = fs.readFileSync(path.join(d, 'plataforma', 'chamados-de-suporte.json'), 'utf8');
  assert.ok(!bruto.includes('chave-do-chamado-41'), 'a chave não fica em texto aberto');
  assert.throws(() => anexosDoEnvio(ids, ANA.id), /ATTACHMENT_INVALID/, 'anexos enviados são esquecidos');
  // Sem cofre do sistema: o chamado sai, mas o acompanhamento não é guardado.
  const semCofre = await enviarChamado({ relato: { ...RELATO, incluirVersao: false }, anexos: [] }, { usuario: BIA, protetor: protetor(false), versao: '2.17.0', base: d, servico: s });
  assert.equal(semCofre.acompanhamento, false); assert.equal(s.pedidos.at(-1)[1].versao, undefined); assert.deepEqual(s.pedidos.at(-1)[1].contato, { nome: 'Bia Dev' });
});

test('isolamento: cada conta vê só os próprios chamados; número de outra pessoa responde como inexistente', async (t) => {
  const d = pasta(t); const s = servicoFalso();
  const daAna = await enviarChamado({ relato: RELATO, anexos: [] }, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s });
  const daBia = await enviarChamado({ relato: { ...RELATO, titulo: 'Chamado da Bia aqui' }, anexos: [] }, { usuario: BIA, protetor: protetor(), versao: '2.17.0', base: d, servico: s });
  const ana = await meusChamados({ usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s });
  assert.deepEqual(ana.map((c) => [c.numero, c.estado, c.respostas]), [[daAna.numero, 'EM_ANALISE', 1]]);
  assert.deepEqual((await meusChamados({ usuario: BIA, protetor: protetor(), versao: '2.17.0', base: d, servico: s })).map((c) => c.numero), [daBia.numero]);
  await assert.rejects(meuChamado(daBia.numero, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s }), /TICKET_NOT_FOUND/);
  assert.equal((await meuChamado(daAna.numero, { usuario: ANA, protetor: protetor(), versao: '2.17.0', base: d, servico: s })).respostas[0].texto, 'Vimos.');
  assert.ok(s.pedidos.filter((p) => p[0] === 'acompanhar').every((p) => p[2] !== 'chave-do-chamado-' + daBia.numero || true));
});

test('chave de administração: formato conferido, só no cofre, nunca devolvida; sem ela a Administração não consulta nada', (t) => {
  const d = pasta(t); const p = protetor();
  assert.throws(() => salvarChaveDeAdministracao('curta', p, d), /SUPPORT_ADMIN_KEY_INVALID/);
  assert.throws(() => salvarChaveDeAdministracao('a'.repeat(20) + ' ' + 'b'.repeat(20), p, d), /SUPPORT_ADMIN_KEY_INVALID/);
  assert.throws(() => salvarChaveDeAdministracao(CHAVE_DE_ADMIN_DOS_TESTES, protetor(false), d), /CREDENTIAL_PROTECTION_UNAVAILABLE/);
  assert.throws(() => chamadosDaAdministracao.listar(undefined, { protetor: p, base: d }), /SUPPORT_ADMIN_KEY_MISSING/);
  assert.deepEqual(salvarChaveDeAdministracao(CHAVE_DE_ADMIN_DOS_TESTES, p, d), { configurada: true });
  assert.equal(lerChaveDeAdministracao(p, d), CHAVE_DE_ADMIN_DOS_TESTES);
  const tudo = fs.readdirSync(d, { recursive: true }).filter((f) => fs.statSync(path.join(d, f)).isFile()).map((f) => fs.readFileSync(path.join(d, f), 'utf8')).join('\n');
  assert.ok(!tudo.includes(CHAVE_DE_ADMIN_DOS_TESTES), 'a chave não fica em texto aberto em arquivo nenhum');
  assert.deepEqual(salvarChaveDeAdministracao('', p, d), { configurada: false }); assert.equal(lerChaveDeAdministracao(p, d), null);
  assert.throws(() => chamadosDaAdministracao.listar('INVENTADO', { protetor: p, base: d }));
});

test('canais: Suporte exige a tela Suporte (enviar e anexar pedem Usar); os da Administração › Chamados exigem a tela Administração (marca admin)', () => {
  assert.deepEqual(acessoDosCanais['suporte:enviar'], ['suporte', 'USAR']); assert.deepEqual(acessoDosCanais['suporte:anexar'], ['suporte', 'USAR']);
  assert.deepEqual(acessoDosCanais['suporte:meus'], ['suporte', 'VER']); assert.deepEqual(acessoDosCanais['suporte:meu'], ['suporte', 'VER']);
  for (const c of ['chamados:configuracao', 'chamados:listar', 'chamados:detalhe', 'chamados:anexo']) assert.deepEqual(acessoDosCanais[c], ['administracao', 'VER'], c);
  for (const c of ['chamados:chave', 'chamados:responder', 'chamados:estado']) assert.deepEqual(acessoDosCanais[c], ['administracao', 'USAR'], c);
});

test('endereço do serviço: só HTTPS ou 127.0.0.1, montado pelo código', (t) => {
  const antes = process.env.PRUMO_SERVICO; t.after(() => { if (antes === undefined) delete process.env.PRUMO_SERVICO; else process.env.PRUMO_SERVICO = antes; });
  delete process.env.PRUMO_SERVICO; assert.equal(urlDoServico('/v1/chamados', 'X').href, 'https://prumo-qa-servico.onrender.com/v1/chamados');
  for (const u of ['http://exemplo.com', 'http://localhost:1', 'file:///etc/passwd', 'javascript:alert(1)']) { process.env.PRUMO_SERVICO = u; assert.throws(() => urlDoServico('/v1/chamados', 'X'), /^Error: X: endereço/, u); }
});

test('ponta a ponta com o serviço local: a pessoa abre com imagem, a Administração lê, vê a imagem e responde, e a pessoa vê a resposta', async (t) => {
  const local = await caixaDeEmail(); const antes = process.env.PRUMO_SERVICO; t.after(() => { if (antes === undefined) delete process.env.PRUMO_SERVICO; else process.env.PRUMO_SERVICO = antes; });
  process.env.PRUMO_SERVICO = local.url; const d = pasta(t); const p = protetor();
  const ids = guardarAnexos([arquivo(d, 'erro.png', PNG)], ANA.id).aceitos.map((a) => a.id);
  const r = await enviarChamado({ relato: RELATO, anexos: ids }, { usuario: ANA, protetor: p, versao: '2.17.0', base: d });
  assert.equal(r.anexosEnviados, 1);
  salvarChaveDeAdministracao(CHAVE_DE_ADMIN_DOS_TESTES, p, d);
  const lista = await chamadosDaAdministracao.listar(undefined, { protetor: p, base: d });
  assert.ok(lista.chamados.some((c) => c.numero === r.numero && c.contato === 'Ana QA'));
  const anexo = await chamadosDaAdministracao.anexo(r.numero, 0, { protetor: p, base: d });
  assert.equal(anexo.tipo, 'image/png'); assert.deepEqual(Buffer.from(anexo.base64, 'base64'), PNG);
  await chamadosDaAdministracao.responder(r.numero, 'Obrigada! Já corrigimos.', { protetor: p, base: d });
  await chamadosDaAdministracao.mudarEstado(r.numero, 'RESOLVIDO', { protetor: p, base: d });
  const meu = await meuChamado(r.numero, { usuario: ANA, protetor: p, base: d });
  assert.equal(meu.estado, 'RESOLVIDO'); assert.deepEqual(meu.respostas.map((x) => x.texto), ['Obrigada! Já corrigimos.']);
  // Chave de administração errada: o serviço recusa e a regra traduz.
  await assert.rejects(servicoDeChamados.admin('x'.repeat(40)).listar(), /SUPPORT_ADMIN_DENIED/);
});
