/** Abre a pasta de um projeto, lê e valida o qa.project.json e devolve o contrato com sua impressão digital. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ErroQa } from '../erros.js';
import { normalizarComando } from './normalizarComando.js';
import { validarComando } from './validarComando.js';
import { caminhoSeguro } from '../seguranca/caminhoSeguro.js';
import { hash } from '../seguranca/hash.js';
import { lerSeguro } from '../seguranca/lerSeguro.js';
import { validarRelativo } from '../seguranca/validarRelativo.js';
import { Manifesto, Projeto, manifestoSchema } from './contratos.js';

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
