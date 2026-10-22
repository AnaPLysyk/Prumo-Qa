/** servicoIaDiagnostico: mantém reunidas as operações do mesmo fluxo. */
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { prepararConexao, Plano, Cliente, claudeConfigSchema, clientes, Registro, registroSchema, tools, lerConfiguracaoDoCliente } from "./ia/conectarIa.js";
import { projetoVinculado } from "../projetos/servicoProjetos.js";
import fs from "node:fs";
import path from "node:path";
import { semLinks } from "../compartilhado/seguranca/semLinks.js";
import { Projeto } from "../compartilhado/projeto/contratos.js";
import { consultarAtividades, pastaAtividades } from "../logs/regras/iniciarAtividade.js";
import { spawnSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { randomUUID } from "node:crypto";
import { carregarProjeto } from "../compartilhado/projeto/carregarProjeto.js";
import { hash } from "../compartilhado/seguranca/hash.js";

// servicoIaDiagnostico — responsabilidade integrada
// situacaoDasConexoesDeIa — responsabilidade deste trecho
/** Propõe a configuração; nada é alterado aqui. */
export async function situacaoDasConexoesDeIa(raiz: string) {
  const p = await projetoVinculado(raiz, diretorioDados());
  return clientes.map(c => { const x = prepararConexao(p, c); const d=diagnosticarIntegracao(p,c); return { ...d, name: x.name, installed: x.installed, destination: x.destination, command: x.command, configuration:x.configuration, notice:x.notice+' '+d.notice, automatic: x.installed && !x.manualOnly }; });
}

// servicoIaDiagnostico — responsabilidade deste trecho
function comandoEhNodeDoPrumo(command:unknown) {
  if(typeof command!=='string')return false;
  const exe=process.platform==='win32'?'node.exe':'node';
  const candidatos=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d)).map(d=>path.join(d,exe));
  if(path.basename(process.execPath).toLowerCase()===exe)candidatos.unshift(process.execPath);
  return candidatos.some(alvo=>{
    if(command!==exe&&command!=='node'&&!mesmoCaminho(command,alvo))return false;
    try{semLinks(alvo);return fs.lstatSync(alvo).isFile();}catch{return false;}
  });
}

/** Projeta somente metadados conhecidos. Nunca devolve env, tokens ou conteúdo da configuração do cliente. */
export function conferirServidores(plano: Plano, servidores: unknown) {
  if (!Array.isArray(servidores) || servidores.length > 200) throw new Error('CONNECTION_INSPECTION_FAILED');
  const compatíveis = servidores.filter(s => {
    if (!s || typeof s !== 'object' || (s.enabled!==undefined&&s.enabled!==true)) return false;
    const c = s.transport ?? s;
    const env = c.env ?? s.env ?? {};
    const nativo=comandoEhNodeDoPrumo(c.command);
    // O Copilot grava servidores locais como type "local".
    return (c.type===undefined||c.type==='stdio'||c.type==='local')&&!c.url&&(mesmoCaminho(c.command, plano.configuration.command)||nativo) &&
      Array.isArray(c.args) && c.args.length === plano.configuration.args.length &&
      c.args.every((v: unknown, i: number) => mesmoCaminho(v, plano.configuration.args[i]!)) &&
      env && typeof env === 'object' && !Array.isArray(env) &&
      Object.keys(env).every(k => ['PRUMO_DATA_DIR', 'ELECTRON_RUN_AS_NODE'].includes(k)) &&
      env.PRUMO_DATA_DIR===plano.configuration.env.PRUMO_DATA_DIR &&
      (nativo ? env.ELECTRON_RUN_AS_NODE===undefined||env.ELECTRON_RUN_AS_NODE==='1' : env.ELECTRON_RUN_AS_NODE===plano.configuration.env.ELECTRON_RUN_AS_NODE);
  });
  return { found: compatíveis.length > 0, matches: compatíveis.length };
}

