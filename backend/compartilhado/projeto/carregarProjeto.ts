/** Carregamento e inventário do projeto — arquivos relacionados agrupados para manutenção. */
import { ErroQa } from "../erros.js";
import { Comando, comandoObjeto, Manifesto, Projeto, manifestoSchema } from "./contratos.js";
import { validarRelativo } from "../seguranca/caminhoSeguro.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { caminhoSeguro } from "../seguranca/caminhoSeguro.js";
import { hash } from "../seguranca/hash.js";
import { lerSeguro } from "../seguranca/lerSeguro.js";
import { sensivel } from "../seguranca/sensivel.js";

// ── carregarProjeto ──
// ── normalizarComando ──
export function normalizarComando(valor: string | Comando): Comando {
  if (typeof valor !== 'string') return valor;
  // Compatibilidade explícita do rascunho v2: gramática pequena, nenhuma avaliação de shell.
  if (/[;&|<>`$%\r\n]/.test(valor)) throw new ErroQa('COMMAND_FORBIDDEN', 'Operadores de shell não são permitidos.');
  const partes = valor.match(/"[^"]*"|'[^']*'|[^\s"']+/g) ?? [];
  if (partes.join(' ') !== valor.trim().replace(/\s+/g, ' ')) throw new ErroQa('COMMAND_FORBIDDEN', 'Aspas inválidas.');
  const [executavel, ...args] = partes.map(v => v.replace(/^("|')(.*)\1$/, '$2'));
  return comandoObjeto.parse({ executable: executavel, args });
}

// ── validarComando ──
export function validarComando(c: Comando, m: Manifesto) {
  validarRelativo(c.cwd);
  if (c.executable === 'npm' && !(c.args.length === 2 && c.args[0] === 'run' && /^[\w:-]+$/.test(c.args[1]!)))
    throw new ErroQa('COMMAND_FORBIDDEN', 'npm permite apenas run <script> sem parâmetros externos.');
  if (c.executable === 'node') {
    const args = c.args[0] === '--test' ? c.args.slice(1) : c.args;
    if (!args.length || args.some(v => v.startsWith('-') || !/\.(?:[cm]?js|test\.[cm]?js)$/.test(v)))
      throw new ErroQa('COMMAND_FORBIDDEN', 'node permite arquivos JavaScript locais; eval, loaders e flags arbitrárias são proibidos.');
    args.forEach(validarRelativo);
  }
  for (const n of [...Object.keys(c.env), ...c.requiredEnv, ...m.execution.envAllowlist]) {
    if (/secret|token|password|passwd|credential|private|node_options|node_test_context|path|home|appdata|comspec|npm_config/i.test(n))
      throw new ErroQa('ENV_FORBIDDEN', 'Variável sensível ou capaz de alterar o runtime.');
  }
  if (Object.keys(c.env).some(n => !m.execution.envAllowlist.includes(n)) || c.requiredEnv.some(n => !m.execution.envAllowlist.includes(n)))
    throw new ErroQa('ENV_FORBIDDEN', 'Variável fora da allowlist.');
}

// ── carregarProjeto ──
export async function carregarProjeto(raizInformada: string, contratoLeitura?: string): Promise<Projeto> {
  if (!path.isAbsolute(raizInformada)) throw new ErroQa('ROOT_REQUIRED', 'Informe uma raiz absoluta autorizada.');
  const raiz = await fs.realpath(raizInformada);
  let texto: string;
  if (contratoLeitura) {
    if (!path.isAbsolute(contratoLeitura) || (await fs.lstat(contratoLeitura)).isSymbolicLink() || (await fs.stat(contratoLeitura)).size > 262144) throw new ErroQa('INVALID_MANIFEST','Contrato externo inválido.');
    texto = await fs.readFile(contratoLeitura,'utf8');
  } else texto = await lerSeguro(raiz, 'qa.project.json');
  let manifesto: Manifesto;
  try { manifesto = manifestoSchema.parse(JSON.parse(texto)); } catch { throw new ErroQa('INVALID_MANIFEST', 'Contrato inválido. Exige schemaVersion 2, context, commands e execution.requireApproval=true.'); }
  if (contratoLeitura && (!manifesto.execution.readOnly || Object.keys(manifesto.commands).length)) throw new ErroQa('READONLY_CONTRACT','Contrato externo aceita somente leitura e commands vazio.');
  for (const p of Object.values(manifesto.context).flat()) await caminhoSeguro(raiz, p);
  for (const [cap, bruto] of Object.entries(manifesto.commands)) {
    const c = normalizarComando(bruto); validarComando(c, manifesto);
    const cwd = await caminhoSeguro(raiz, c.cwd);
    if (!(await fs.stat(cwd)).isDirectory()) throw new ErroQa('INVALID_CWD', `Diretório inválido: ${cap}`);
    if (c.executable === 'node') for (const arg of c.args.filter(v => v !== '--test')) await caminhoSeguro(raiz, path.join(c.cwd, arg));
    else {
      const pkg = JSON.parse(await lerSeguro(raiz, path.join(c.cwd, 'package.json')));
      if (typeof pkg.scripts?.[c.args[1]!] !== 'string') throw new ErroQa('COMMAND_FORBIDDEN', 'Script npm inexistente.');
    }
    c.requiredFiles.forEach(validarRelativo); // Ausência de pré-condição bloqueia execução, não leitura do projeto.
  }
  if (manifesto.execution.blockedByDefault.some(c => !Object.hasOwn(manifesto.commands, c))) throw new ErroQa('INVALID_MANIFEST', 'Bloqueio referencia capability inexistente.');
  return { raiz, manifesto, manifestoHash: hash(texto) };
}

// ── inventariar ──
export async function inventariar(p: Projeto) {
  const arquivos = new Map<string, { path: string; category: string; sha256: string; content: string }>();
  const omitidos: string[] = []; let bytes = 0; let visitados = 0;
  async function visitar(rel: string, category: string, profundidade = 0) {
    if (++visitados > 2000 || profundidade > 20) throw new ErroQa('CONTEXT_LIMIT', 'Inventário excede limite; restrinja os caminhos do contrato.');
    if (sensivel(rel)) { omitidos.push(rel); return; }
    const alvo = await caminhoSeguro(p.raiz, rel);
    const st = await fs.stat(alvo);
    if (st.isDirectory()) {
      for (const nome of (await fs.readdir(alvo)).sort()) await visitar(path.join(rel, nome), category, profundidade + 1);
    } else if (st.isFile()) {
      if (arquivos.has(rel)) return;
      if (!/\.(?:md|txt|json|[cm]?js|tsx?|html|css|yml|yaml|feature|rb|py|java|cs|go|sql)$/i.test(rel)) { omitidos.push(rel); return; }
      if (st.size > 262144) { omitidos.push(rel); return; }
      const content = await lerSeguro(p.raiz, rel); bytes += Buffer.byteLength(content);
      if (bytes > 8388608) throw new ErroQa('CONTEXT_LIMIT', 'Contexto excede 8 MiB. Restrinja o manifesto.');
      arquivos.set(rel, { path: rel, category, sha256: hash(content), content });
    }
  }
  for (const [cat, caminhos] of Object.entries(p.manifesto.context)) for (const rel of caminhos) await visitar(rel, cat);
  return { fontes: [...arquivos.values()], omitidos };
}
