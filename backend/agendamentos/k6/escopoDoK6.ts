/** Calcula o escopo exato (hash do script, destino, limites e executável) que a autorização do k6 cobre. */
import { promises as fs } from 'node:fs';
import { validarAlvoDoK6 } from './validarAlvoDoK6.js';
import { validarLimitesDoK6 } from './validarLimitesDoK6.js';
import { ConfigK6, ExecutavelK6 } from '../tipos/k6.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

/** Escopo estável: raiz, manifesto, script (hash), parâmetros, destino, ambiente e executável (caminho+tamanho). */
export async function escopoDoK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6) {
  validarLimitesDoK6(c); const origem = validarAlvoDoK6(c.alvo, ambiente);
  if (p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED', 'Projeto autorizado estritamente para leitura.');
  if (!/\.m?js$/i.test(c.script)) throw new ErroQa('K6_SCRIPT_INVALID', 'O script do k6 deve ser .js ou .mjs.');
  const fonte = await lerSeguro(p.raiz, c.script, false, 262144);
  const st = await fs.stat(exe.executable);
  const scopeHash = hash(JSON.stringify({ root: p.raiz, manifest: p.manifestoHash, script: c.script, scriptSha: hash(fonte), alvo: origem, usuarios: c.usuarios, duracao: c.duracaoSegundos, ambiente, exe: { p: exe.executable, size: st.size } }));
  return { scopeHash, command: JSON.stringify({ tool: 'k6', script: c.script, alvo: origem, usuarios: c.usuarios, duracaoSegundos: c.duracaoSegundos, ambiente }) };
}
