/** Descobre como chamar o node ou o npm instalado junto do Node, sem passar pelo shell. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Comando } from '../../compartilhado/tipos/projeto.js';

export async function resolverExecutavel(c:Comando) {
  if(c.executable==='node') return { executable:process.execPath,args:c.args };
  const candidatos=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const f of candidatos) { try { await fs.access(f); return { executable:process.execPath,args:[await fs.realpath(f),...c.args] }; } catch {} }
  throw new ErroQa('RUNTIME_MISSING','npm-cli.js não encontrado junto ao Node. Use comando node ou instale Node com npm.');
}
