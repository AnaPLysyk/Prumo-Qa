/** Executa o teste k6 autorizado, sem shell e com teto de tempo, e grava a evidência. */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { capacidadeDoK6 } from './capacidadeDoK6.js';
import { escopoDoK6 } from './escopoDoK6.js';
import { metricasDoK6 } from './metricasDoK6.js';
import { ConfigK6, ExecutavelK6 } from '../tipos/k6.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { salvarEvidencia } from '../../evidencias/banco/salvarEvidencia.js';
import { classificarResultado } from '../../evidencias/regras/classificarResultado.js';
import { Evidencia } from '../../evidencias/tipos/evidencia.js';
import { solicitarAprovacao } from '../../execucoes/aprovacao/solicitarAprovacao.js';
import { Delegada } from '../../execucoes/tipos/execucao.js';

export async function executarK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6 | null, solicitar: boolean, delegada?: Delegada, solicitarFn: typeof solicitarAprovacao = solicitarAprovacao, signal?: AbortSignal) {
  const jobId = randomUUID(); const inicio = new Date().toISOString(); const capability = capacidadeDoK6(c);
  const e: Evidencia = { kind: 'execution_evidence', jobId, projectId: p.manifesto.id, rootHash: hash(p.raiz), manifestHash: p.manifestoHash, scopeHash: null, capability, status: 'BLOCKED', reason: '', startedAt: inicio, endedAt: inicio, executed: false, exitCode: null, command: null, approval: null, cases: [], stdout: '', stderr: '', logSha256: hash('\n'), resultArtifact: null, evidenceScope: 'round', provenance: 'local-process' };
  let args: string[]; let resumoAbs = ''; let resumoRel = ''; let timeoutMs = 0;
  try {
    if (!exe) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH. Instale o k6 oficial (grafana/k6) e reabra o Prumo.');
    const atual = await carregarProjeto(p.raiz); if (atual.manifestoHash !== p.manifestoHash) throw new ErroQa('SCOPE_CHANGED', 'Manifesto mudou; recarregue o contexto.');
    const esc = await escopoDoK6(p, c, ambiente, exe); e.scopeHash = esc.scopeHash; e.command = JSON.parse(esc.command);
    const scriptAbs = await caminhoSeguro(p.raiz, c.script);
    if (!solicitar && !delegada) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Execução de k6 exige aprovação humana nativa ou autorização agendada vigente.');
    let aprovado;
    if (!solicitar && delegada) { aprovado = await delegada({ scopeHash: esc.scopeHash, capability, command: esc.command }); if (!aprovado) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Nenhuma autorização agendada válida cobre este escopo de k6.'); }
    else try { aprovado = await solicitarFn({ projectId: p.manifesto.id, root: p.raiz, capability, scopeHash: esc.scopeHash, command: esc.command, expiresAt: new Date(Date.now() + 120000).toISOString() }); } catch (err) { throw new ErroQa('HUMAN_APPROVAL_REQUIRED', (err as Error).message); }
    if (!aprovado || aprovado.scopeHash !== esc.scopeHash) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Consentimento cancelado, indisponível ou inválido.');
    e.approval = aprovado;
    const depois = await escopoDoK6(await carregarProjeto(p.raiz), c, ambiente, exe); if (depois.scopeHash !== esc.scopeHash) throw new ErroQa('SCOPE_CHANGED', 'Script ou projeto mudou após a aprovação.');
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
  let metricas: ReturnType<typeof metricasDoK6> = null; let bruto = '';
  try { bruto = await lerSeguro(p.raiz, resumoRel, true, 1048576); metricas = metricasDoK6(JSON.parse(bruto)); } catch { /* sem resumo: fica só o exit code */ }
  // Exit 99 é "limiar do k6 ultrapassado" (falha de desempenho); outros códigos diferentes de 0 são falha de execução do script.
  const limiarFalhou = r.exitCode === 99;
  const casos = (metricas?.limiares ?? []).slice(0, 200).map((l, i) => ({ id: `${l.metrica} ${l.expressao}`.slice(0, 100) || `limiar-${i}`, status: (l.ok ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL', evidence: l.ok ? 'Limiar atendido.' : 'Limiar ultrapassado.' }));
  e.cases = casos; e.evidenceScope = casos.length ? 'individual' : 'round';
  if (bruto) e.resultArtifact = { path: resumoRel, sha256: hash(bruto), trust: 'Resumo exportado pelo k6 oficial; valores são do runner, não julgamento independente.', metrics: metricas };
  e.status = limiarFalhou ? 'FAIL' : classificarResultado(r.exitCode, bloqueio, casos);
  e.reason = bloqueio ?? (limiarFalhou ? 'Limiar de desempenho do k6 ultrapassado (exit 99).' : r.exitCode === 0 ? 'k6 terminou com exit code 0; limiares conforme resumo.' : `k6 terminou com exit code ${r.exitCode}: falha de execução do script ou do ambiente.`);
  e.logSha256 = hash(e.stdout + '\n' + e.stderr); e.endedAt = new Date().toISOString();
  return await salvarEvidencia(p, e);
}
