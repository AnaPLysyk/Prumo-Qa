// Gera o mapa que a tela Administração › Documentação mostra: para cada tela, os arquivos da interface, os canais IPC,
// o backend (api, regras, banco, integrações, tipos) e os testes que a exercitam. Lido do código desta versão no build,
// sem o código-fonte (só caminhos, descrições, funções e ligações). Saída: dist/documentacao/mapa.json (não versionado);
// o código de cada arquivo listado vai para dist/documentacao/codigo.json, lido um arquivo por pedido (canal administracao:codigo).
// Uso: node docs/geradores/gerar-mapa-do-aplicativo.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lerCopiaDeTrabalho, montarInstantaneo } from './gerar-arquitetura.mjs';
import { telas as frasesDasTelas, papeis } from './catalogo-documentacao-viva.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const destino = path.join(raiz, 'dist', 'documentacao', 'mapa.json');
const PAPEIS = ['controlador', 'servico', 'repositorio', 'contratos', 'api', 'regras', 'banco', 'integracoes', 'tipos', 'servidor'];

export function gerarMapaDoAplicativo() {
  const arquivos = lerCopiaDeTrabalho();
  const { arquivos: lista, fluxos } = montarInstantaneo(arquivos);
  const resumo = (a) => ({ caminho: a.caminho, descricao: a.descricao, funcoes: a.funcoes.map((f) => f.nome), usadoPor: a.usadoPor.length });
  const pastasDe = (base) => fs.existsSync(path.join(raiz, base)) ? fs.readdirSync(path.join(raiz, base), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
  const ids = [...new Set([...pastasDe('frontend'), ...pastasDe('backend')])].sort();
  const testes = lista.filter((a) => /^testes\/.+\.test\.mjs$/.test(a.caminho));
  const telas = ids.map((id) => {
    const doBackend = lista.filter((a) => a.caminho.startsWith(`backend/${id}/`) && /\.(?:ts|mjs|js)$/.test(a.caminho));
    const backend = Object.fromEntries([...PAPEIS, 'outros'].map((p) => [p, []]));
    for (const a of doBackend) { const trecho = a.caminho.split('/')[2]; const papel = trecho.startsWith('controlador') && trecho.endsWith('.ts') ? 'controlador' : trecho; (PAPEIS.includes(papel) ? backend[papel] : backend.outros).push(resumo(a)); }
    const usaTela = (texto) => texto.includes(`dist/${id}/`) || texto.includes(`frontend/${id}/`) || texto.includes(`backend/${id}/`);
    return {
      id, descricao: frasesDasTelas[id] ?? null,
      frontend: lista.filter((a) => a.caminho.startsWith(`frontend/${id}/`) && /\.(js|css|html)$/.test(a.caminho)).map(resumo),
      canais: fluxos.filter((f) => f.api.startsWith(`backend/${id}/`)).map((f) => ({ canal: f.canal, ponte: f.ponte, api: f.api, chama: f.chama, telas: f.telas.filter((t) => t.startsWith('frontend/')) })),
      backend,
      testes: testes.filter((t) => usaTela(arquivos.get(t.caminho) ?? '')).map((t) => ({ caminho: t.caminho, descricao: t.descricao }))
    };
  }).filter((t) => t.frontend.length || Object.values(t.backend).some((l) => l.length));
  let commit = null; try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { commit = null; }
  return {
    schemaVersion: 1, geradoEm: new Date().toISOString(), versao: JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')).version, commit,
    papeis, telas,
    totais: { telas: telas.length, arquivosFrontend: telas.reduce((n, t) => n + t.frontend.length, 0), arquivosBackend: telas.reduce((n, t) => n + Object.values(t.backend).flat().length, 0), canais: fluxos.length, testes: testes.length }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mapa = gerarMapaDoAplicativo();
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(mapa));
  // O código fica num arquivo à parte (o mapa continua sem código): só os arquivos que o mapa lista, lidos um por pedido.
  const texto = lerCopiaDeTrabalho(); const caminhos = mapa.telas.flatMap((t) => [...t.frontend, ...Object.values(t.backend).flat(), ...t.testes].map((a) => a.caminho));
  fs.writeFileSync(path.join(path.dirname(destino), 'codigo.json'), JSON.stringify(Object.fromEntries([...new Set(caminhos)].filter((c) => texto.has(c)).map((c) => [c, texto.get(c)]))));
  const t = mapa.totais;
  console.log(`Mapa do aplicativo: ${t.telas} telas, ${t.arquivosFrontend} arquivos de interface, ${t.arquivosBackend} do backend, ${t.canais} canais e ${t.testes} testes (${Math.round(fs.statSync(destino).size / 1024)} KB).`);
}
