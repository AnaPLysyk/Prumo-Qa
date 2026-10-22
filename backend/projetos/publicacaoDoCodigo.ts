/** Snapshot explícito da pasta da IDE e envio verificado para um branch do projeto no GitHub. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { consultarGitSomenteLeitura } from './servicoRepositorioGit.js';
import { bloqueado, segredo, caminhoSeguroDoRepositorio } from './ideRepositorio.js';
import { mascarar } from '../compartilhado/seguranca/mascarar.js';
import { lerLocal, gravarLocal } from '../compartilhado/banco/persistenciaLocal.js';
import { ContextoServico } from '../conexoes/tipos/adaptador.js';
import { Recurso } from './contratos.js';
import { ErroServico } from '../conexoes/integracoes/configuracaoDosServicos.js';

const sha = z.string().regex(/^[a-f0-9]{40}$/);
const resumo = z.record(z.string().regex(/^[a-f0-9]{64}$/));
const registro = z.object({ version: z.literal(1), itens: z.array(z.object({ projeto: z.string().uuid(), recurso: z.string(), pasta: z.string(), arquivos: resumo, commit: sha, em: z.string().datetime() }).strict()).max(200) }).strict();
const ler = (base?: string) => lerLocal('publicacoes-codigo.json', registro, { version: 1 as const, itens: [] }, base);
export type SnapshotCodigo = { arquivos: { caminho: string; bytes: Buffer; hash: string }[]; hashes: Record<string, string> };

/** O Git aplica .gitignore também a uma pasta ainda sem .git, usando metadados temporários separados. */
export async function snapshotDoCodigo(pasta: string): Promise<SnapshotCodigo> {
  let temporaria: string | null = null;
  try {
    const args: string[] = [];
    if (!fs.existsSync(path.join(pasta, '.git'))) {
      temporaria = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-indice-'));
      fs.mkdirSync(path.join(temporaria, 'objects')); fs.mkdirSync(path.join(temporaria, 'refs'));
      fs.writeFileSync(path.join(temporaria, 'HEAD'), 'ref: refs/heads/main\n');
      args.push('--git-dir=' + temporaria, '--work-tree=' + pasta);
    }
    const r = await consultarGitSomenteLeitura([...args, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], pasta, 15000, 500000);
    if (r.codigo !== 0 || r.truncado) throw new Error('CODE_SNAPSHOT_INCOMPLETE: não foi possível listar todos os arquivos pelo Git.');
    const arquivos: SnapshotCodigo['arquivos'] = []; let tamanho = 0;
    for (const caminho of [...new Set(r.saida.split('\0').filter(Boolean))].sort()) {
      if (caminho.split('/').some(p => bloqueado(p) || segredo(p))) continue;
      const alvo = caminhoSeguroDoRepositorio(pasta, caminho);
      if (!fs.existsSync(alvo)) continue; // remoção local aparece comparando com a publicação anterior
      const st = fs.lstatSync(alvo);
      if (!st.isFile() || st.nlink !== 1 || st.size > 1000000) throw new Error('CODE_FILE_BLOCKED: arquivo não regular ou acima de 1 MB: ' + caminho);
      const bytes = fs.readFileSync(alvo); tamanho += bytes.length;
      if (tamanho > 10000000 || arquivos.length >= 1000) throw new Error('CODE_SNAPSHOT_LIMIT: limite de 1000 arquivos e 10 MB por envio.');
      if (!bytes.includes(0) && mascarar(bytes.toString('utf8')) !== bytes.toString('utf8')) throw new Error('CODE_SECRET_BLOCKED: revise o arquivo antes de publicar: ' + caminho);
      arquivos.push({ caminho, bytes, hash: createHash('sha256').update(bytes).digest('hex') });
    }
    return { arquivos, hashes: Object.fromEntries(arquivos.map(a => [a.caminho, a.hash])) };
  } finally {
    if (temporaria) fs.rmSync(temporaria, { recursive: true, force: true });
  }
}

export function estadoDaPublicacao(projeto: string, recurso: string, pasta: string, snapshot: SnapshotCodigo, base?: string) {
  const anterior = ler(base).itens.find(i => i.projeto === projeto && i.recurso === recurso && i.pasta === pasta);
  const alterados = snapshot.arquivos.filter(a => anterior?.arquivos[a.caminho] !== a.hash).map(a => a.caminho);
  const removidos = Object.keys(anterior?.arquivos || {}).filter(a => snapshot.hashes[a] == null);
  return { alterados, removidos, publicadaEm: anterior?.em ?? null, commit: anterior?.commit ?? null, total: snapshot.arquivos.length };
}

const naoEncontrado = (e: unknown) => e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND';
const refDoRamo = (ramo: string) => ramo.split('/').map(encodeURIComponent).join('/');

