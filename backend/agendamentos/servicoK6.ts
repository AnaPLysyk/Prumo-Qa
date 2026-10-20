/** Lógica e contratos de agendamentos: operações relacionadas no mesmo módulo. */
import { ConfigK6, ExecutavelK6, LIMITE_DURACAO_S, LIMITE_USUARIOS } from "./tipos/k6.js";
import { promises as fs } from "node:fs";
import { ErroQa } from "../compartilhado/erros.js";
import { hash } from "../compartilhado/seguranca/hash.js";
import { lerSeguro } from "../compartilhado/seguranca/lerSeguro.js";
import { Projeto } from "../compartilhado/projeto/contratos.js";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { carregarProjeto } from "../compartilhado/projeto/carregarProjeto.js";
import { caminhoSeguro } from "../compartilhado/seguranca/caminhoSeguro.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { salvarEvidencia } from "../testes/banco/evidencias.js";
import { classificarResultado } from "../testes/regras/executarValidacao.js";
import { Evidencia } from "../testes/tipos/evidencia.js";
import { solicitarAprovacao } from "../testes/servicoAprovacao.js";
import { criarEvidenciaInicial } from "../testes/regras/executarValidacao.js";
import { Delegada } from "../testes/tipos/autorizacoes.js";

export const capacidadeDoK6 = (c: ConfigK6) => ('k6:' + c.script.replaceAll('\\', '/')).slice(0, 80);

