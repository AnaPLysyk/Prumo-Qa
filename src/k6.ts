import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { caminhoSeguro, lerSeguro, hash, mascarar, carregarProjeto, ErroQa, type Projeto } from './projeto.js';
import { classificar, salvarEvidencia, type Evidencia } from './evidencias.js';
import type { Delegada } from './execucao.js';
import { solicitarAprovacao } from './aprovacao.js';

/**
 * Adaptador do k6 (2.8). Usa o executável oficial; não existe motor próprio de carga e nenhum código do k6 é copiado.
 * Regras: executável procurado só em pastas absolutas do PATH (nunca na pasta atual), sem shell; script dentro da raiz do
 * projeto; usuários virtuais e duração com teto; destino declarado; produção bloqueada; mesma aprovação humana das demais
 * execuções (manual pelo broker nativo, agendada por autorização delegada restrita ao hash exato).
 */
export type ConfigK6 = { script: string; alvo: string; usuarios: number; duracaoSegundos: number };
export const LIMITE_USUARIOS = 50; export const LIMITE_DURACAO_S = 600;
export type ExecutavelK6 = { executable: string; argsIniciais?: string[] };

export async function localizarK6(path_ = process.env.PATH ?? ''): Promise<string | null> {
  const nomes = process.platform === 'win32' ? ['k6.exe'] : ['k6'];
  for (const pasta of path_.split(path.delimiter)) {
    if (!pasta || !path.isAbsolute(pasta)) continue;
    for (const n of nomes) { const c = path.join(pasta, n); try { const st = await fs.stat(c); if (st.isFile()) return c; } catch { /* próximo */ } }
  }
  return null;
}
const loopback = (h: string) => h === 'localhost' || h === '::1' || h === '[::1]' || /^127\./.test(h);
export function validarAlvo(alvo: string, ambiente: string) {
  let u: URL; try { u = new URL(alvo); } catch { throw new ErroQa('K6_TARGET_INVALID', 'Destino inválido.'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new ErroQa('K6_TARGET_INVALID', 'Destino deve ser http(s) sem credenciais na URL.');
  if (ambiente === 'producao') throw new ErroQa('POLICY_BLOCKED', 'Teste de carga em produção está bloqueado por padrão nesta versão.');
  if (ambiente === 'local' && !loopback(u.hostname)) throw new ErroQa('K6_TARGET_NOT_LOCAL', 'Ambiente "local" só aceita localhost/127.0.0.1.');
  return u.origin;
}
export function validarLimites(c: ConfigK6) {
  if (!Number.isInteger(c.usuarios) || c.usuarios < 1 || c.usuarios > LIMITE_USUARIOS) throw new ErroQa('K6_LIMIT', `Usuários virtuais entre 1 e ${LIMITE_USUARIOS}.`);
  if (!Number.isInteger(c.duracaoSegundos) || c.duracaoSegundos < 1 || c.duracaoSegundos > LIMITE_DURACAO_S) throw new ErroQa('K6_LIMIT', `Duração entre 1 e ${LIMITE_DURACAO_S} segundos.`);
}
export const capabilityK6 = (c: ConfigK6) => ('k6:' + c.script.replaceAll('\\', '/')).slice(0, 80);

/** Escopo estável: raiz, manifesto, script (hash), parâmetros, destino, ambiente e executável (caminho+tamanho). */
export async function escopoK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6) {
  validarLimites(c); const origem = validarAlvo(c.alvo, ambiente);
  if (p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED', 'Projeto autorizado estritamente para leitura.');
  if (!/\.m?js$/i.test(c.script)) throw new ErroQa('K6_SCRIPT_INVALID', 'O script do k6 deve ser .js ou .mjs.');
  const fonte = await lerSeguro(p.raiz, c.script, false, 262144);
  const st = await fs.stat(exe.executable);
  const scopeHash = hash(JSON.stringify({ root: p.raiz, manifest: p.manifestoHash, script: c.script, scriptSha: hash(fonte), alvo: origem, usuarios: c.usuarios, duracao: c.duracaoSegundos, ambiente, exe: { p: exe.executable, size: st.size } }));
  return { scopeHash, command: JSON.stringify({ tool: 'k6', script: c.script, alvo: origem, usuarios: c.usuarios, duracaoSegundos: c.duracaoSegundos, ambiente }) };
}

function extrairMetricas(resumo: unknown) {
  const m = (resumo as { metrics?: Record<string, Record<string, unknown>> } | null)?.metrics; if (!m) return null;
  const pega = (nome: string, campos: string[]) => Object.fromEntries(campos.filter(c => typeof m[nome]?.[c] === 'number').map(c => [c, m[nome]![c]]));
  const limiares: { metrica: string; expressao: string; ok: boolean }[] = [];
  for (const [nome, v] of Object.entries(m)) { const t = v?.thresholds as Record<string, unknown> | undefined; if (t) for (const [expr, val] of Object.entries(t)) if (val && typeof val === 'object' && typeof (val as { ok?: unknown }).ok === 'boolean') limiares.push({ metrica: nome, expressao: expr, ok: (val as { ok: boolean }).ok }); }
  return { http_reqs: pega('http_reqs', ['count', 'rate']), http_req_failed: pega('http_req_failed', ['value', 'passes', 'fails']), http_req_duration: pega('http_req_duration', ['avg', 'med', 'p(90)', 'p(95)', 'max']), iterations: pega('iterations', ['count']), limiares };
}

export async function executarK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6 | null, solicitar: boolean, delegada?: Delegada, solicitarFn: typeof solicitarAprovacao = solicitarAprovacao, signal?: AbortSignal) {
  const jobId = randomUUID(); const inicio = new Date().toISOString(); const capability = capabilityK6(c);
  const e: Evidencia = { kind: 'execution_evidence', jobId, projectId: p.manifesto.id, rootHash: hash(p.raiz), manifestHash: p.manifestoHash, scopeHash: null, capability, status: 'BLOCKED', reason: '', startedAt: inicio, endedAt: inicio, executed: false, exitCode: null, command: null, approval: null, cases: [], stdout: '', stderr: '', logSha256: hash('\n'), resultArtifact: null, evidenceScope: 'round', provenance: 'local-process' };
  let args: string[]; let resumoAbs = ''; let resumoRel = ''; let timeoutMs = 0;
  try {
    if (!exe) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH. Instale o k6 oficial (grafana/k6) e reabra o Prumo.');
    const atual = await carregarProjeto(p.raiz); if (atual.manifestoHash !== p.manifestoHash) throw new ErroQa('SCOPE_CHANGED', 'Manifesto mudou; recarregue o contexto.');
    const esc = await escopoK6(p, c, ambiente, exe); e.scopeHash = esc.scopeHash; e.command = JSON.parse(esc.command);
    const scriptAbs = await caminhoSeguro(p.raiz, c.script);
    if (!solicitar && !delegada) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Execução de k6 exige aprovação humana nativa ou autorização agendada vigente.');
    let aprovado;
    if (!solicitar && delegada) { aprovado = await delegada({ scopeHash: esc.scopeHash, capability, command: esc.command }); if (!aprovado) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Nenhuma autorização agendada válida cobre este escopo de k6.'); }
    else try { aprovado = await solicitarFn({ projectId: p.manifesto.id, root: p.raiz, capability, scopeHash: esc.scopeHash, command: esc.command, expiresAt: new Date(Date.now() + 120000).toISOString() }); } catch (err) { throw new ErroQa('HUMAN_APPROVAL_REQUIRED', (err as Error).message); }
    if (!aprovado || aprovado.scopeHash !== esc.scopeHash) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Consentimento cancelado, indisponível ou inválido.');
    e.approval = aprovado;
    const depois = await escopoK6(await carregarProjeto(p.raiz), c, ambiente, exe); if (depois.scopeHash !== esc.scopeHash) throw new ErroQa('SCOPE_CHANGED', 'Script ou projeto mudou após a aprovação.');
    resumoRel = `.prumo/resultados/${jobId}-k6.json`; await fs.mkdir(await caminhoSeguro(p.raiz, '.prumo/resultados', true, true), { recursive: true }); resumoAbs = await caminhoSeguro(p.raiz, resumoRel, true, true);
    args = [...(exe.argsIniciais ?? []), 'run', '--quiet', '--no-usage-report', '--vus', String(c.usuarios), '--duration', `${c.duracaoSegundos}s`, '--summary-export', resumoAbs, '-e', `TARGET_URL=${new URL(c.alvo).origin}`, scriptAbs];
    timeoutMs = (c.duracaoSegundos + 60) * 1000;
  } catch (err) {
    e.reason = (err instanceof ErroQa ? err.codigo : 'PRECONDITION_MISSING') + ': ' + mascarar((err as Error).message);
    e.status = err instanceof ErroQa && err.codigo === 'RUNTIME_MISSING' ? 'NOT_RUN' : 'BLOCKED';
    e.endedAt = new Date().toISOString(); return await salvarEvidencia(p, e);
  }
  const sistema = process.env.SystemRoot; const env: NodeJS.ProcessEnv = { K6_NO_USAGE_REPORT: 'true' };
  if (sistema) { env.SystemRoot = sistema; env.WINDIR = sistema; } for (const n of ['TEMP', 'TMP', 'TMPDIR']) if (process.env[n]) env[n] = process.env[n];
  const max = 65536; const saida: Buffer[] = []; const erro: Buffer[] = []; let tam = 0; let bloqueio: string | undefined;
  const r = await new Promise<{ exitCode: number | null; error?: string }>(resolve => {
    const filho = spawn(exe!.executable, args, { cwd: p.raiz, shell: false, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const parar = (m: string) => { if (!bloqueio) { bloqueio = m; filho.kill(); if (process.platform === 'win32' && sistema && filho.pid) spawn(path.join(sistema, 'System32', 'taskkill.exe'), ['/PID', String(filho.pid), '/T', '/F'], { windowsHide: true, shell: false, stdio: 'ignore' }); } };
    const t = setTimeout(() => parar('TIMEOUT'), timeoutMs);
    if (signal) { if (signal.aborted) parar('CANCELLED'); else signal.addEventListener('abort', () => parar('CANCELLED'), { once: true }); }
    const cap = (a: Buffer[], b: Buffer) => { const s = max - tam; if (s > 0) a.push(b.subarray(0, s)); tam += b.length; if (tam > max * 4) parar('OUTPUT_LIMIT'); };
    filho.stdout.on('data', b => cap(saida, b)); filho.stderr.on('data', b => cap(erro, b)); filho.on('spawn', () => { e.executed = true; });
    filho.on('error', er => { clearTimeout(t); resolve({ exitCode: null, error: er.message }); }); filho.on('close', (code, signal) => { clearTimeout(t); if (signal && !bloqueio) bloqueio = 'PROCESS_SIGNAL'; resolve({ exitCode: code }); });
  });
  e.stdout = mascarar(Buffer.concat(saida).toString()); e.stderr = mascarar(Buffer.concat(erro).toString()); e.exitCode = r.exitCode; if (r.error) bloqueio = 'SUBPROCESS_ERROR';
  let metricas: ReturnType<typeof extrairMetricas> = null; let bruto = '';
  try { bruto = await lerSeguro(p.raiz, resumoRel, true, 1048576); metricas = extrairMetricas(JSON.parse(bruto)); } catch { /* sem resumo: fica só o exit code */ }
  // Exit 99 é "limiar do k6 ultrapassado" (falha de desempenho); outros códigos diferentes de 0 são falha de execução do script.
  const limiarFalhou = r.exitCode === 99;
  const casos = (metricas?.limiares ?? []).slice(0, 200).map((l, i) => ({ id: `${l.metrica} ${l.expressao}`.slice(0, 100) || `limiar-${i}`, status: (l.ok ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL', evidence: l.ok ? 'Limiar atendido.' : 'Limiar ultrapassado.' }));
  e.cases = casos; e.evidenceScope = casos.length ? 'individual' : 'round';
  if (bruto) e.resultArtifact = { path: resumoRel, sha256: hash(bruto), trust: 'Resumo exportado pelo k6 oficial; valores são do runner, não julgamento independente.', metrics: metricas };
  e.status = limiarFalhou ? 'FAIL' : classificar(r.exitCode, bloqueio, casos);
  e.reason = bloqueio ?? (limiarFalhou ? 'Limiar de desempenho do k6 ultrapassado (exit 99).' : r.exitCode === 0 ? 'k6 terminou com exit code 0; limiares conforme resumo.' : `k6 terminou com exit code ${r.exitCode}: falha de execução do script ou do ambiente.`);
  e.logSha256 = hash(e.stdout + '\n' + e.stderr); e.endedAt = new Date().toISOString();
  return await salvarEvidencia(p, e);
}
