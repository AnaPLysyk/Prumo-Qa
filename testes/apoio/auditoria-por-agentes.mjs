/** Executa inspeção e revisão independentes pelos agentes do núcleo Prumo QA. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { agentesChat } from '../../dist/agentes/tipos/persona.js';
import { orquestrar } from '../../dist/agentes/chat/orquestrar.js';
import { verificarDependencias } from './dependencias.mjs';

const raizPadrao = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pastasDeCodigo = /^(backend|frontend|ferramentas|testes|site|docs)\//;
const extensoes = /\.(?:ts|tsx|js|mjs|cjs|css|json|html|md)$/i;

function fontesExistentes(raiz, nomes) {
  return [...new Set(nomes)].filter(Boolean).map(nome => nome.replaceAll('\\', '/'))
    .filter(nome => pastasDeCodigo.test(nome) && extensoes.test(nome))
    .filter(nome => {
      const alvo = path.resolve(raiz, nome);
      return alvo.startsWith(raiz + path.sep) && fs.existsSync(alvo) && fs.lstatSync(alvo).isFile();
    }).sort();
}

function git(raiz, ...argumentos) {
  return execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', windowsHide: true, maxBuffer: 2_000_000 });
}

export function arquivosAlterados(raiz = raizPadrao) {
  const nomes = [
    ...git(raiz, 'diff', '--name-only', '--diff-filter=ACMRT', '-z').split('\0'),
    ...git(raiz, 'diff', '--cached', '--name-only', '--diff-filter=ACMRT', '-z').split('\0'),
    ...git(raiz, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
  ];
  return fontesExistentes(raiz, nomes);
}

export function arquivosDoRepositorio(raiz = raizPadrao) {
  return fontesExistentes(raiz, [
    ...git(raiz, 'ls-files', '--cached', '-z').split('\0'),
    ...git(raiz, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
  ]);
}

export function conferirScripts(raiz = raizPadrao) {
  const html = fs.readFileSync(path.join(raiz, 'frontend/compartilhado/runtime/index.html'), 'utf8');
  const fontes = [...html.matchAll(/<script\s+src="telas\/([^"]+)"/g)].map(m => m[1]);
  return fontes.filter(fonte => !fs.existsSync(path.join(raiz, 'frontend', fonte))).sort();
}

export function localizarArquivosLongos(raiz, arquivos, limite = 350) {
  return arquivos.filter(arquivo => /\.(?:ts|tsx|js|mjs|cjs)$/i.test(arquivo))
    .filter(arquivo => fs.statSync(path.join(raiz, arquivo)).size <= 500_000)
    .map(arquivo => ({ arquivo, linhas: fs.readFileSync(path.join(raiz, arquivo), 'utf8').split(/\r?\n/).length }))
    .filter(item => item.linhas > limite)
    .sort((a, b) => b.linhas - a.linhas);
}

/** Cada especialista consulta o código diretamente, sem validar o resultado do outro. */
export async function auditarPorAgentes(raiz = raizPadrao, { executarGit = git, dependencias = verificarDependencias, arquivos, area } = {}) {
  const alterados = arquivos ?? arquivosAlterados(raiz);
  const resultados = [];
  const assinaturas = new Map();
  const especialistas = ['investigacao-bugs', 'regressao'].map(id => agentesChat.find(a => a.id === id));
  if (especialistas.some(a => !a)) throw Error('Agente do Prumo indisponível');

  const responder = async agente => {
    let observacoes;
    let pendencias = [];
    if (agente.id === 'investigacao-bugs') {
      for (const arquivo of alterados) {
        const conteudo = fs.readFileSync(path.join(raiz, arquivo));
        assinaturas.set(arquivo, createHash('sha256').update(conteudo).digest('hex'));
      }
      const extensos = localizarArquivosLongos(raiz, alterados);
      pendencias = extensos.map(x => x.arquivo + ': ' + x.linhas + ' linhas; avaliar divisão por responsabilidade');
      observacoes = [
        'Li ' + assinaturas.size + ' arquivos de código e documentação e calculei suas assinaturas.',
        'Encontrei ' + extensos.length + ' arquivo(s) alterado(s) acima de 350 linhas; tamanho é indício, não prova de redundância.'
      ];
    } else {
      for (const arquivo of alterados) {
        const atual = createHash('sha256').update(fs.readFileSync(path.join(raiz, arquivo))).digest('hex');
        if (assinaturas.get(arquivo) !== atual) pendencias.push('arquivo modificado entre inspeção e revisão: ' + arquivo);
      }
      let diffOk = false;
      try { executarGit(raiz, 'diff', '--check'); diffOk = true; } catch { pendencias.push('git diff --check falhou'); }
      const imports = dependencias(raiz).problemas.filter(x => !area || x.arquivo.startsWith(area + '/'));
      const scriptsAusentes = conferirScripts(raiz).filter(x => !area || ('frontend/' + x).startsWith(area + '/'));
      pendencias.push(...imports.map(x => x.arquivo + ':' + x.linha + ': import ausente'));
      pendencias.push(...scriptsAusentes.map(x => 'script de tela ausente: ' + x));
      observacoes = [
        'Revisei o diff independentemente: ' + (diffOk ? 'formatação OK' : 'formatação com falha') + '.',
        'Imports ausentes: ' + imports.length + '; scripts de tela ausentes: ' + scriptsAusentes.length + '.',
        'Esta revisão não substitui os testes unitários nem a homologação do Electron.'
      ];
    }
    resultados.push({ agente: agente.id, status: pendencias.length ? 'PENDENCIAS' : 'SEM_BLOQUEIOS_NESTA_VERIFICACAO', observacoes, pendencias });
    return { linhas: [...observacoes, ...pendencias.slice(0, 2)], fatos: ['pendencias=' + pendencias.length], fontes: [], vazio: false };
  };

  const { registro } = await orquestrar(especialistas, [], 'Inspecionar alterações locais e revisar a integridade', null, undefined, responder);
  return { versao: 1, geradoEm: new Date().toISOString(), area: area ?? null, alterados: alterados.length,
    orquestrador: registro.responsavel, registro: { id: registro.id, estado: registro.estado, etapas: registro.etapas },
    agentes: resultados, testes: 'NAO_EXECUTADOS_POR_ESTA_AUDITORIA' };
}

