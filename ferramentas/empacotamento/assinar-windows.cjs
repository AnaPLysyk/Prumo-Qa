'use strict';
/**
 * Gancho de assinatura do electron-builder (win.sign). Assina com um certificado LEGÍTIMO quando a credencial existe e
 * NÃO faz nada quando não existe: o build continua gerando instalador não assinado, sem fingir assinatura.
 *
 * Variáveis (todas via ambiente/segredos do CI; nada disto vai para o Git):
 *   PRUMO_ASSINATURA_THUMBPRINT  impressão digital (SHA-1, 40 hex) do certificado já instalado na máquina de build
 *                                (certificado em HSM/token ou em HSM na nuvem exposto ao Windows pelo fornecedor da AC)
 *   PRUMO_SIGNTOOL               caminho do signtool.exe (opcional; senão procura no Windows SDK)
 *   PRUMO_TIMESTAMP_URL          servidor RFC 3161 (opcional; padrão http://timestamp.digicert.com)
 *
 * Com credencial presente, qualquer falha (signtool ausente, erro de assinatura) INTERROMPE o build: nunca se publica
 * silenciosamente um instalador não assinado achando que foi assinado. Segredos e chaves nunca são registrados.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const padraoTimestamp = 'http://timestamp.digicert.com';

function procurarSigntool(env, existe = fs.existsSync, listar = (d) => fs.readdirSync(d)) {
  if (env.PRUMO_SIGNTOOL) { if (!existe(env.PRUMO_SIGNTOOL)) throw new Error('PRUMO_SIGNTOOL aponta para um arquivo inexistente.'); return env.PRUMO_SIGNTOOL; }
  const raiz = path.join(env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Windows Kits', '10', 'bin');
  try {
    for (const v of listar(raiz).sort().reverse()) { const candidato = path.join(raiz, v, 'x64', 'signtool.exe'); if (existe(candidato)) return candidato; }
  } catch { /* SDK ausente */ }
  throw new Error('signtool.exe não encontrado: instale o Windows SDK ou defina PRUMO_SIGNTOOL.');
}
/** Argumentos do signtool (sem shell, sem interpolação). Lança erro para entrada inválida. */
function montarArgumentos(env, arquivo) {
  const digital = String(env.PRUMO_ASSINATURA_THUMBPRINT ?? '').replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]{40}$/.test(digital)) throw new Error('PRUMO_ASSINATURA_THUMBPRINT inválida: esperado SHA-1 com 40 caracteres hexadecimais.');
  const carimbo = env.PRUMO_TIMESTAMP_URL || padraoTimestamp;
  let url; try { url = new URL(carimbo); } catch { throw new Error('PRUMO_TIMESTAMP_URL inválida.'); }
  if (!/^https?:$/.test(url.protocol)) throw new Error('PRUMO_TIMESTAMP_URL deve ser http(s).');
  if (typeof arquivo !== 'string' || !path.isAbsolute(arquivo)) throw new Error('Caminho do arquivo a assinar deve ser absoluto.');
  return ['sign', '/sha1', digital, '/fd', 'sha256', '/tr', url.href, '/td', 'sha256', arquivo];
}
/** `executar` e `existe` são injetáveis para teste. Retorna 'assinado' ou 'ignorado' (sem credencial). */
function assinar(configuracao, env = process.env, executar = spawnSync, deps = {}) {
  if (!env.PRUMO_ASSINATURA_THUMBPRINT) { process.stdout.write(`[assinatura] sem credencial: ${path.basename(configuracao.path)} permanece NÃO ASSINADO\n`); return 'ignorado'; }
  const signtool = procurarSigntool(env, deps.existe, deps.listar);
  const r = executar(signtool, montarArgumentos(env, path.resolve(configuracao.path)), { windowsHide: true, shell: false, encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`Falha ao assinar ${path.basename(configuracao.path)} (código ${r.status ?? 'n/d'}). O build foi interrompido para não publicar arquivo supostamente assinado.`);
  process.stdout.write(`[assinatura] assinado: ${path.basename(configuracao.path)}\n`);
  return 'assinado';
}
exports.default = async (configuracao) => { assinar(configuracao); };
exports.assinar = assinar;
exports.montarArgumentos = montarArgumentos;
exports.procurarSigntool = procurarSigntool;
