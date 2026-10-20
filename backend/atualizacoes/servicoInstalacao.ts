/** Lógica e contratos de atualizacoes: operações relacionadas no mesmo módulo. */
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { analisarVersao } from "../ajuda/servicoVersoes.js";
import { LIMITE_INSTALADOR, Opcoes, HOSTS } from "./contratos.js";
import { repositorio } from "../ajuda/contratos.js";

const enderecoDoInstalador = (v: string) => `https://github.com/${repositorio}/releases/download/v${v}/${nomeDoInstalador(v)}`;

/** Baixa e confere. Devolve o caminho do instalador verificado; em qualquer falha apaga o que baixou. */
export async function baixarAtualizacao(versao: string, o: Opcoes = {}): Promise<{ arquivo: string; sha256: string; bytes: number }> {
  if (!analisarVersao(versao) || versao !== versao.trim().replace(/^v/, '')) throw new Error('INVALID_VERSION: versão inválida.');
  const base = o.base && o.permitirLocal ? o.base.replace(/\/$/, '') : null;
  const url = base ? `${base}/${nomeDoInstalador(versao)}` : enderecoDoInstalador(versao);
  const textoHash = await (await baixarComRedirecionamentoSeguro(url + '.sha256', o)).text();
  const esperado = new RegExp(`^([0-9a-f]{64})\\s+\\*?${nomeDoInstalador(versao).replace(/\./g, '\\.')}\\s*$`, 'i').exec(textoHash.trim())?.[1]?.toLowerCase();
  if (!esperado) throw new Error('UPDATE_HASH_MISSING: a release não publicou um SHA-256 válido para o instalador. Nada foi baixado nem instalado.');
  const pasta = fs.mkdtempSync(path.join(o.pasta ?? os.tmpdir(), 'prumo-atualizacao-'));
  const arquivo = path.join(pasta, nomeDoInstalador(versao));
  try {
    const r = await baixarComRedirecionamentoSeguro(url, o); if (!r.body) throw new Error('UPDATE_DOWNLOAD_FAILED: resposta sem conteúdo. Nada foi instalado.');
    const resumo = createHash('sha256'); let bytes = 0;
    const origem = Readable.from(r.body as unknown as AsyncIterable<Uint8Array>);
    async function* conferirPartes() {
      for await (const parte of origem) {
        bytes += parte.byteLength;
        if (bytes > LIMITE_INSTALADOR) throw new Error('UPDATE_DOWNLOAD_FAILED: instalador maior que o limite. Nada foi instalado.');
        resumo.update(parte);
        yield parte;
      }
    }
    await pipeline(Readable.from(conferirPartes()), fs.createWriteStream(arquivo, { flags: 'wx', mode: 0o700 }));
    const obtido = resumo.digest('hex');
    if (obtido !== esperado) throw new Error(`UPDATE_HASH_MISMATCH: o SHA-256 do instalador baixado (${obtido.slice(0, 12)}…) não confere com o publicado (${esperado.slice(0, 12)}…). O arquivo foi apagado e nada foi instalado.`);
    return { arquivo, sha256: obtido, bytes };
  } catch (e) { fs.rmSync(pasta, { recursive: true, force: true }); throw e; }
}

