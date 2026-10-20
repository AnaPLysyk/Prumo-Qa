/** Olha a pasta, descobre a tecnologia (npm, Python, Go...) e monta um qa.project.json proposto, sem gravar nada. */
import fs from 'node:fs';
import path from 'node:path';
import { Manifesto, manifestoSchema } from '../../compartilhado/tipos/projeto.js';
import { listarRaizDoProjeto } from './listarRaizDoProjeto.js';
import { CODIGO, DOCUMENTACAO, EXIGE_REVISAO, PropostaContrato, SCRIPT, STACKS, Stack, TESTES } from '../tipos/contrato.js';

/** Gera um identificador simples (letras, números e hífen) a partir do nome da pasta. */

const idDoProjetoPeloNome = (nome: string): string => {
  const identificador = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 76);
  return /^[a-z]/.test(identificador) ? identificador : 'p-' + (identificador || 'projeto');
};

export function proporContrato(raizInformada: string): PropostaContrato {
  const raiz = fs.realpathSync(raizInformada);
  if (fs.existsSync(path.join(raiz, 'qa.project.json'))) throw new Error('CONTRACT_EXISTS: a pasta já tem qa.project.json; o Prumo não sobrescreve o contrato.');
  const itens = listarRaizDoProjeto(raiz).sort((a, b) => a.nome.localeCompare(b.nome));
  const stacks: Stack[] = STACKS.map((s) => ({ s, ev: itens.filter((i) => !i.pasta && s.arquivos.test(i.nome)).map((i) => i.nome) })).filter((x) => x.ev.length)
    .map(({ s, ev }) => ({ id: s.id, nome: s.nome, evidencias: ev.slice(0, 5), comandoNativo: s.comando, executavelPeloPrumo: s.executavel }));
  const pastaOuArquivo = (re: RegExp) => itens.filter((i) => re.test(i.nome)).map((i) => i.nome).slice(0, 50);
  const documentation = pastaOuArquivo(DOCUMENTACAO);
  const tests = itens.filter((i) => i.pasta && TESTES.test(i.nome)).map((i) => i.nome);
  // Maven/Gradle guardam testes em src/test: entra como testes quando existe de fato.
  if (fs.existsSync(path.join(raiz, 'src', 'test')) && !fs.lstatSync(path.join(raiz, 'src', 'test')).isSymbolicLink() && fs.statSync(path.join(raiz, 'src', 'test')).isDirectory()) tests.push('src/test');
  const code = [...itens.filter((i) => i.pasta && CODIGO.test(i.nome)).map((i) => i.nome), ...stacks.flatMap((s) => s.evidencias)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 50);
  const observacoes: string[] = [];
  let nome = path.basename(raiz); const commands: Manifesto['commands'] = {}; const bloqueados: string[] = [];
  if (stacks.some((s) => s.id === 'node')) {
    let pkg: { name?: unknown; scripts?: Record<string, unknown> } = {};
    try { const st = fs.statSync(path.join(raiz, 'package.json')); if (st.size <= 262144) pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')); } catch { observacoes.push('package.json ilegível: nenhum comando proposto.'); }
    if (typeof pkg.name === 'string' && pkg.name.trim()) nome = pkg.name.trim().slice(0, 200);
    for (const [script, valor] of Object.entries(pkg.scripts ?? {})) {
      if (typeof valor !== 'string' || !SCRIPT.test(script) || !/^[\w:-]+$/.test(script) || Object.keys(commands).length >= 10) continue;
      const cap = idDoProjetoPeloNome(script); if (commands[cap]) continue;
      commands[cap] = { executable: 'npm', args: ['run', script], cwd: '.', env: {}, requiredFiles: [], requiredEnv: [] };
      if (EXIGE_REVISAO.test(script)) bloqueados.push(cap);
    }
    if (!Object.keys(commands).length) observacoes.push('Nenhum script de teste, build ou lint no package.json: o contrato fica somente leitura.');
    if (bloqueados.length) observacoes.push(`Bloqueados até revisão (podem tocar banco, servidor ou publicar): ${bloqueados.join(', ')}.`);
  }
  for (const s of stacks.filter((x) => !x.executavelPeloPrumo)) observacoes.push(`${s.nome}: o Prumo lê o código e os testes; executar "${s.comandoNativo}" pelo Prumo ainda não é suportado (planejado para a 2.11).`);
  if (!stacks.length) observacoes.push('Nenhuma stack conhecida na raiz: o contrato fica somente leitura, com as pastas encontradas.');
  if (!tests.length) observacoes.push('Nenhuma pasta de testes encontrada na raiz.');
  const somenteLeitura = !Object.keys(commands).length;
  const manifesto = manifestoSchema.parse({
    schemaVersion: 2, id: idDoProjetoPeloNome(nome.replace(/^@[^/]+\//, '')), name: nome,
    context: { documentation, tests: tests.slice(0, 50), code },
    commands,
    execution: { requireApproval: true, blockedByDefault: bloqueados, environment: 'host', readOnly: somenteLeitura, envAllowlist: [], timeoutMs: 300000, maxOutputBytes: 1048576 }
  });
  return { raiz, manifesto, stacks, observacoes };
}
