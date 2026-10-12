/** Inicia o servidor MCP do Prumo e conversa com ele pelo SDK oficial (handshake, ferramentas e uma consulta), registrando o resultado. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { pastaDosTestesDeIntegracao } from '../banco/pastaDosTestesDeIntegracao.js';
import { registrosIntegracao } from '../banco/registrosIntegracao.js';
import { assinaturaDaConfiguracao } from './assinaturaDaConfiguracao.js';
import { prepararConexao } from './prepararConexao.js';
import { Cliente, Registro, registroSchema, tools } from '../tipos/integracaoIa.js';

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
