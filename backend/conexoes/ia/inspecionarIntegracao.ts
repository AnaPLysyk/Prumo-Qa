/** Lê a configuração do Codex ou do Claude (sem segredos) e diz se o Prumo está configurado para este projeto. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { conferirServidores } from './conferirServidores.js';
import { mesmoCaminho } from './mesmoCaminho.js';
import { prepararConexao } from './prepararConexao.js';
import { Cliente, claudeConfigSchema } from '../tipos/integracaoIa.js';

export function inspecionarIntegracao(p: Projeto, client: Cliente) {
  const plano = prepararConexao(p, client);
  try {
    let servidores: unknown;
    if (client === 'codex') {
      if (!plano.executable || plano.manualOnly) return { found: false, matches: 0, code: 'CLIENT_INSPECTION_UNAVAILABLE' };
      const r = spawnSync(plano.executable, ['mcp', 'list', '--json'], { cwd:p.raiz, shell: false, windowsHide: true, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 });
      if (r.error || r.status !== 0) throw new Error('inspection');
      servidores = JSON.parse(r.stdout);
    } else {
      semLinks(plano.destination);
      let c=claudeConfigSchema.parse({});
      if(fs.existsSync(plano.destination)){
        const st = fs.lstatSync(plano.destination);
        if (!st.isFile() || st.nlink !== 1 || st.size > 1024 * 1024) throw new Error('inspection');
        c = claudeConfigSchema.parse(JSON.parse(fs.readFileSync(plano.destination, 'utf8')));
      }
      const projetoConfig=Object.keys(c.projects??{}).find(k=>mesmoCaminho(k,p.raiz));
      const local=projetoConfig?c.projects[projetoConfig]!:{mcpServers:{},disabledMcpjsonServers:[] as string[]};
      // Claude Code: configurações de usuário e do projeto selecionado; não lê projetos vizinhos.
      servidores = [...Object.values(c.mcpServers ?? {}), ...Object.values(local.mcpServers ?? {})];
      const projetoArquivo=path.join(p.raiz,'.mcp.json');semLinks(projetoArquivo);
      if(fs.existsSync(projetoArquivo)){
        const st=fs.lstatSync(projetoArquivo);if(!st.isFile()||st.nlink!==1||st.size>1024*1024)throw new Error('inspection');
        const config=JSON.parse(fs.readFileSync(projetoArquivo,'utf8'));
        servidores=[...servidores as unknown[],...Object.entries(config.mcpServers??{}).map(([nome,v])=>({...v as object,enabled:!local.disabledMcpjsonServers?.includes(nome)}))];
      }
    }
    const r = conferirServidores(plano, servidores);
    return { ...r, code: r.found ? 'CONFIGURATION_MATCH' : 'NOT_CONFIGURED' };
  } catch { return { found: false, matches: 0, code: 'CONNECTION_INSPECTION_FAILED' }; }
}