/** Escopo estável: raiz, manifesto, script (hash), parâmetros, destino, ambiente e executável (caminho+tamanho). */
export async function escopoDoK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6) {
  validarLimitesDoK6(c); const origem = validarAlvoDoK6(c.alvo, ambiente);
  if (p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED', 'Projeto autorizado estritamente para leitura.');
  if (!/\.m?js$/i.test(c.script)) throw new ErroQa('K6_SCRIPT_INVALID', 'O script do k6 deve ser .js ou .mjs.');
  const fonte = await lerSeguro(p.raiz, c.script, false, 262144);
  const st = await fs.stat(exe.executable);
  const scopeHash = hash(JSON.stringify({ root: p.raiz, manifest: p.manifestoHash, script: c.script, scriptSha: hash(fonte), alvo: origem, usuarios: c.usuarios, duracao: c.duracaoSegundos, ambiente, exe: { p: exe.executable, size: st.size } }));
  return { scopeHash, command: JSON.stringify({ tool: 'k6', script: c.script, alvo: origem, usuarios: c.usuarios, duracaoSegundos: c.duracaoSegundos, ambiente }) };
}

/** Extrai do resumo do k6 as métricas principais (requisições, falhas, tempos). */

function metricasDoK6(resumo: unknown) {
  const m = (resumo as { metrics?: Record<string, Record<string, unknown>> } | null)?.metrics; if (!m) return null;
  const pega = (nome: string, campos: string[]) => Object.fromEntries(campos.filter(c => typeof m[nome]?.[c] === 'number').map(c => [c, m[nome]![c]]));
  const limiares: { metrica: string; expressao: string; ok: boolean }[] = [];
  for (const [nome, v] of Object.entries(m)) { const t = v?.thresholds as Record<string, unknown> | undefined; if (t) for (const [expr, val] of Object.entries(t)) if (val && typeof val === 'object' && typeof (val as { ok?: unknown }).ok === 'boolean') limiares.push({ metrica: nome, expressao: expr, ok: (val as { ok: boolean }).ok }); }
  return { http_reqs: pega('http_reqs', ['count', 'rate']), http_req_failed: pega('http_req_failed', ['value', 'passes', 'fails']), http_req_duration: pega('http_req_duration', ['avg', 'med', 'p(90)', 'p(95)', 'max']), iterations: pega('iterations', ['count']), limiares };
}

/** O que fica pronto depois das conferências e da aprovação: os argumentos, o arquivo de resumo e o tempo máximo. */
type K6Preparado = { args: string[]; resumoRel: string; timeoutMs: number };

/** Como o processo do k6 terminou: código de saída, erro ao iniciar, motivo da interrupção e saídas capturadas. */
type ProcessoDoK6 = { exitCode: number | null; error?: string; bloqueio?: string; stdout: string; stderr: string };

export async function executarK6(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6 | null, solicitar: boolean, delegada?: Delegada, solicitarFn: typeof solicitarAprovacao = solicitarAprovacao, signal?: AbortSignal) {
  const e = criarEvidenciaInicial(p, capacidadeDoK6(c), randomUUID(), new Date().toISOString());
  // 1) Conferências e aprovação. Sem k6 instalado: NOT_RUN; outras recusas: BLOCKED.
  let x: K6Preparado;
  try { x = await prepararK6Aprovado(p, c, ambiente, exe, solicitar, e, delegada, solicitarFn); }
  catch (err) {
    e.reason = (err instanceof ErroQa ? err.codigo : 'PRECONDITION_MISSING') + ': ' + mascarar((err as Error).message);
    e.status = err instanceof ErroQa && err.codigo === 'RUNTIME_MISSING' ? 'NOT_RUN' : 'BLOCKED';
    e.endedAt = new Date().toISOString(); return await salvarEvidencia(p, e);
  }
  // 2) Rodar com limites e 3) transformar o resumo em casos por limiar.
  const processo = await rodarK6Limitado(exe!, x.args, p.raiz, x.timeoutMs, e, signal);
  await registrarResultadoDoK6(p, e, processo, x.resumoRel);
  return await salvarEvidencia(p, e);
}

/** Antes do k6: confere executável, contrato e escopo (script, destino, limites), obtém a aprovação humana ou a autorização prévia e monta os argumentos. */
async function prepararK6Aprovado(p: Projeto, c: ConfigK6, ambiente: string, exe: ExecutavelK6 | null, solicitar: boolean, e: Evidencia, delegada?: Delegada, solicitarFn: typeof solicitarAprovacao = solicitarAprovacao): Promise<K6Preparado> {
  if (!exe) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH. Instale o k6 oficial (grafana/k6) e reabra o Prumo.');
  const atual = await carregarProjeto(p.raiz); if (atual.manifestoHash !== p.manifestoHash) throw new ErroQa('SCOPE_CHANGED', 'Manifesto mudou; recarregue o contexto.');
  const esc = await escopoDoK6(p, c, ambiente, exe); e.scopeHash = esc.scopeHash; e.command = JSON.parse(esc.command);
  const scriptAbs = await caminhoSeguro(p.raiz, c.script);
  if (!solicitar && !delegada) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Execução de k6 exige aprovação humana nativa ou autorização agendada vigente.');
  let aprovado;
  if (!solicitar && delegada) { aprovado = await delegada({ scopeHash: esc.scopeHash, capability: e.capability, command: esc.command }); if (!aprovado) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Nenhuma autorização agendada válida cobre este escopo de k6.'); }
  else try { aprovado = await solicitarFn({ projectId: p.manifesto.id, root: p.raiz, capability: e.capability, scopeHash: esc.scopeHash, command: esc.command, expiresAt: new Date(Date.now() + 120000).toISOString() }); } catch (err) { throw new ErroQa('HUMAN_APPROVAL_REQUIRED', (err as Error).message); }
  if (!aprovado || aprovado.scopeHash !== esc.scopeHash) throw new ErroQa('HUMAN_APPROVAL_REQUIRED', 'Consentimento cancelado, indisponível ou inválido.');
  e.approval = aprovado;
  const depois = await escopoDoK6(await carregarProjeto(p.raiz), c, ambiente, exe); if (depois.scopeHash !== esc.scopeHash) throw new ErroQa('SCOPE_CHANGED', 'Script ou projeto mudou após a aprovação.');
  const resumoRel = `.prumo/resultados/${e.jobId}-k6.json`; await fs.mkdir(await caminhoSeguro(p.raiz, '.prumo/resultados', true, true), { recursive: true }); const resumoAbs = await caminhoSeguro(p.raiz, resumoRel, true, true);
  const args = [...(exe.argsIniciais ?? []), 'run', '--quiet', '--no-usage-report', '--vus', String(c.usuarios), '--duration', `${c.duracaoSegundos}s`, '--summary-export', resumoAbs, '-e', `TARGET_URL=${new URL(c.alvo).origin}`, scriptAbs];
  return { args, resumoRel, timeoutMs: (c.duracaoSegundos + 60) * 1000 };
}

/** Roda o k6 sem shell, com ambiente mínimo, tempo máximo e saída limitada; ao estourar ou ser cancelado, encerra o k6 e seus filhos. */
async function rodarK6Limitado(exe: ExecutavelK6, args: string[], pasta: string, timeoutMs: number, e: Evidencia, signal?: AbortSignal): Promise<ProcessoDoK6> {
  const sistema = process.env.SystemRoot; const env: NodeJS.ProcessEnv = { K6_NO_USAGE_REPORT: 'true' };
  if (sistema) { env.SystemRoot = sistema; env.WINDIR = sistema; } for (const n of ['TEMP', 'TMP', 'TMPDIR']) if (process.env[n]) env[n] = process.env[n];
  const max = 65536; const saida: Buffer[] = []; const erro: Buffer[] = []; let tam = 0; let bloqueio: string | undefined;
  const r = await new Promise<{ exitCode: number | null; error?: string }>(resolve => {
    const filho = spawn(exe.executable, args, { cwd: pasta, shell: false, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const parar = (m: string) => { if (!bloqueio) { bloqueio = m; filho.kill(); if (process.platform === 'win32' && sistema && filho.pid) spawn(path.join(sistema, 'System32', 'taskkill.exe'), ['/PID', String(filho.pid), '/T', '/F'], { windowsHide: true, shell: false, stdio: 'ignore' }); } };
    const t = setTimeout(() => parar('TIMEOUT'), timeoutMs);
    if (signal) { if (signal.aborted) parar('CANCELLED'); else signal.addEventListener('abort', () => parar('CANCELLED'), { once: true }); }
    const cap = (a: Buffer[], b: Buffer) => { const s = max - tam; if (s > 0) a.push(b.subarray(0, s)); tam += b.length; if (tam > max * 4) parar('OUTPUT_LIMIT'); };
    filho.stdout.on('data', b => cap(saida, b)); filho.stderr.on('data', b => cap(erro, b)); filho.on('spawn', () => { e.executed = true; });
    filho.on('error', er => { clearTimeout(t); resolve({ exitCode: null, error: er.message }); }); filho.on('close', (code, sinal) => { clearTimeout(t); if (sinal && !bloqueio) bloqueio = 'PROCESS_SIGNAL'; resolve({ exitCode: code }); });
  });
  return { ...r, bloqueio, stdout: Buffer.concat(saida).toString(), stderr: Buffer.concat(erro).toString() };
}

/** Lê o resumo exportado pelo k6 e transforma cada limiar em caso PASS\/FAIL; exit 99 é limiar ultrapassado (FAIL), outro código é falha do script. */
async function registrarResultadoDoK6(p: Projeto, e: Evidencia, r: ProcessoDoK6, resumoRel: string) {
  e.stdout = mascarar(r.stdout); e.stderr = mascarar(r.stderr); e.exitCode = r.exitCode;
  const bloqueio = r.error ? 'SUBPROCESS_ERROR' : r.bloqueio;
  let metricas: ReturnType<typeof metricasDoK6> = null; let bruto = '';
  try { bruto = await lerSeguro(p.raiz, resumoRel, true, 1048576); metricas = metricasDoK6(JSON.parse(bruto)); } catch { /* sem resumo: fica só o exit code */ }
  const limiarFalhou = r.exitCode === 99;
  const casos = (metricas?.limiares ?? []).slice(0, 200).map((l, i) => ({ id: `${l.metrica} ${l.expressao}`.slice(0, 100) || `limiar-${i}`, status: (l.ok ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL', evidence: l.ok ? 'Limiar atendido.' : 'Limiar ultrapassado.' }));
  e.cases = casos; e.evidenceScope = casos.length ? 'individual' : 'round';
  if (bruto) e.resultArtifact = { path: resumoRel, sha256: hash(bruto), trust: 'Resumo exportado pelo k6 oficial; valores são do runner, não julgamento independente.', metrics: metricas };
  e.status = limiarFalhou ? 'FAIL' : classificarResultado(r.exitCode, bloqueio, casos);
  e.reason = bloqueio ?? (limiarFalhou ? 'Limiar de desempenho do k6 ultrapassado (exit 99).' : r.exitCode === 0 ? 'k6 terminou com exit code 0; limiares conforme resumo.' : `k6 terminou com exit code ${r.exitCode}: falha de execução do script ou do ambiente.`);
  e.logSha256 = hash(e.stdout + '\n' + e.stderr); e.endedAt = new Date().toISOString();
}

export async function localizarK6(path_ = process.env.PATH ?? ''): Promise<string | null> {
  const nomes = process.platform === 'win32' ? ['k6.exe'] : ['k6'];
  for (const pasta of path_.split(path.delimiter)) {
    if (!pasta || !path.isAbsolute(pasta)) continue;
    for (const n of nomes) { const c = path.join(pasta, n); try { const st = await fs.stat(c); if (st.isFile()) return c; } catch { /* próximo */ } }
  }
  return null;
}

/** Diz se um endereço é deste próprio computador (localhost, 127.x, ::1). */

const enderecoLocal = (h: string) => h === 'localhost' || h === '::1' || h === '[::1]' || /^127\./.test(h);

export function validarAlvoDoK6(alvo: string, ambiente: string) {
  let u: URL; try { u = new URL(alvo); } catch { throw new ErroQa('K6_TARGET_INVALID', 'Destino inválido.'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new ErroQa('K6_TARGET_INVALID', 'Destino deve ser http(s) sem credenciais na URL.');
  if (ambiente === 'producao') throw new ErroQa('POLICY_BLOCKED', 'Teste de carga em produção está bloqueado por padrão nesta versão.');
  if (ambiente === 'local' && !enderecoLocal(u.hostname)) throw new ErroQa('K6_TARGET_NOT_LOCAL', 'Ambiente "local" só aceita localhost/127.0.0.1.');
  return u.origin;
}

export function validarLimitesDoK6(c: ConfigK6) {
  if (!Number.isInteger(c.usuarios) || c.usuarios < 1 || c.usuarios > LIMITE_USUARIOS) throw new ErroQa('K6_LIMIT', `Usuários virtuais entre 1 e ${LIMITE_USUARIOS}.`);
  if (!Number.isInteger(c.duracaoSegundos) || c.duracaoSegundos < 1 || c.duracaoSegundos > LIMITE_DURACAO_S) throw new ErroQa('K6_LIMIT', `Duração entre 1 e ${LIMITE_DURACAO_S} segundos.`);
}