/** Agrupa fontes por área de manutenção, sem confundir saídas geradas com código-fonte. */
export async function auditarTodasAsPastas(raiz = raizPadrao) {
  const fontes = arquivosDoRepositorio(raiz);
  const porArea = new Map();
  for (const arquivo of fontes) {
    const partes = arquivo.split('/');
    const area = partes.slice(0, 2).join('/');
    if (!porArea.has(area)) porArea.set(area, []);
    porArea.get(area).push(arquivo);
  }
  const grafo = verificarDependencias(raiz);
  const pastas = [];
  for (const [area, arquivos] of [...porArea].sort(([a], [b]) => a.localeCompare(b))) {
    const execucao = await auditarPorAgentes(raiz, { arquivos, area, dependencias: () => grafo });
    pastas.push({ area, arquivos: arquivos.length, orquestrador: execucao.orquestrador,
      etapas: execucao.registro.etapas.map(etapa => ({ agente: etapa.agente, estado: etapa.estado })),
      agentes: execucao.agentes });
  }
  return { versao: 1, geradoEm: new Date().toISOString(), totalArquivos: fontes.length,
    totalPastas: pastas.length, testes: 'NAO_EXECUTADOS_POR_ESTA_AUDITORIA', pastas };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const todos = process.argv.includes('--todas-as-pastas');
    if (process.argv.slice(2).some(arg => arg !== '--todas-as-pastas')) throw Error('Use --todas-as-pastas ou nenhum argumento.');
    const relatorio = todos ? await auditarTodasAsPastas() : await auditarPorAgentes();
    const pasta = path.join(raizPadrao, '.prumo', 'auditorias');
    fs.mkdirSync(pasta, { recursive: true });
    const destino = path.join(pasta, todos ? 'revisao-todas-as-pastas.json' : 'revisao-por-agentes.json');
    fs.writeFileSync(destino, JSON.stringify(relatorio, null, 2) + '\n');
    if (todos) {
      const pendencias = relatorio.pastas.flatMap(x => x.agentes.flatMap(a => a.pendencias));
      console.log(JSON.stringify({ arquivo: destino, areas: relatorio.totalPastas, arquivos: relatorio.totalArquivos,
        etapas: relatorio.pastas.reduce((n, x) => n + x.etapas.length, 0), candidatos: pendencias.length,
        porArea: relatorio.pastas.filter(x => x.agentes.some(a => a.pendencias.length))
          .map(x => ({ area: x.area, pendencias: x.agentes.reduce((n, a) => n + a.pendencias.length, 0) })) }, null, 2));
      if (pendencias.some(p => p.includes('ausente') || p.includes('falhou'))) process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ arquivo: destino, orquestrador: relatorio.orquestrador,
        agentes: relatorio.agentes.map(a => ({ nome: a.agente, status: a.status, pendencias: a.pendencias.length })),
        arquivos: relatorio.alterados }, null, 2));
      if (relatorio.agentes.some(a => a.pendencias.some(p => p.includes('ausente') || p.includes('falhou')))) process.exitCode = 1;
    }
  } catch (erro) {
    console.error('Auditoria interrompida: ' + (erro?.message ?? String(erro)));
    process.exitCode = 1;
  }
}
