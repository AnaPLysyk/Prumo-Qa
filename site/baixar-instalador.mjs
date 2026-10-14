// Traz os instaladores da última release publicada para dentro do site (site/public/download), para os botões de download
// servirem os arquivos do próprio Render. Cada arquivo só entra se o SHA-256 bater com o .sha256 da release (e, no Windows,
// com o catálogo). O do Windows é obrigatório: qualquer falha nele derruba o build e o site anterior continua no ar. Os de
// macOS e Linux entram quando já foram anexados à release (o CI deles termina depois do Windows); os que faltam são
// omitidos do site, nunca anunciados.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { instaladoresDaVersao } from './instaladores.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoUrl = 'https://github.com/AnaPLysyk/Prumo-Qa';
const limite = 600 * 1024 * 1024;

async function baixar(url) {
  const r = await fetch(url, { redirect: 'follow' });
  return r;
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
    const checksum = /^([0-9a-f]{64})\s+\*?(.+)$/i.exec((await hashResp.text()).trim());
    const esperado = checksum?.[2] === item.arquivo ? checksum[1].toLowerCase() : undefined;
    if (!esperado) throw new Error(`${item.arquivo}.sha256 da release não tem um SHA-256 válido.`);
    if (item.id === 'win' && esperado !== publicada.installer.sha256) throw new Error(`SHA-256 de ${item.arquivo} na release difere do catálogo.`);
    const resposta = await baixar(url);
    if (!resposta.ok) throw new Error(`GitHub respondeu HTTP ${resposta.status} para ${item.arquivo}.`);
    const corpo = Buffer.from(await resposta.arrayBuffer());
    if (corpo.length > limite) throw new Error(`${item.arquivo} maior que o limite aceito.`);
    const calculado = crypto.createHash('sha256').update(corpo).digest('hex');
    if (calculado !== esperado) throw new Error(`SHA-256 de ${item.arquivo} difere do publicado (${calculado}).`);
    fs.writeFileSync(path.join(destino, item.arquivo), corpo);
    fs.writeFileSync(path.join(destino, `${item.arquivo}.sha256`), `${esperado}  ${item.arquivo}\n`);
    entregues.push({ id: item.id, sistema: item.sistema, detalhe: item.detalhe, arquivo: item.arquivo, sha256: esperado, bytes: corpo.length });
  }
  fs.writeFileSync(path.join(destino, 'instaladores.json'), JSON.stringify({ version: publicada.version, instaladores: entregues }, null, 2) + '\n');
  return { version: publicada.version, instaladores: entregues };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  baixarInstaladores().then((r) => { for (const i of r.instaladores) console.log(`${i.arquivo} (${i.bytes} bytes) conferido e copiado.`); console.log(`Versão ${r.version}: ${r.instaladores.length} instalador(es) em site/public/download.`); }, (e) => { console.error(e.message); process.exit(1); });
}