export function diagnosticarIntegracao(p: Projeto, client: Cliente) {
  const plano = prepararConexao(p, client); const configuration = inspecionarIntegracao(p, client);
  const h = consultarAtividades(p); const protocolos = registrosIntegracao(p);
  const lastProtocol = protocolos.records.filter(r => r.client === client).at(-1) ?? null;
  const válida = lastProtocol?.manifestHash === p.manifestoHash && lastProtocol.configurationHash === assinaturaDaConfiguracao(plano);
  const chamadas = h.activities.filter(e => e.origin === 'MCP' && e.clientClassificationVersion===2 && e.client === client && e.phase === 'end' && e.state !== 'ERROR' && e.manifestHash === p.manifestoHash);
  const última = chamadas.at(-1);
  const lastObserved = última ? { id: última.operationId, at: última.at, tool: última.tool, durationMs: última.durationMs, state: última.state, contextReferences: última.summary.contextReferences ?? [] } : null;
  const state = configuration.code.endsWith('FAILED') || configuration.code.endsWith('UNAVAILABLE') || protocolos.problems || !h.complete ? 'ERRO'
    : !configuration.found ? 'NAO_CONFIGURADO' : válida && lastProtocol?.state === 'ERRO' ? 'ERRO' : lastObserved ? 'UTILIZADO' : válida && lastProtocol?.state === 'VALIDADO' ? 'VALIDADO' : 'CONFIGURADO';
  return { client, project: p.manifesto.name, state, configuration, inspection:configuration, lastProtocol, protocolCurrent: válida, lastObserved,
    toolsUsed: [...new Set(chamadas.map(e => e.tool))], problems: protocolos.problems + h.problems.length,
    notice: 'O teste SDK comprova o servidor local. Uso observado é a chamada de um cliente com identidade declarada, não autenticada; não comprova sessão ativa nem obediência às referências.' };
}

export function inspecionarIntegracao(p: Projeto, client: Cliente) {
  const plano = prepararConexao(p, client);
  try {
    let servidores: unknown;
    if (client === 'codex') {
      if (!plano.executable || plano.manualOnly) return { found: false, matches: 0, code: 'CLIENT_INSPECTION_UNAVAILABLE' };
      const r = spawnSync(plano.executable, ['mcp', 'list', '--json'], { cwd:p.raiz, shell: false, windowsHide: true, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 });
      if (r.error || r.status !== 0) throw new Error('inspection');
      servidores = JSON.parse(r.stdout);
    } else if (client === 'copilot' || client === 'gemini') {
      // Copilot (~/.copilot/mcp-config.json) e Gemini (~/.gemini/settings.json) guardam os servidores em mcpServers.
      const config = lerConfiguracaoDoCliente(plano.destination).mcpServers ?? {};
      if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('inspection');
      servidores = Object.values(config);
    } else {
      // O ~/.claude.json guarda também o histórico dos projetos e cresce com o uso.
      const c = claudeConfigSchema.parse(lerConfiguracaoDoCliente(plano.destination, 16 * 1024 * 1024));
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

export async function testarIntegracao(raiz:string, client:typeof clientes[number]) {
  const p=await projetoVinculado(raiz,diretorioDados());
  await testarProtocolo(p,client);
  return diagnosticarIntegracao(p,client);
}

/** Verifica o servidor do próprio produto; nunca executa command/args/env vindos do arquivo de cliente. */
export async function testarProtocolo(p: Projeto, client: Cliente) {
  const atual = await carregarProjeto(p.raiz);
  if (atual.manifesto.id !== p.manifesto.id || atual.manifestoHash !== p.manifestoHash) throw new Error('PROJECT_BINDING_CHANGED');
  const plano = prepararConexao(atual, client);
  const dir = pastaDosTestesDeIntegracao(atual); semLinks(dir);
  if (registrosIntegracao(atual).records.length >= 1000) throw new Error('INTEGRATION_LIMIT');
  const inicio = performance.now();
  const r: Registro = { id: randomUUID(), client, rootHash: hash(p.raiz), projectHash: hash(p.manifesto.id), manifestHash: p.manifestoHash,
    configurationHash: assinaturaDaConfiguracao(plano), at: new Date().toISOString(), durationMs: 0, state: 'ERRO', code: 'PROTOCOL_FAILED', handshake: false, tools: [], read: false, origin: 'sdk-protocolo' };
  const sdk = new Client({ name: 'prumo-sdk-protocolo', version: '1.0.0' });
  const transporte = new StdioClientTransport({ ...plano.configuration, stderr: 'pipe' });
  // Descarta stderr em memória: não persiste mensagens livres ou caminhos privados.
  transporte.stderr?.on('data', () => {});
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([(async () => {
      await sdk.connect(transporte); r.handshake = true;
      const lista = await sdk.listTools({}, { timeout: 5000 });
      if (lista.tools.length !== tools.length || !tools.every(n => lista.tools.some(t => t.name === n))) throw new Error('tools');
      r.tools = tools.slice();
      const chamada = await sdk.callTool({ name: 'consultar_evidencias', arguments: {} }, undefined, { timeout: 5000 });
      if (chamada.isError) throw new Error('read');
      const texto = (chamada.content as { type: string; text?: string }[]).find(c => c.type === 'text')?.text;
      const dados = JSON.parse(texto ?? 'null');
      if (!dados || dados.projectId !== atual.manifesto.id || !Array.isArray(dados.results)) throw new Error('binding');
      r.read = true; r.state = 'VALIDADO'; r.code = 'PROTOCOL_OK';
    })(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 12000); })]);
  } catch { r.state = 'ERRO'; r.code = 'PROTOCOL_FAILED'; }
  finally { clearTimeout(timer); await sdk.close().catch(() => {}); await transporte.close().catch(() => {}); }
  r.durationMs = Math.round(performance.now() - inicio);
  registroSchema.parse(r);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); semLinks(dir);
  const payload = JSON.stringify(r);
  fs.writeFileSync(path.join(dir, r.id + '.json'), JSON.stringify({ payload, sha256: hash(payload) }), { flag: 'wx', mode: 0o600 });
  return r;
}

