import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { prepararConexao } from './conexoes.js';
import { carregarProjeto, hash, type Projeto } from './projeto.js';
import { consultarAtividades, pastaAtividades, semLinks } from './atividades.js';

export const clientes = ['codex', 'claude'] as const;
type Cliente = typeof clientes[number];
type Plano = ReturnType<typeof prepararConexao>;
const tools = ['contexto_projeto', 'revisar_cobertura', 'executar_validacao', 'consultar_evidencias'];
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const registroSchema = z.object({
  id: z.string().uuid(), client: z.enum(clientes), rootHash: digest, projectHash: digest, manifestHash: digest,
  configurationHash: digest, at: z.string().datetime(), durationMs: z.number().finite().nonnegative(),
  state: z.enum(['VALIDADO', 'ERRO']), code: z.enum(['PROTOCOL_OK', 'PROTOCOL_FAILED']),
  handshake: z.boolean(), tools: z.array(z.enum(tools as [string, ...string[]])).max(4), read: z.boolean(),
  origin: z.literal('sdk-protocolo')
}).strict();
type Registro = z.infer<typeof registroSchema>;
const claudeConfigSchema=z.object({mcpServers:z.record(z.unknown()).default({}),projects:z.record(z.object({mcpServers:z.record(z.unknown()).default({}),disabledMcpjsonServers:z.array(z.string()).max(200).default([])}).passthrough()).default({})}).passthrough();
const normalizarCaminho=(a:string)=>process.platform==='win32'?path.resolve(a).toLowerCase():path.resolve(a);
const igualCaminho = (a: unknown, b: string) => typeof a === 'string' && path.isAbsolute(a) && normalizarCaminho(a) === normalizarCaminho(b);
function runtimeNode(command:unknown) {
  if(typeof command!=='string')return false;
  const exe=process.platform==='win32'?'node.exe':'node';
  const candidatos=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d)).map(d=>path.join(d,exe));
  if(path.basename(process.execPath).toLowerCase()===exe)candidatos.unshift(process.execPath);
  return candidatos.some(alvo=>{
    if(command!==exe&&command!=='node'&&!igualCaminho(command,alvo))return false;
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
    const nativo=runtimeNode(c.command);
    return (c.type===undefined||c.type==='stdio')&&!c.url&&(igualCaminho(c.command, plano.configuration.command)||nativo) &&
      Array.isArray(c.args) && c.args.length === plano.configuration.args.length &&
      c.args.every((v: unknown, i: number) => igualCaminho(v, plano.configuration.args[i]!)) &&
      env && typeof env === 'object' && !Array.isArray(env) &&
      Object.keys(env).every(k => ['PRUMO_DATA_DIR', 'ELECTRON_RUN_AS_NODE'].includes(k)) &&
      env.PRUMO_DATA_DIR===plano.configuration.env.PRUMO_DATA_DIR &&
      (nativo ? env.ELECTRON_RUN_AS_NODE===undefined||env.ELECTRON_RUN_AS_NODE==='1' : env.ELECTRON_RUN_AS_NODE===plano.configuration.env.ELECTRON_RUN_AS_NODE);
  });
  return { found: compatíveis.length > 0, matches: compatíveis.length };
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
    } else {
      semLinks(plano.destination);
      let c=claudeConfigSchema.parse({});
      if(fs.existsSync(plano.destination)){
        const st = fs.lstatSync(plano.destination);
        if (!st.isFile() || st.nlink !== 1 || st.size > 1024 * 1024) throw new Error('inspection');
        c = claudeConfigSchema.parse(JSON.parse(fs.readFileSync(plano.destination, 'utf8')));
      }
      const projetoConfig=Object.keys(c.projects??{}).find(k=>igualCaminho(k,p.raiz));
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

function pasta(p: Projeto) { return path.resolve(pastaAtividades(p), '..', '..', 'integracoes', hash(p.raiz + '\0' + p.manifesto.id)); }
function assinatura(plano: Plano) { return hash(JSON.stringify(plano.configuration)); }
export function registrosIntegracao(p: Projeto) {
  const dir = pasta(p); semLinks(dir);
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

/** Verifica o servidor do próprio produto; nunca executa command/args/env vindos do arquivo de cliente. */
export async function testarProtocolo(p: Projeto, client: Cliente) {
  const atual = await carregarProjeto(p.raiz);
  if (atual.manifesto.id !== p.manifesto.id || atual.manifestoHash !== p.manifestoHash) throw new Error('PROJECT_BINDING_CHANGED');
  const plano = prepararConexao(atual, client);
  const dir = pasta(atual); semLinks(dir);
  if (registrosIntegracao(atual).records.length >= 1000) throw new Error('INTEGRATION_LIMIT');
  const inicio = performance.now();
  const r: Registro = { id: randomUUID(), client, rootHash: hash(p.raiz), projectHash: hash(p.manifesto.id), manifestHash: p.manifestoHash,
    configurationHash: assinatura(plano), at: new Date().toISOString(), durationMs: 0, state: 'ERRO', code: 'PROTOCOL_FAILED', handshake: false, tools: [], read: false, origin: 'sdk-protocolo' };
  const sdk = new Client({ name: 'prumo-sdk-protocolo', version: '1.0.0' });
  const transporte = new StdioClientTransport({ ...plano.configuration, stderr: 'pipe' });
  // Descarta stderr em memória: não persiste mensagens livres ou caminhos privados.
  transporte.stderr?.on('data', () => {});
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([(async () => {
      await sdk.connect(transporte); r.handshake = true;
      const lista = await sdk.listTools({}, { timeout: 5000 });
      if (lista.tools.length !== 4 || !tools.every(n => lista.tools.some(t => t.name === n))) throw new Error('tools');
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

export function diagnosticarIntegracao(p: Projeto, client: Cliente) {
  const plano = prepararConexao(p, client); const configuration = inspecionarIntegracao(p, client);
  const h = consultarAtividades(p); const protocolos = registrosIntegracao(p);
  const lastProtocol = protocolos.records.filter(r => r.client === client).at(-1) ?? null;
  const válida = lastProtocol?.manifestHash === p.manifestoHash && lastProtocol.configurationHash === assinatura(plano);
  const chamadas = h.activities.filter(e => e.origin === 'MCP' && e.clientClassificationVersion===2 && e.client === client && e.phase === 'end' && e.state !== 'ERROR' && e.manifestHash === p.manifestoHash);
  const última = chamadas.at(-1);
  const lastObserved = última ? { id: última.operationId, at: última.at, tool: última.tool, durationMs: última.durationMs, state: última.state, contextReferences: última.summary.contextReferences ?? [] } : null;
  const state = configuration.code.endsWith('FAILED') || configuration.code.endsWith('UNAVAILABLE') || protocolos.problems || !h.complete ? 'ERRO'
    : !configuration.found ? 'NAO_CONFIGURADO' : válida && lastProtocol?.state === 'ERRO' ? 'ERRO' : lastObserved ? 'UTILIZADO' : válida && lastProtocol?.state === 'VALIDADO' ? 'VALIDADO' : 'CONFIGURADO';
  return { client, project: p.manifesto.name, state, configuration, inspection:configuration, lastProtocol, protocolCurrent: válida, lastObserved,
    toolsUsed: [...new Set(chamadas.map(e => e.tool))], problems: protocolos.problems + h.problems.length,
    notice: 'O teste SDK comprova o servidor local. Uso observado é a chamada de um cliente com identidade declarada, não autenticada; não comprova sessão ativa nem obediência às referências.' };
}
