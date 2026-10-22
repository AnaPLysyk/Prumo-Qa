/** Terminal da IDE: roda um comando por vez na pasta do projeto e guarda a saída para a janela ler aos poucos. */
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { mascarar } from '../compartilhado/seguranca/mascarar.js';

export const MAX_COMANDO = 1000;
const LIMITE_SAIDA = 1_500_000;
const TEMPO_MAXIMO_MS = 10 * 60_000;
const GUARDA_DEPOIS_DO_FIM_MS = 10 * 60_000;

type Execucao = { id: string; espacoId: string; comando: string; saida: string; cortada: boolean; fim: boolean; codigo: number | null; processo: ChildProcess | null; temporizador: NodeJS.Timeout | null };
const execucoes = new Map<string, Execucao>();

/** Uma linha só, sem caracteres de controle: o que a confirmação mostra é exatamente o que roda. */
export function comandoValido(comando: unknown): string {
  const c = typeof comando === 'string' ? comando.trim() : '';
  if (!c) throw new Error('TERMINAL_COMANDO_VAZIO');
  if (c.length > MAX_COMANDO) throw new Error('TERMINAL_COMANDO_LONGO');
  if (/[\u0000-\u0008\u000a-\u001f\u007f]/.test(c)) throw new Error('TERMINAL_COMANDO_INVALIDO');
  return c;
}

/** Ambiente do terminal: herda o do Windows (o PATH é o que acha node, npm e git), menos o que parece segredo ou muda o runtime do Prumo. */
export function ambienteDoTerminal(origem: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [nome, valor] of Object.entries(origem)) {
    if (valor === undefined || /token|secret|passw|credential|api.?key|private|auth|cookie|session/i.test(nome) || /^(?:PRUMO_|ELECTRON_|NODE_OPTIONS$|NODE_TEST_CONTEXT$)/i.test(nome)) continue;
    env[nome] = valor;
  }
  env.FORCE_COLOR = '1'; delete env.NO_COLOR; env.TERM = 'xterm-256color';
  return env;
}

function pastaDoProjeto(pasta: string): string {
  const real = fs.realpathSync(pasta);
  if (!fs.statSync(real).isDirectory()) throw new Error('IDE_SEM_REPOSITORIO');
  return real;
}

function encerrarArvore(processo: ChildProcess) {
  if (!processo.pid) return;
  if (process.platform === 'win32' && process.env.SystemRoot) {
    spawn(path.join(process.env.SystemRoot, 'System32', 'taskkill.exe'), ['/PID', String(processo.pid), '/T', '/F'], { windowsHide: true, shell: false, stdio: 'ignore' }).on('error', () => undefined);
  } else { try { process.kill(-processo.pid, 'SIGKILL'); } catch { processo.kill('SIGKILL'); } }
}

/** Inicia o comando (a confirmação já aconteceu). Só um por projeto ao mesmo tempo. */
export function iniciarComando(espacoId: string, pasta: string, comando: string): string {
  if ([...execucoes.values()].some((e) => e.espacoId === espacoId && !e.fim)) throw new Error('TERMINAL_OCUPADO: já existe um comando rodando neste projeto.');
  const cwd = pastaDoProjeto(pasta);
  const e: Execucao = { id: randomUUID(), espacoId, comando, saida: '', cortada: false, fim: false, codigo: null, processo: null, temporizador: null };
  const win = process.platform === 'win32';
  // No Windows: cmd com a página de código em UTF-8 (acentos); em outros sistemas: sh. Sem entrada: o comando não fica esperando teclado.
  const filho = win
    ? spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe'), ['/d', '/s', '/c', '"chcp 65001>nul & ' + comando + '"'], { cwd, env: ambienteDoTerminal(), windowsHide: true, windowsVerbatimArguments: true, stdio: ['ignore', 'pipe', 'pipe'] })
    : spawn('/bin/sh', ['-c', comando], { cwd, env: ambienteDoTerminal(), detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  e.processo = filho;
  const anexar = (texto: string) => {
    if (e.cortada) return;
    const limpo = mascarar(texto);
    if (e.saida.length + limpo.length > LIMITE_SAIDA) { e.saida += limpo.slice(0, Math.max(0, LIMITE_SAIDA - e.saida.length)) + '\r\n[saída cortada: limite de tamanho]\r\n'; e.cortada = true; return; }
    e.saida += limpo;
  };
  filho.stdout?.setEncoding('utf8').on('data', anexar); filho.stderr?.setEncoding('utf8').on('data', anexar);
  const terminar = (codigo: number | null, aviso?: string) => {
    if (e.fim) return;
    if (aviso) anexar(aviso); e.fim = true; e.codigo = codigo; e.processo = null; if (e.temporizador) clearTimeout(e.temporizador);
    setTimeout(() => execucoes.delete(e.id), GUARDA_DEPOIS_DO_FIM_MS).unref();
  };
  filho.on('error', (erro) => terminar(-1, '\r\nNão foi possível iniciar o comando: ' + erro.message + '\r\n'));
  filho.on('close', (codigo) => terminar(codigo));
  e.temporizador = setTimeout(() => { encerrarArvore(filho); terminar(-1, '\r\n[encerrado: passou de ' + TEMPO_MAXIMO_MS / 60_000 + ' minutos]\r\n'); }, TEMPO_MAXIMO_MS);
  e.temporizador.unref();
  execucoes.set(e.id, e);
  return e.id;
}

/** O que saiu desde a posição `desde` (em caracteres) e se o comando já terminou. */
export function lerSaida(id: string, desde: number) {
  const e = execucoes.get(id); if (!e) throw new Error('TERMINAL_COMANDO_DESCONHECIDO');
  const inicio = Math.min(Math.max(0, desde), e.saida.length);
  return { texto: e.saida.slice(inicio), proximo: e.saida.length, fim: e.fim, codigo: e.codigo };
}

export function pararComando(id: string): { parado: boolean } {
  const e = execucoes.get(id); if (!e || e.fim || !e.processo) return { parado: false };
  encerrarArvore(e.processo); return { parado: true };
}
