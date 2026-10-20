/** Autoriza o MCP local usando a sessão ativa do Electron, sem aceitar IDs declarados pelo cliente. */
import net, { type Server } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { diretorioBase } from '../compartilhado/banco/diretorioDados.js';
import { arquivoLocal } from '../compartilhado/banco/persistenciaLocal.js';
import { gravarLocal } from '../compartilhado/banco/persistenciaLocal.js';

let servidor: Server | null = null;
let endereco: string | null = null;
let credencial: Buffer | null = null;
let contaAtiva: (() => Promise<string | null>) | null = null;

function apagarCredencial() {
  try {
    const arquivo = arquivoLocal('mcp-sessao.json', diretorioBase());
    if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
  } catch { /* Uma credencial inválida ou travada não autoriza acesso: o segredo em memória já foi revogado. */ }
}

/** Login novo troca o segredo. Logout revoga imediatamente, inclusive para servidores MCP já abertos. */
export function renovarCredencialMcp() {
  if (!servidor || !endereco) return; // Outros processos nunca alteram a credencial do aplicativo.
  credencial = null;
  apagarCredencial();
  try {
    const nova = randomBytes(32);
    gravarLocal('mcp-sessao.json', { versao: 1, endereco, chave: nova.toString('hex') }, diretorioBase());
    credencial = nova;
  } catch { credencial = null; apagarCredencial(); }
}

export function revogarCredencialMcp() {
  if (!servidor) return;
  credencial = null;
  apagarCredencial();
}

/** Canal restrito ao computador: responde somente depois de validar a chave aleatória e a sessão atual. */
export async function iniciarPonteDaSessaoMcp(conta: () => Promise<string | null>) {
  if (servidor) return;
  contaAtiva = conta;
  apagarCredencial(); // Somente o Electron iniciando a ponte invalida a credencial de outra execução.
  const identificador = randomBytes(16).toString('hex');
  const nome = process.platform === 'win32'
    ? '\\\\.\\pipe\\prumo-mcp-' + identificador
    : path.join(os.tmpdir(), 'prumo-mcp-' + identificador + '.sock');
  const nova = net.createServer(socket => {
    let texto = ''; let processando = false;
    socket.setEncoding('utf8');
    socket.setTimeout(2500, () => socket.destroy());
    socket.on('data', async parte => {
      if (processando) return;
      texto += parte;
      if (texto.length > 512) return socket.destroy();
      const fim = texto.indexOf('\n');
      if (fim < 0) return;
      processando = true;
      let chave = '';
      try { const pedido = JSON.parse(texto.slice(0, fim)); if (typeof pedido?.chave === 'string') chave = pedido.chave; } catch { /* inválido */ }
      const recebida = /^[a-f0-9]{64}$/.test(chave) ? Buffer.from(chave, 'hex') : Buffer.alloc(0);
      let usuario: string | null = null;
      try { usuario = await contaAtiva?.() ?? null; }
      catch { revogarCredencialMcp(); }
      const autorizada = !!usuario && !!credencial && recebida.length === credencial.length && timingSafeEqual(recebida, credencial);
      socket.end(JSON.stringify(autorizada ? { usuarioId: usuario } : { erro: 'MCP_SESSION_REQUIRED' }) + '\n');
    });
    socket.on('error', () => {});
  });
  nova.maxConnections = 12;
  try {
    await new Promise<void>((ok, falhar) => {
      nova.once('error', falhar);
      nova.listen(nome, () => { nova.off('error', falhar); ok(); });
    });
    servidor = nova;
    endereco = nome;
    // Ainda não há sessão no início do aplicativo: a credencial só nasce no login.
  } catch (erro) {
    nova.close();
    contaAtiva = null;
    throw erro;
  }
}

export function fecharPonteDaSessaoMcp() {
  revogarCredencialMcp();
  servidor?.close();
  servidor = null;
  if (endereco && process.platform !== 'win32') {
    try { fs.unlinkSync(endereco); } catch { /* socket já encerrado */ }
  }
  endereco = null;
  contaAtiva = null;
}