/** Os bytes aprovados ficam congelados na memória. Não altera o índice, commits ou remotes do Git local. */
export async function publicarSnapshot(ctx: ContextoServico, rec: Recurso, projeto: string, pasta: string, snapshot: SnapshotCodigo, mensagem: string, base?: string) {
  const raiz = '/repos/' + rec.chave.split('/').map(encodeURIComponent).join('/');
  const repo = z.object({ id: z.number(), full_name: z.string(), default_branch: z.string(), size: z.number().optional() }).passthrough().parse(await ctx.ler(raiz));
  if (String(repo.id) !== rec.id || repo.full_name !== rec.chave) throw new Error('CODE_REMOTE_CHANGED');
  const ramo = 'prumo/projeto-' + projeto;
  if (ramo === repo.default_branch) throw new Error('CODE_DEFAULT_BRANCH_BLOCKED');
  const referencia = async (nome: string) => z.object({ object: z.object({ sha }) }).passthrough().parse(await ctx.ler(raiz + '/git/ref/heads/' + refDoRamo(nome))).object.sha;
  let atual: string | null = null;
  try { atual = await referencia(ramo); } catch (e) { if (!naoEncontrado(e) && !(repo.size === 0 && e instanceof ErroServico && e.codigo === 'SERVICE_RESPONSE_INVALID')) throw e; }
  let pai = atual;
  if (!pai) {
    try { pai = await referencia(repo.default_branch); }
    catch (e) {
      if (!naoEncontrado(e) && !(repo.size === 0 && e instanceof ErroServico && e.codigo === 'SERVICE_RESPONSE_INVALID')) throw e;
      // GitHub exige um commit inicial antes de aceitar refs em repositório vazio.
      const primeiro = snapshot.arquivos.find(a => a.caminho === 'README.md') || snapshot.arquivos[0];
      if (!primeiro) throw new Error('CODE_WITHOUT_FILES');
      await ctx.enviar('PUT', raiz + '/contents/' + primeiro.caminho.split('/').map(encodeURIComponent).join('/'), JSON.stringify({ message: 'Iniciar projeto pelo Prumo', content: primeiro.bytes.toString('base64') }));
      pai = await referencia(repo.default_branch);
    }
  }
  const ultimo = z.object({ tree: z.object({ sha }) }).passthrough().parse(await ctx.ler(raiz + '/git/commits/' + pai));
  const remoto = z.object({ truncated: z.boolean(), tree: z.array(z.object({ path: z.string(), sha, mode: z.string(), type: z.string() }).passthrough()) }).passthrough().parse(await ctx.ler(raiz + '/git/trees/' + ultimo.tree.sha + '?recursive=1'));
  if (remoto.truncated) throw new Error('CODE_REMOTE_INCOMPLETE');
  const entradas: { path: string; mode: string; type: 'blob'; sha: string | null }[] = [];
  const estado = estadoDaPublicacao(projeto, rec.id, pasta, snapshot, base);
  // Um branch alterado por fora precisa ser revisado antes de enviar de novo.
  if (atual && estado.commit && atual !== estado.commit) {
    const coincide = snapshot.arquivos.every(a => remoto.tree.some(t => t.path === a.caminho && t.sha === createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + a.bytes.length + '\0'), a.bytes])).digest('hex')));
    if (!coincide || estado.removidos.some(p => remoto.tree.some(t => t.path === p))) throw new Error('CODE_REMOTE_CONFLICT: o branch recebeu alterações externas; revise o GitHub antes de enviar.');
  }
  for (const arquivo of snapshot.arquivos) {
    const blob = createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + arquivo.bytes.length + '\0'), arquivo.bytes])).digest('hex');
    const existente = remoto.tree.find(t => t.path === arquivo.caminho);
    if (existente?.sha === blob) continue;
    const novo = z.object({ sha }).passthrough().parse(await ctx.enviar('POST', raiz + '/git/blobs', JSON.stringify({ content: arquivo.bytes.toString('base64'), encoding: 'base64' })));
    if (novo.sha !== blob) throw new Error('CODE_BLOB_NOT_CONFIRMED');
    entradas.push({ path: arquivo.caminho, mode: existente?.mode === '100755' ? '100755' : '100644', type: 'blob', sha: novo.sha });
  }
  for (const removido of estado.removidos) if (remoto.tree.some(t => t.path === removido)) entradas.push({ path: removido, mode: '100644', type: 'blob', sha: null });
  let commit = pai; let arvoreEsperada = ultimo.tree.sha;
  if (entradas.length) {
    const arvore = z.object({ sha }).passthrough().parse(await ctx.enviar('POST', raiz + '/git/trees', JSON.stringify({ base_tree: ultimo.tree.sha, tree: entradas })));
    arvoreEsperada = arvore.sha;
    commit = z.object({ sha }).passthrough().parse(await ctx.enviar('POST', raiz + '/git/commits', JSON.stringify({ message: mensagem, tree: arvore.sha, parents: [pai] }))).sha;
  }
  if (atual && atual !== commit) await ctx.enviar('PATCH', raiz + '/git/refs/heads/' + refDoRamo(ramo), JSON.stringify({ sha: commit, force: false }));
  else if (!atual) await ctx.enviar('POST', raiz + '/git/refs', JSON.stringify({ ref: 'refs/heads/' + ramo, sha: commit }));
  if (await referencia(ramo) !== commit) throw new Error('CODE_NOT_CONFIRMED: o envio não foi confirmado no GitHub.');
  const confirmado = z.object({ tree: z.object({ sha }) }).passthrough().parse(await ctx.ler(raiz + '/git/commits/' + commit));
  if (confirmado.tree.sha !== arvoreEsperada) throw new Error('CODE_TREE_NOT_CONFIRMED');
  const dados = ler(base); dados.itens = dados.itens.filter(i => i.projeto !== projeto || i.recurso !== rec.id || i.pasta !== pasta);
  dados.itens.push({ projeto, recurso: rec.id, pasta, arquivos: snapshot.hashes, commit, em: new Date().toISOString() });
  gravarLocal('publicacoes-codigo.json', registro.parse(dados), base);
  return { ramo, commit, arquivos: snapshot.arquivos.length, url: 'https://github.com/' + rec.chave + '/tree/' + refDoRamo(ramo) };
}
