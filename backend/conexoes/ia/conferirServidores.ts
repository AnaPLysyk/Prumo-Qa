/** Conta quantos servidores MCP configurados no cliente apontam para este Prumo e este projeto. */
import { comandoEhNodeDoPrumo } from './comandoEhNodeDoPrumo.js';
import { mesmoCaminho } from './mesmoCaminho.js';
import { Plano } from '../tipos/integracaoIa.js';

/** Projeta somente metadados conhecidos. Nunca devolve env, tokens ou conteúdo da configuração do cliente. */
export function conferirServidores(plano: Plano, servidores: unknown) {
  if (!Array.isArray(servidores) || servidores.length > 200) throw new Error('CONNECTION_INSPECTION_FAILED');
  const compatíveis = servidores.filter(s => {
    if (!s || typeof s !== 'object' || (s.enabled!==undefined&&s.enabled!==true)) return false;
    const c = s.transport ?? s;
    const env = c.env ?? s.env ?? {};
    const nativo=comandoEhNodeDoPrumo(c.command);
    return (c.type===undefined||c.type==='stdio')&&!c.url&&(mesmoCaminho(c.command, plano.configuration.command)||nativo) &&
      Array.isArray(c.args) && c.args.length === plano.configuration.args.length &&
      c.args.every((v: unknown, i: number) => mesmoCaminho(v, plano.configuration.args[i]!)) &&
      env && typeof env === 'object' && !Array.isArray(env) &&
      Object.keys(env).every(k => ['PRUMO_DATA_DIR', 'ELECTRON_RUN_AS_NODE'].includes(k)) &&
      env.PRUMO_DATA_DIR===plano.configuration.env.PRUMO_DATA_DIR &&
      (nativo ? env.ELECTRON_RUN_AS_NODE===undefined||env.ELECTRON_RUN_AS_NODE==='1' : env.ELECTRON_RUN_AS_NODE===plano.configuration.env.ELECTRON_RUN_AS_NODE);
  });
  return { found: compatíveis.length > 0, matches: compatíveis.length };
}
