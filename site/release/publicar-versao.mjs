// Marca uma versão como PUBLICADA no catálogo (docs/catalogo/versoes.json) depois que a release oficial existe e o instalador foi conferido.
// É o último passo da rotina de release: o site e o aplicativo passam a oferecer essa versão (download, SHA-256 e aviso).
// Uso: node site/release/publicar-versao.mjs <versão> <sha256> [AAAA-MM-DD]   (o CI chama sozinho após conferir a release)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arquivo = path.join(repo, 'docs/catalogo/versoes.json');
const [versao, sha, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(versao ?? '')) throw new Error('Uso: node site/release/publicar-versao.mjs <versão> <sha256> [AAAA-MM-DD]');
if (!/^[0-9a-f]{64}$/.test(sha ?? '')) throw new Error('SHA-256 inválido: 64 caracteres hexadecimais minúsculos.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Data inválida: use AAAA-MM-DD.');

const catalogo = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const v = catalogo.versions.find((x) => x.version === versao);
if (!v) throw new Error(`A versão ${versao} não está no catálogo: registre-a antes de criar a tag.`);
const releaseUrl = `https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v${versao}`;
const installer = { file: `Prumo-QA-Setup-${versao}.exe`, sha256: sha };
if (v.status === 'publicada' && v.installer?.sha256 === sha && v.releaseUrl === releaseUrl) { console.log(`${versao} já estava publicada no catálogo.`); process.exit(0); }
if (v.status === 'publicada' && v.installer && v.installer.sha256 !== sha) throw new Error(`${versao} já está publicada com outro SHA-256 (${v.installer.sha256}). Nada foi alterado.`);
Object.assign(v, { status: 'publicada', date: v.date ?? data, releaseUrl, installer });
// Validação completa do catálogo (esquema, ordem e coerência) antes de gravar.
const { validarVersoes } = await import(new URL('../../dist/ajuda/servicoVersoes.js', import.meta.url).href).catch(() => ({ validarVersoes: null }));
if (validarVersoes) validarVersoes(catalogo); else console.warn('dist/ajuda/servicoVersoes.js ausente (rode npm run build): gravado sem a validação completa.');
fs.writeFileSync(arquivo, JSON.stringify(catalogo, null, 2) + '\n');
console.log(`${versao} marcada como publicada: ${releaseUrl} · SHA-256 ${sha} · ${v.date}`);