/** GET com redirecionamento seguido à mão: cada salto é conferido contra a lista de hosts. */
export async function baixarComRedirecionamentoSeguro(inicial: string, o: Opcoes): Promise<Response> {
  let url = new URL(inicial);
  for (let saltos = 0; saltos < 6; saltos++) {
    if (!downloadPermitido(url, !!o.permitirLocal)) throw new Error(`UPDATE_DESTINATION_FORBIDDEN: destino de download não autorizado (${url.hostname}).`);
    let r: Response;
    try { r = await (o.buscar ?? fetch)(url, { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', headers: { 'User-Agent': 'PrumoQA-atualizacao' }, signal: AbortSignal.timeout(o.timeoutMs ?? 10 * 60 * 1000) }); }
    catch (e) { throw new Error(`UPDATE_DOWNLOAD_FAILED: não foi possível baixar do GitHub (${(e as Error).name === 'TimeoutError' ? 'tempo esgotado' : 'sem conexão ou recusado'}). Nada foi instalado.`); }
    if (r.status >= 300 && r.status < 400) { const destino = r.headers.get('location'); if (!destino) break; url = new URL(destino, url); continue; }
    if (!r.ok) throw new Error(`UPDATE_DOWNLOAD_FAILED: o GitHub respondeu HTTP ${r.status} ao baixar ${path.basename(url.pathname)}. Nada foi instalado.`);
    return r;
  }
  throw new Error('UPDATE_DOWNLOAD_FAILED: redirecionamentos demais ao baixar. Nada foi instalado.');
}

/** Destino autorizado: fixo. Em desenvolvimento, testes podem usar um servidor em 127.0.0.1 (permitirLocal). */
export function destinoAutorizado(url: string, permitirLocal = false): boolean {
  let u: URL; try { u = new URL(url); } catch { return false; }
  if (u.protocol === 'https:' && u.hostname === 'api.github.com' && u.pathname === `/repos/${repositorio}/releases/latest` && !u.search && !u.username && !u.password && !u.port) return true;
  return permitirLocal && u.protocol === 'http:' && u.hostname === '127.0.0.1';
}

export function downloadPermitido(url: URL, permitirLocal: boolean) {
  if (url.username || url.password || url.port) return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
  if (url.protocol === 'https:' && HOSTS.has(url.hostname)) return true;
  return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
}

/** Copia o arquivo verificado para a pasta de destino sem sobrescrever nada (acrescenta -1, -2…) e apaga a pasta temporária. */
export function entregarInstalador(arquivo: string, destino: string, plataforma: PlataformaDoInstalador): string {
  fs.mkdirSync(destino, { recursive: true });
  const { name, ext } = path.parse(arquivo);
  let final = path.join(destino, name + ext);
  for (let n = 1; fs.existsSync(final); n++) final = path.join(destino, `${name}-${n}${ext}`);
  fs.copyFileSync(arquivo, final, fs.constants.COPYFILE_EXCL);
  if (plataforma === 'linux-appimage') fs.chmodSync(final, 0o755);
  fs.rmSync(path.dirname(arquivo), { recursive: true, force: true });
  return final;
}

/** Passo seguinte, em uma frase, para cada sistema (mostrado na confirmação e na janela). */
export function instrucaoDeInstalacao(plataforma: PlataformaDoInstalador): string {
  switch (plataforma) {
    case 'mac-arm64': case 'mac-x64': return 'Abra o arquivo .dmg e arraste o Prumo QA para Aplicativos. Na primeira abertura, clique com o botão direito no Prumo QA e escolha Abrir (o app não é assinado pela Apple).';
    case 'linux-appimage': return 'O arquivo já está executável: dê dois cliques ou rode ./ nele. Em Ubuntu 22.04 ou mais novo, instale antes o libfuse2.';
    case 'linux-deb': return 'Instale com: sudo apt install ./<arquivo>.deb (ou abra o arquivo no instalador de pacotes).';
    default: return 'Execute o instalador baixado.';
  }
}

export function nomeDoInstalador(v: string, plataforma: PlataformaDoInstalador | null = plataformaDoInstalador()): string {
  switch (plataforma) {
    case 'win': return `Prumo-QA-Setup-${v}.exe`;
    case 'mac-arm64': return `Prumo-QA-${v}-mac-arm64.dmg`;
    case 'mac-x64': return `Prumo-QA-${v}-mac-x64.dmg`;
    case 'linux-appimage': return `Prumo-QA-${v}-linux-x86_64.AppImage`;
    case 'linux-deb': return `Prumo-QA-${v}-linux-amd64.deb`;
    default: throw new Error('UPDATE_UNSUPPORTED: não há instalador oficial para este sistema; baixe pela página de download.');
  }
}

/** Qual instalador serve a este computador: Windows, macOS (Apple Silicon ou Intel) ou Linux (AppImage ou .deb). */

export type PlataformaDoInstalador = 'win' | 'mac-arm64' | 'mac-x64' | 'linux-appimage' | 'linux-deb';

/** Devolve null onde não há instalador oficial (por exemplo Linux em ARM): a atualização automática fica indisponível. */
export function plataformaDoInstalador(sistema: string = process.platform, arquitetura: string = process.arch, ambiente: NodeJS.ProcessEnv = process.env): PlataformaDoInstalador | null {
  if (sistema === 'win32') return arquitetura === 'x64' ? 'win' : null;
  if (sistema === 'darwin') return arquitetura === 'arm64' ? 'mac-arm64' : arquitetura === 'x64' ? 'mac-x64' : null;
  if (sistema === 'linux' && arquitetura === 'x64') return ambiente.APPIMAGE ? 'linux-appimage' : 'linux-deb';
  return null;
}
