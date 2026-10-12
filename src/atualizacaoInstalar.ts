import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { repositorio, analisarVersao } from './versoes.js';

/**
 * 2.10.2: atualizar com um clique. Só depois da confirmação da pessoa, baixa o instalador OFICIAL da release (URL montada
 * aqui a partir da versão validada, nunca recebida da janela), baixa o .sha256 publicado pelo CI na mesma release e só
 * devolve o arquivo se o resumo conferir. Redirecionamentos só para os hosts de download do GitHub, sempre HTTPS.
 * O SHA-256 vem da mesma release: protege contra download corrompido ou trocado no caminho, não contra a conta do
 * repositório comprometida (o instalador não é assinado; ver docs/SEGURANCA.md).
 */
const HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
const LIMITE_INSTALADOR = 512 * 1024 * 1024;
export const nomeInstalador = (v: string) => `Prumo-QA-Setup-${v}.exe`;
export const urlInstalador = (v: string) => `https://github.com/${repositorio}/releases/download/v${v}/${nomeInstalador(v)}`;

type Opcoes = { buscar?: typeof fetch; base?: string; permitirLocal?: boolean; pasta?: string; timeoutMs?: number };

function permitido(url: URL, permitirLocal: boolean) {
  if (url.username || url.password || url.port) return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
  if (url.protocol === 'https:' && HOSTS.has(url.hostname)) return true;
  return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
}

/** GET com redirecionamento seguido à mão: cada salto é conferido contra a lista de hosts. */
async function obter(inicial: string, o: Opcoes): Promise<Response> {
  let url = new URL(inicial);
  for (let saltos = 0; saltos < 6; saltos++) {
    if (!permitido(url, !!o.permitirLocal)) throw new Error(`UPDATE_DESTINATION_FORBIDDEN: destino de download não autorizado (${url.hostname}).`);
    let r: Response;
    try { r = await (o.buscar ?? fetch)(url, { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', headers: { 'User-Agent': 'PrumoQA-atualizacao' }, signal: AbortSignal.timeout(o.timeoutMs ?? 10 * 60 * 1000) }); }
    catch (e) { throw new Error(`UPDATE_DOWNLOAD_FAILED: não foi possível baixar do GitHub (${(e as Error).name === 'TimeoutError' ? 'tempo esgotado' : 'sem conexão ou recusado'}). Nada foi instalado.`); }
    if (r.status >= 300 && r.status < 400) { const destino = r.headers.get('location'); if (!destino) break; url = new URL(destino, url); continue; }
    if (!r.ok) throw new Error(`UPDATE_DOWNLOAD_FAILED: o GitHub respondeu HTTP ${r.status} ao baixar ${path.basename(url.pathname)}. Nada foi instalado.`);
    return r;
  }
  throw new Error('UPDATE_DOWNLOAD_FAILED: redirecionamentos demais ao baixar. Nada foi instalado.');
}

/** Baixa e confere. Devolve o caminho do instalador verificado; em qualquer falha apaga o que baixou. */
export async function baixarAtualizacao(versao: string, o: Opcoes = {}): Promise<{ arquivo: string; sha256: string; bytes: number }> {
  if (!analisarVersao(versao) || versao !== versao.trim().replace(/^v/, '')) throw new Error('INVALID_VERSION: versão inválida.');
  const base = o.base && o.permitirLocal ? o.base.replace(/\/$/, '') : null;
  const url = base ? `${base}/${nomeInstalador(versao)}` : urlInstalador(versao);
  const textoHash = await (await obter(url + '.sha256', o)).text();
  const esperado = new RegExp(`^([0-9a-f]{64})\\s+\\*?${nomeInstalador(versao).replace(/\./g, '\\.')}\\s*$`, 'i').exec(textoHash.trim())?.[1]?.toLowerCase();
  if (!esperado) throw new Error('UPDATE_HASH_MISSING: a release não publicou um SHA-256 válido para o instalador. Nada foi baixado nem instalado.');
  const pasta = fs.mkdtempSync(path.join(o.pasta ?? os.tmpdir(), 'prumo-atualizacao-'));
  const arquivo = path.join(pasta, nomeInstalador(versao));
  try {
    const r = await obter(url, o); if (!r.body) throw new Error('UPDATE_DOWNLOAD_FAILED: resposta sem conteúdo. Nada foi instalado.');
    const resumo = createHash('sha256'); let bytes = 0; const saida = fs.createWriteStream(arquivo, { flags: 'wx', mode: 0o700 });
    try {
      for await (const parte of r.body as unknown as AsyncIterable<Uint8Array>) {
        bytes += parte.byteLength; if (bytes > LIMITE_INSTALADOR) throw new Error('UPDATE_DOWNLOAD_FAILED: instalador maior que o limite. Nada foi instalado.');
        resumo.update(parte); if (!saida.write(parte)) await new Promise<void>((ok) => saida.once('drain', () => ok()));
      }
    } finally { await new Promise<void>((ok) => saida.end(() => ok())); }
    const obtido = resumo.digest('hex');
    if (obtido !== esperado) throw new Error(`UPDATE_HASH_MISMATCH: o SHA-256 do instalador baixado (${obtido.slice(0, 12)}…) não confere com o publicado (${esperado.slice(0, 12)}…). O arquivo foi apagado e nada foi instalado.`);
    return { arquivo, sha256: obtido, bytes };
  } catch (e) { fs.rmSync(pasta, { recursive: true, force: true }); throw e; }
}

/** Argumentos do instalador NSIS do electron-builder: silencioso, mantém atalhos e reabre o aplicativo ao terminar. */
export const argumentosInstalador = ['/S', '--updated', '--force-run'] as const;
