// Gera a Documentação Viva: o mapa do código em duas revisões, Atual (a main publicada no GitHub) e Proposta (esta
// cópia de trabalho, inclusive alterações ainda não commitadas). Para cada arquivo: descrição da primeira linha,
// funções, quem ele importa, quem o importa, hash e código. Também monta os fluxos do usuário (tela -> canal -> backend).
// Uso: npm run arquitetura [-- --atual origin/main] [-- --saida tmp/arquitetura]
// Lê só fontes do próprio Prumo (frontend, backend, app, scripts, testes). Nada de projetos vinculados nem dados do usuário.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { telas, papeis } from '../documentacao/gerar-leia-me-backend.mjs';

const raizRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pastasLidas = /^(frontend|backend|src|app|scripts|ferramentas|site|skills|testes)\//;
const extensoes = /\.(ts|mjs|cjs|js|html|css|json|md)$/;
// dist/renderer/ e dist/documentacao/ são gerados no build: a fonte da interface é frontend/.
// Bibliotecas de terceiros (vendor/) não são código do Prumo: ficam fora do mapa e da Documentação viva.
const ignorar = /^(dist\/|docs\/ajuda\/|site\/public\/|.*\.min\.js$|(?:.*\/)?(?:vendor|node_modules)\/)/;
const git = (...args) => execFileSync('git', args, { cwd: raizRepo, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/** Primeira linha de explicação: /** ... *\/ (depois de shebang ou 'use strict') ou o título de um Markdown. */
export function descricaoDoArquivo(texto, caminho) {
  if (caminho.endsWith('.md')) return /^#\s+(.+)$/m.exec(texto)?.[1]?.trim() ?? null;
  const linhas = texto.split(/\r?\n/).slice(0, 4).filter(l => !l.startsWith('#!') && !/^'use strict';?$/.test(l.trim()));
  const l = linhas[0]?.trim() ?? '';
  const m = /^\/\*\*?\s*(.+?)\s*\*\/$/.exec(l) ??/^\/\/\s*(.{12,})$/.exec(l) ?? /^<!--\s*(.+?)\s*-->$/.exec(l);
  return m ? m[1] : null;
}

/** Funções, classes e ferramentas declaradas no arquivo, com a linha de cada uma. */
export function funcoesDoArquivo(texto) {
  const r = [];
  texto.split(/\r?\n/).forEach((l, i) => {
    const m = /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(l)
      ?? /^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(l)
      ?? /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]{1,120})?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]{1,80})?=>/.exec(l)
      ?? /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*:\s*TratadorDoCanal</.exec(l);
    if (m) r.push({ nome: m[1], linha: i + 1 });
  });
  return r;
}

/** Imports relativos resolvidos para caminhos do mesmo conjunto de arquivos (.js aponta para .ts quando o fonte é TypeScript). */
function importsDoArquivo(texto, caminho, existe) {
  const alvos = new Set();
  for (const m of texto.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const bruto = path.posix.normalize(path.posix.join(path.posix.dirname(caminho), m[1]));
    for (const c of [bruto, bruto.replace(/\.js$/, '.ts'), bruto + '.ts', bruto + '/index.ts']) if (existe(c)) { alvos.add(c); break; }
  }
  for (const m of texto.matchAll(/<script\s+src="([^"]+)"/g)) { const c = path.posix.normalize(path.posix.join(path.posix.dirname(caminho), m[1])); if (existe(c)) alvos.add(c); }
  return [...alvos].sort();
}

function lerRevisao(ref) {
  const nomes = git('ls-tree', '-r', '--name-only', ref).split('\n').filter(n => pastasLidas.test(n) && extensoes.test(n) && !ignorar.test(n));
  // cat-file --batch: um único processo para ler todos os arquivos da revisão.
  const entrada = nomes.map(n => `${ref}:${n}`).join('\n') + '\n';
  const saida = spawnSync('git', ['cat-file', '--batch'], { cwd: raizRepo, input: entrada, maxBuffer: 512 * 1024 * 1024 }).stdout;
  const arquivos = new Map(); let pos = 0;
  for (const nome of nomes) {
    const fimCab = saida.indexOf(10, pos); const cab = saida.subarray(pos, fimCab).toString().split(' ');
    const tam = Number(cab[2]); arquivos.set(nome, saida.subarray(fimCab + 1, fimCab + 1 + tam).toString('utf8')); pos = fimCab + 1 + tam + 1;
  }
  return arquivos;
}