// Validação dos planos usados pelo próprio diagnóstico.
export function assinaturaDaConfiguracao(plano: Plano) {
  return hash(JSON.stringify(plano.configuration));
}

function caminhoNormalizado(caminho: string): string {
  const absoluto = path.resolve(caminho);
  return process.platform === 'win32' ? absoluto.toLowerCase() : absoluto;
}

/** Somente caminhos absolutos podem ser comparados; no Windows ignora diferenças de caixa. */
export function mesmoCaminho(valor: unknown, esperado: string): boolean {
  return typeof valor === 'string' &&
    path.isAbsolute(valor) &&
    caminhoNormalizado(valor) === caminhoNormalizado(esperado);
}

// integracoes — responsabilidade integrada
export function pastaDosTestesDeIntegracao(p: Projeto) { return path.resolve(pastaAtividades(p), '..', '..', 'integracoes', hash(p.raiz + '\0' + p.manifesto.id)); }

export function registrosIntegracao(p: Projeto) {
  const dir = pastaDosTestesDeIntegracao(p); semLinks(dir);
  if (!fs.existsSync(dir)) return { records: [] as Registro[], problems: 0 };
  const nomes = fs.readdirSync(dir).filter(n => /^[a-f0-9-]{36}\.json$/.test(n));
  if (nomes.length > 1000) throw new Error('INTEGRATION_LIMIT');
  const records: Registro[] = []; let problems = 0;
  for (const nome of nomes) {
    try {
      const arq = path.join(dir, nome); semLinks(arq); const st = fs.lstatSync(arq);
      if (!st.isFile() || st.nlink !== 1 || st.size > 8192) throw new Error('invalid');
      const raw = JSON.parse(fs.readFileSync(arq, 'utf8'));
      if (typeof raw.payload !== 'string' || hash(raw.payload) !== raw.sha256) throw new Error('invalid');
      const r = registroSchema.parse(JSON.parse(raw.payload));
      if (r.id + '.json' !== nome || r.rootHash !== hash(p.raiz) || r.projectHash !== hash(p.manifesto.id)) throw new Error('binding');
      records.push(r);
    } catch { problems++; }
  }
  return { records: records.sort((a, b) => a.at.localeCompare(b.at)), problems };
}
