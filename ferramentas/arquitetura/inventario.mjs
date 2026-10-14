/** Compara fontes versionadas com o checkpoint inicial, sem ler dados de projetos ou perfis. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const antes = '245710462ee4859f3740807bb5bb85ec04b71478';
const pastas = ['frontend', 'backend', 'testes', 'site', 'scripts', 'ferramentas', 'reporters', 'skills'];
const nomes = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const antigos = nomes(['ls-tree', '-r', '--name-only', antes]);
const atuais = [...new Set(nomes(['ls-files', '--cached', '--others', '--exclude-standard']))];
const contagens = pastas.map(pasta => ({ pasta, antes: antigos.filter(p => p.startsWith(pasta + '/')).length, depois: atuais.filter(p => p.startsWith(pasta + '/') && fs.existsSync(path.join(raiz, p))).length }));
const arquivos = atuais.filter(p => pastas.some(d => p.startsWith(d + '/')) && fs.existsSync(path.join(raiz, p))).map(arquivo => ({ arquivo, bytes: fs.statSync(path.join(raiz, arquivo)).size }));
const resultado = { schemaVersion: 1, checkpoint: antes, criterio: 'Arquivos versionados ou novos não ignorados; exclui node_modules, dist, release, site/public, tmp e dados locais.', contagens, arquivos };
const saida = path.join(raiz, 'tmp/evidencias/refatoracao/inventario.json');
fs.mkdirSync(path.dirname(saida), { recursive: true }); fs.writeFileSync(saida, JSON.stringify(resultado, null, 2));
console.log(JSON.stringify({ checkpoint: antes, contagens, saida }, null, 2));
