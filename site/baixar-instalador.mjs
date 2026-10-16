// Traz os instaladores da última release publicada para dentro do site (site/public/download), para os botões de download
// servirem os arquivos do próprio Render. Cada arquivo só entra se o SHA-256 bater com o .sha256 da release (e, no Windows,
// com o catálogo). O do Windows é obrigatório: qualquer falha nele derruba o build e o site anterior continua no ar. Os de
// macOS e Linux entram quando já foram anexados à release (o CI deles termina depois do Windows); os que faltam são
// omitidos do site, nunca anunciados.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { instaladoresDaVersao } from './instaladores.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoUrl = 'https://github.com/AnaPLysyk/Prumo-Qa';
const limite = 600 * 1024 * 1024;
const limiteChecksum = 4096;

// O prazo cobre também a leitura do corpo; não apenas os cabeçalhos HTTP.
async function baixar(url) {
  return fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10 * 60 * 1000) });
}

/** O arquivo .sha256 é texto curto: recusar conteúdo excessivo antes de armazená-lo. */
export async function lerChecksumSeguro(resposta, maximo = limiteChecksum) {
  if (!resposta.body) throw new Error('Resposta SHA-256 sem conteúdo.');
  const partes = []; let bytes = 0;
  for await (const parte of resposta.body) {
    bytes += parte.byteLength;
    if (bytes > maximo) throw new Error('Resposta SHA-256 maior que o limite aceito.');
    partes.push(Buffer.from(parte));
  }
  return Buffer.concat(partes).toString('utf8');
}

/** Stream direto a um arquivo temporário. Hash, teto e publicação são verificados sem carregar o instalador na RAM. */
export async function gravarInstaladorConferido(resposta, destino, esperado, maximo = limite) {
  if (!resposta.body) throw new Error('Instalador sem conteúdo.');
  const declarado = resposta.headers.get('content-length');
  if (declarado !== null && Number(declarado) > maximo) throw new Error('Instalador maior que o limite aceito.');
  const temporario = destino + '.parcial-' + crypto.randomUUID();
  const hash = crypto.createHash('sha256'); let bytes = 0;
  const conferir = new Transform({
    transform(parte, _encoding, proximo) {
      bytes += parte.length;
      if (bytes > maximo) return proximo(new Error('Instalador maior que o limite aceito.'));
      hash.update(parte);
      proximo(null, parte);
    }
  });
  try {
    await pipeline(Readable.fromWeb(resposta.body), conferir, fs.createWriteStream(temporario, { flags: 'wx' }));
    const calculado = hash.digest('hex');
    if (calculado !== esperado) throw new Error(`SHA-256 de ${path.basename(destino)} difere do publicado (${calculado}).`);
    fs.renameSync(temporario, destino);
    return bytes;
  } finally {
    fs.rmSync(temporario, { force: true });
  }
}

export async function baixarInstaladores(out = path.join(repo, 'site/public')) {
  const versoes = JSON.parse(fs.readFileSync(path.join(repo, 'docs/catalogo/versoes.json'), 'utf8')).versions;
  const publicada = versoes.find((v) => v.status === 'publicada');
  if (!publicada?.installer) throw new Error('A última versão publicada não tem instalador registrado no catálogo.');
  const destino = path.join(out, 'download');
  fs.mkdirSync(destino, { recursive: true });
  const entregues = [];
  for (const item of instaladoresDaVersao(publicada.version)) {
    const url = `${repoUrl}/releases/download/v${publicada.version}/${encodeURIComponent(item.arquivo)}`;
    const hashResp = await baixar(`${url}.sha256`);
    if (!hashResp.ok) {
      if (item.obrigatorio) throw new Error(`GitHub respondeu HTTP ${hashResp.status} para ${item.arquivo}.sha256.`);
      console.log(`Sem ${item.arquivo} na release ainda; omitido do site.`);
      continue;
    }
    const checksum = /^([0-9a-f]{64})\s+\*?(.+)$/i.exec((await lerChecksumSeguro(hashResp)).trim());
    const esperado = checksum?.[2] === item.arquivo ? checksum[1].toLowerCase() : undefined;
    if (!esperado) throw new Error(`${item.arquivo}.sha256 da release não tem um SHA-256 válido.`);
    if (item.id === 'win' && esperado !== publicada.installer.sha256) throw new Error(`SHA-256 de ${item.arquivo} na release difere do catálogo.`);
    const resposta = await baixar(url);
    if (!resposta.ok) throw new Error(`GitHub respondeu HTTP ${resposta.status} para ${item.arquivo}.`);
    const bytes = await gravarInstaladorConferido(resposta, path.join(destino, item.arquivo), esperado);
    fs.writeFileSync(path.join(destino, `${item.arquivo}.sha256`), `${esperado}  ${item.arquivo}\n`);
    entregues.push({ id: item.id, sistema: item.sistema, detalhe: item.detalhe, arquivo: item.arquivo, sha256: esperado, bytes });
  }
  fs.writeFileSync(path.join(destino, 'instaladores.json'), JSON.stringify({ version: publicada.version, instaladores: entregues }, null, 2) + '\n');
  return { version: publicada.version, instaladores: entregues };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  baixarInstaladores().then((r) => { for (const i of r.instaladores) console.log(`${i.arquivo} (${i.bytes} bytes) conferido e copiado.`); console.log(`Versão ${r.version}: ${r.instaladores.length} instalador(es) em site/public/download.`); }, (e) => { console.error(e.message); process.exit(1); });
}