export function lerCopiaDeTrabalho() {
  const arquivos = new Map();
  for (const raiz of ['frontend', 'backend', 'src', 'scripts', 'ferramentas', 'site', 'testes']) {
    const dir = path.join(raizRepo, raiz); if (!fs.existsSync(dir)) continue;
    for (const rel of fs.readdirSync(dir, { recursive: true }).map(String)) {
      const nome = (raiz + '/' + rel).split(path.sep).join('/');
      if (!extensoes.test(nome) || ignorar.test(nome) || !fs.statSync(path.join(raizRepo, nome)).isFile()) continue;
      arquivos.set(nome, fs.readFileSync(path.join(raizRepo, nome), 'utf8'));
    }
  }
  return arquivos;
}

/** Fluxos do usuário: botão da tela -> função da ponte (preload) -> canal IPC -> arquivo api/ -> funções que ele chama. */
function fluxosDeUso(arquivos) {
  const preload = arquivos.get('backend/aplicativo/preload.cjs') ?? '';
  const ponte = new Map();
  for (const m of preload.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*\([^)]*\)\s*=>\s*chamar\('([a-z]+:[a-z]+)'/g)) ponte.set(m[2], m[1]);
  const telasQueChamam = (fn) => [...arquivos].filter(([n, t]) => (n.startsWith('frontend/') || (n.startsWith('dist/renderer/') && !n.startsWith('dist/renderer/telas/'))) && n.endsWith('.js') && new RegExp(`\\b(?:api|prumo)\\.${fn}\\(`).test(t)).map(([n]) => n);
  const fluxos = [];
  const mapa = arquivos.get('backend/aplicativo/api/arquivosDosCanais.ts');
  if (mapa) {
    for (const m of mapa.matchAll(/'([a-z]+:[a-z]+)': '([^' >]+)(?: > ([^']+))?'/g)) {
      const fn = ponte.get(m[1]) ?? null;
      fluxos.push({ canal: m[1], ponte: fn, telas: fn ? telasQueChamam(fn) : [], api: m[2], chama: m[3] ? m[3].split(', ') : [] });
    }
  } else {
    // Revisão antiga: todos os canais eram registrados em src/desktop/main.ts.
    const main = arquivos.get('src/desktop/main.ts') ?? '';
    for (const m of main.matchAll(/^canal\('([a-z]+:[a-z]+)'/gm)) { const fn = ponte.get(m[1]) ?? null; fluxos.push({ canal: m[1], ponte: fn, telas: fn ? telasQueChamam(fn) : [], api: 'src/desktop/main.ts', chama: [] }); }
  }
  return fluxos.sort((a, b) => a.canal.localeCompare(b.canal));
}

export function montarInstantaneo(arquivos) {
  const existe = (c) => arquivos.has(c);
  const recursos = JSON.parse(arquivos.get('frontend/recursos.json') ?? '{"recursos":[]}').recursos;
  const fontesRuntime = new Map(recursos.map(r => [r.destino, r.fonte]));
  const fonteOficial = caminho => fontesRuntime.get(caminho) ?? (caminho.startsWith('dist/renderer/telas/') && arquivos.has(caminho.replace('dist/renderer/telas/', 'frontend/')) ? caminho.replace('dist/renderer/telas/', 'frontend/') : null);
  const lista = [...arquivos].sort((a, b) => a[0].localeCompare(b[0])).map(([caminho, texto]) => ({
    caminho, fonteOficial: fonteOficial(caminho), descricao: fonteOficial(caminho) ? 'Cópia gerada da interface; para editar, abra ' + fonteOficial(caminho) : descricaoDoArquivo(texto, caminho), linhas: texto.split(/\r?\n/).length,
    sha256: createHash('sha256').update(texto).digest('hex'), funcoes: /\.(ts|mjs|cjs|js)$/.test(caminho) ? funcoesDoArquivo(texto) : [],
    importa: /\.(ts|mjs|cjs|js|html)$/.test(caminho) ? importsDoArquivo(texto, caminho, existe) : [], codigo: texto
  }));
  const usadoPor = new Map();
  for (const a of lista) for (const i of a.importa) { if (!usadoPor.has(i)) usadoPor.set(i, []); usadoPor.get(i).push(a.caminho); }
  for (const a of lista) a.usadoPor = usadoPor.get(a.caminho) ?? [];
  const pastas = {};
  for (const [tela, frase] of Object.entries(telas)) { pastas['backend/' + tela] = frase; pastas['frontend/' + tela] = frase; }
  for (const a of lista) { const m = /^backend\/[^/]+\/([^/]+)\/[^/]+$/.exec(a.caminho); if (m && papeis[m[1]]) pastas[path.posix.dirname(a.caminho)] = papeis[m[1]]; }
  Object.assign(pastas, { frontend: 'O que a pessoa vê: telas e funções da interface, a fonte oficial para o Electron.', backend: 'Tudo o que roda fora da tela: canais da janela, regras, dados deste computador e integrações.', src: 'Código do backend antes da organização por tela.', app: 'A janela: ponte segura (preload), telas, estilos e ajuda.', 'dist/renderer': 'Gerado no build a partir de frontend/; não editar.', scripts: 'Ferramentas de build, geração de documentos e release (até a 2.10.2; depois em ferramentas/).', ferramentas: 'Ferramentas por finalidade: arquitetura, documentação, frontend, empacotamento, release, migração, site, qa, skills e testes.', testes: 'Testes automáticos (unidade, integração, janela real e MCP).' });
  return { arquivos: lista, pastas, fluxos: fluxosDeUso(arquivos) };
}

export function gerarArquitetura({ atual = 'origin/main' } = {}) {
  const head = git('rev-parse', '--short', 'HEAD').trim(); const ramo = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
  const local = git('status', '--porcelain', '--', 'frontend', 'backend', 'src', 'scripts', 'ferramentas', 'site', 'testes').trim();
  const refAtual = git('rev-parse', '--short', atual).trim(); const dataAtual = git('log', '-1', '--format=%cI', atual).trim();
  return {
    geradoEm: new Date().toISOString(),
    revisoes: {
      atual: { nome: 'Atual', ref: atual, commit: refAtual, data: dataAtual, explicacao: 'O que está publicado na main do GitHub.' },
      proposta: { nome: 'Proposta', ref: ramo, commit: head, alteracoesLocais: local ? local.split('\n').length : 0, explicacao: 'Esta cópia de trabalho: a branch ' + ramo + (local ? ' com alterações ainda não commitadas.' : ', sem alterações pendentes.') }
    },
    instantaneos: { atual: montarInstantaneo(lerRevisao(atual)), proposta: montarInstantaneo(lerCopiaDeTrabalho()) }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (n, padrao) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : padrao; };
  const saida = path.resolve(raizRepo, arg('--saida', 'tmp/arquitetura'));
  const dados = gerarArquitetura({ atual: arg('--atual', 'origin/main') });
  fs.mkdirSync(saida, { recursive: true });
  fs.writeFileSync(path.join(saida, 'arquitetura.json'), JSON.stringify(dados));
  const modelo = fs.readFileSync(path.join(raizRepo, 'ferramentas', 'arquitetura', 'visualizador.html'), 'utf8');
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');
  const pagina = modelo.replace('/*__DADOS__*/null', () => json);
  // Versão para abrir no navegador (documento completo) e versão sem cabeçalho para publicar como página do Prumo.
  const documento = ['<!doctype html>', '<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>', pagina, '</body></html>', ''].join('\n');
  fs.writeFileSync(path.join(saida, 'documentacao-viva.html'), documento);
  fs.writeFileSync(path.join(saida, 'documentacao-viva.corpo.html'), pagina);
  const r = dados.revisoes; const q = dados.instantaneos;
  console.log(`Documentação viva gerada em ${path.relative(raizRepo, saida)}: Atual ${r.atual.commit} (${q.atual.arquivos.length} arquivos) · Proposta ${r.proposta.commit}${r.proposta.alteracoesLocais ? ' + ' + r.proposta.alteracoesLocais + ' alterações locais' : ''} (${q.proposta.arquivos.length} arquivos).`);
}
