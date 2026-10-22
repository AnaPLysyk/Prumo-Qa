/** Publicação com GitHub e persistência simulados; pastas temporárias próprias para leitura local. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const banco = new Map();
mock.module('../../../../dist/compartilhado/banco/persistenciaLocal.js', { exports: {
  lerLocal: (nome, schema, padrao, base) => schema.parse(structuredClone(banco.get(base + nome) ?? padrao)),
  gravarLocal: (nome, dados, base) => banco.set(base + nome, structuredClone(dados))
} });
const { snapshotDoCodigo, estadoDaPublicacao, publicarSnapshot } = await import('../../../../dist/projetos/publicacaoDoCodigo.js');
const { criarProjetoLocal } = await import('../../../../dist/projetos/criarProjetoLocal.js');
const { ErroServico } = await import('../../../../dist/conexoes/integracoes/configuracaoDosServicos.js');
const hash = x => createHash('sha256').update(x).digest('hex');
const blob = x => createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + x.length + '\0'), x])).digest('hex');
const snap = dados => { const arquivos = Object.entries(dados).map(([caminho, texto]) => { const bytes = Buffer.from(texto); return { caminho, bytes, hash: hash(bytes) }; }); return { arquivos, hashes: Object.fromEntries(arquivos.map(a => [a.caminho, a.hash])) }; };
const rec = { id: '42', chave: 'pessoa/projeto', nome: 'projeto' };
function github({ vazio = false, perderResposta = false } = {}) {
  let n = 1, perder = perderResposta;
  const novoSha = () => (++n).toString(16).padStart(40, '0');
  const arvores = new Map(), commits = new Map(), refs = new Map(), envios = [];
  const raiz = novoSha(); arvores.set(raiz, [{ path: 'remoto.txt', mode: '100644', type: 'blob', sha: blob(Buffer.from('preservar')) }]);
  const inicial = novoSha(); commits.set(inicial, { tree: { sha: raiz } }); if (!vazio) refs.set('main', inicial);
  const ctx = { servico: 'github', instancia: 'https://api.github.com', limpar: v => v,
    ler: async p => {
      if (p === '/repos/pessoa/projeto') return { id: 42, full_name: rec.chave, default_branch: 'main', size: refs.size ? 1 : 0 };
      if (p.includes('/git/ref/heads/')) { const ramo = p.split('/git/ref/heads/')[1]; if (!refs.size) throw new ErroServico('SERVICE_RESPONSE_INVALID'); if (!refs.has(ramo)) throw new ErroServico('SERVICE_NOT_FOUND'); return { object: { sha: refs.get(ramo) } }; }
      if (p.includes('/git/commits/')) { const c = commits.get(p.split('/').at(-1)); assert.ok(c, p); return c; }
      if (p.includes('/git/trees/')) return { truncated: false, tree: arvores.get(p.split('/git/trees/')[1].split('?')[0]) };
      throw new Error('Leitura inesperada ' + p);
    },
    enviar: async (metodo, p, corpo) => {
      const d = JSON.parse(corpo); envios.push({ metodo, p, d });
      if (p.endsWith('/git/blobs')) return { sha: blob(Buffer.from(d.content, 'base64')) };
      if (p.endsWith('/git/trees')) { const tree = new Map(arvores.get(d.base_tree).map(x => [x.path, x])); for (const x of d.tree) { if (x.sha == null) tree.delete(x.path); else tree.set(x.path, x); } const sha = novoSha(); arvores.set(sha, [...tree.values()]); return { sha }; }
      if (p.endsWith('/git/commits')) { const sha = novoSha(); commits.set(sha, { tree: { sha: d.tree }, parents: d.parents }); return { sha }; }
      if (p.includes('/contents/')) { refs.set('main', inicial); return { commit: { sha: inicial } }; }
      if (p.endsWith('/git/refs') || p.includes('/git/refs/heads/')) {
        const ramo = d.ref ? d.ref.slice('refs/heads/'.length) : p.split('/git/refs/heads/')[1];
        assert.notEqual(ramo, 'main'); assert.notEqual(d.force, true); refs.set(ramo, d.sha);
        if (perder) { perder = false; throw new ErroServico('SERVICE_TIMEOUT'); }
        return { object: { sha: d.sha } };
      }
      throw new Error('Escrita inesperada ' + p);
    }
  };
  return { ctx, refs, envios, commits, arvores, novoSha };
}

test('envia bytes aprovados em branch próprio, preserva arquivos remotos e só confirma após releitura', async () => {
  const g = github(), projeto = randomUUID(), base = randomUUID(), snapshot = snap({ 'src/app.js': 'const valor = 1;', 'img.bin': '\x00\x01\x02' });
  const r = await publicarSnapshot(g.ctx, rec, projeto, 'pasta-A', snapshot, 'Primeiro envio', base);
  assert.equal(r.ramo, 'prumo/projeto-' + projeto);
  assert.equal(estadoDaPublicacao(projeto, rec.id, 'pasta-A', snapshot, base).alterados.length, 0);
  const tree = g.arvores.get(g.commits.get(r.commit).tree.sha);
  assert.deepEqual(tree.map(x => x.path).sort(), ['img.bin', 'remoto.txt', 'src/app.js']);
  assert.ok(g.envios.some(x => x.p.endsWith('/git/blobs') && x.d.encoding === 'base64'));
  assert.equal(estadoDaPublicacao(randomUUID(), rec.id, 'pasta-A', snapshot, base).alterados.length, 2);
  assert.equal(estadoDaPublicacao(projeto, 'outro-recurso', 'pasta-A', snapshot, base).alterados.length, 2);
  assert.equal(estadoDaPublicacao(projeto, rec.id, 'outra-pasta', snapshot, base).alterados.length, 2);
});

test('edição permanece em rascunho até enviar e remoção só alcança arquivos antes publicados', async () => {
  const g = github(), projeto = randomUUID(), base = randomUUID();
  await publicarSnapshot(g.ctx, rec, projeto, 'pasta', snap({ 'a.txt': 'a', 'b.txt': 'b' }), 'Inicial', base);
  const atual = snap({ 'a.txt': 'mudou' }); const antes = g.envios.length;
  const estado = estadoDaPublicacao(projeto, rec.id, 'pasta', atual, base);
  assert.deepEqual(estado.alterados, ['a.txt']); assert.deepEqual(estado.removidos, ['b.txt']); assert.equal(g.envios.length, antes);
  const r = await publicarSnapshot(g.ctx, rec, projeto, 'pasta', atual, 'Atualizar', base);
  assert.deepEqual(g.arvores.get(g.commits.get(r.commit).tree.sha).map(x => x.path).sort(), ['a.txt', 'remoto.txt']);
});

test('resposta perdida não marca publicado e repetir reconcilia sem duplicar commit', async () => {
  const g = github({ perderResposta: true }), projeto = randomUUID(), base = randomUUID(), s = snap({ 'teste.js': 'ok' });
  await assert.rejects(publicarSnapshot(g.ctx, rec, projeto, 'pasta', s, 'Enviar', base), /SERVICE_TIMEOUT/);
  assert.equal(estadoDaPublicacao(projeto, rec.id, 'pasta', s, base).publicadaEm, null);
  const commits = g.commits.size;
  await publicarSnapshot(g.ctx, rec, projeto, 'pasta', s, 'Enviar', base);
  assert.equal(g.commits.size, commits);
  assert.equal(estadoDaPublicacao(projeto, rec.id, 'pasta', s, base).alterados.length, 0);
});

test('branch alterado externamente recusa sobrescrita e mantém alterações locais pendentes', async () => {
  const g = github(), projeto = randomUUID(), base = randomUUID();
  await publicarSnapshot(g.ctx, rec, projeto, 'pasta', snap({ 'a.txt': 'original' }), 'Enviar', base);
  const externo = g.novoSha(); g.commits.set(externo, g.commits.get(g.refs.get('main'))); g.refs.set('prumo/projeto-' + projeto, externo);
  const n = g.envios.length;
  await assert.rejects(publicarSnapshot(g.ctx, rec, projeto, 'pasta', snap({ 'a.txt': 'nova edição' }), 'Atualizar', base), /CODE_REMOTE_CONFLICT/);
  assert.equal(g.envios.length, n);
});

test('repositório existente vazio (409 convertido pelo transporte) recebe inicialização explícita', async () => {
  const g = github({ vazio: true });
  await publicarSnapshot(g.ctx, rec, randomUUID(), 'pasta', snap({ 'README.md': '# Projeto' }), 'Inicial', randomUUID());
  assert.equal(g.envios.filter(x => x.metodo === 'PUT' && x.p.endsWith('/contents/README.md')).length, 1);
});

function temporario(t) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-codigo-fixture-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; }
test('pasta sem Git respeita gitignore, não cria .git local e isola arquivos de duas pastas', async t => {
  const a = temporario(t), b = temporario(t);
  fs.writeFileSync(path.join(a, '.gitignore'), 'ignorado.txt\n'); fs.writeFileSync(path.join(a, 'ignorado.txt'), 'privado');
  fs.writeFileSync(path.join(a, 'teste.js'), 'teste A'); fs.writeFileSync(path.join(a, '.env'), 'fixture'); fs.writeFileSync(path.join(b, 'outro.js'), 'teste B');
  const s = await snapshotDoCodigo(a);
  assert.deepEqual(s.arquivos.map(x => x.caminho), ['.gitignore', 'teste.js']);
  assert.equal(fs.existsSync(path.join(a, '.git')), false);
  assert.deepEqual((await snapshotDoCodigo(b)).arquivos.map(x => x.caminho), ['outro.js']);
});
test('criar do zero preserva pastas existentes e recusa saída da pasta escolhida', t => {
  const pai = temporario(t);
  const pasta = criarProjetoLocal(pai, 'novo-projeto', 'Projeto de teste');
  assert.ok(fs.existsSync(path.join(pasta, 'testes', '.gitkeep')));
  assert.throws(() => criarProjetoLocal(pai, 'novo-projeto', 'Outro'), /EEXIST/);
  assert.match(fs.readFileSync(path.join(pasta, 'README.md'), 'utf8'), /Projeto de teste/);
  assert.throws(() => criarProjetoLocal(pai, '../fora', 'Fora'), /PROJECT_FOLDER_NAME_INVALID/);
});
