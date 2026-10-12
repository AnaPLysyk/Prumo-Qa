import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { listarRotinas, obterRotina, slotsVencidos, marcarSlot, pausaGlobal, proximoSlot, type Rotina } from './agenda.js';
import { enfileirar, registrarPerdido, reivindicar, concluir, falharInfra, batimento, recuperarInterrompidos, listarTrabalhos, obterTrabalho, type Trabalho, type ResultadoTrabalho } from './fila.js';
import { obterEspaco } from './espacos.js';
import { carregarProjeto, ErroQa, type Projeto } from './projeto.js';
import { executarValidacao } from './execucao.js';
import { executarK6, localizarK6, capabilityK6, type ExecutavelK6 } from './k6.js';
import { delegadaPara } from './autorizacoes.js';
import { ErroServico } from './httpServicos.js';
import { publicar, elegivelParaPublicar, retentavel, type PublicadorJira } from './jiraComentario.js';
import { definirJira } from './fila.js';
import { executarRunLocal, publicarRunLocal, obterRunLocal } from './fluxoQase.js';
import type { Executor } from './operacoesExternas.js';
import type { OperacaoServico } from './adaptadoresServicos.js';
import type { Evidencia } from './evidencias.js';

/**
 * Worker de rotinas (2.8): UM laço no processo principal do Electron (sem serviço do Windows, sem tarefa agendada).
 * Adaptado do worker/daemon do QA Orchestrator: agenda -> fila -> execução autorizada -> registro, com trava de instância
 * única, batimento, recuperação de interrompidos, pausa e parada controlada. Usa o MESMO núcleo de execução e autorização
 * das execuções manuais; não conhece Claude/Codex.
 */
export type TipoEvento = 'AGENDAMENTO_INICIADO' | 'EXECUCAO_CONCLUIDA' | 'EXECUCAO_FALHOU' | 'EXECUCAO_BLOQUEADA' | 'PUBLICACAO_JIRA_FALHOU' | 'WORKER_INTERROMPIDO';
export type EventoWorker = { tipo: TipoEvento; rotinaId: string; trabalhoId: string; titulo: string; detalhe: string; at: string };
export interface ServicosLeitura extends Partial<Executor> { consultar(espacoId: string, servico: 'jira' | 'github', operacao: OperacaoServico, pagina?: { limite?: number }, id?: string): Promise<{ dados: unknown }> }
export type DepsWorker = {
  base?: string; agora?: () => Date; servicos?: (ServicosLeitura & PublicadorJira) | null; intervaloMs?: number;
  aoEvento?: (e: EventoWorker) => void; localizarK6?: () => Promise<ExecutavelK6 | null>; heartbeatMs?: number;
  executar?: typeof executarValidacao; executarK6?: typeof executarK6; semTemporizador?: boolean;
};

// ---- Trava de instância única + batimento ----
const travaSchema = z.object({ instancia: z.string(), pid: z.number().int(), inicio: z.string().datetime(), batimento: z.string().datetime(), ativo: z.boolean() }).strict();
const lerTrava = (b?: string) => lerLocal('worker-trava.json', travaSchema.nullable(), null, b);
const vivo = (pid: number) => { try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM'; } };
export function estadoTrava(b?: string, agora = new Date()) {
  const t = lerTrava(b); if (!t || !t.ativo) return { vivo: false, pid: null as number | null, ultimoBatimento: t?.batimento ?? null };
  const fresco = agora.getTime() - Date.parse(t.batimento) < 60000 && vivo(t.pid);
  return { vivo: fresco, pid: t.pid, ultimoBatimento: t.batimento };
}

const estadoRot = z.object({ version: z.literal(1), itens: z.record(z.object({ jira: z.record(z.string()).optional(), github: z.string().optional() }).strict()) }).strict();
type EstadoRot = z.infer<typeof estadoRot>;
const lerEstadoRot = (b?: string): EstadoRot => lerLocal<EstadoRot>('agenda-estado.json', estadoRot, { version: 1, itens: {} }, b);
const gravarEstadoRot = (e: EstadoRot, b?: string) => gravarLocal('agenda-estado.json', estadoRot.parse(e), b);

const contar = (e: Pick<Evidencia, 'cases'>) => ({ pass: e.cases.filter(c => c.status === 'PASS').length, fail: e.cases.filter(c => c.status === 'FAIL').length, blocked: e.cases.filter(c => c.status === 'BLOCKED').length, notRun: e.cases.filter(c => c.status === 'NOT_RUN').length });
const prioridade = { FAIL: 4, BLOCKED: 3, NOT_RUN: 2, PASS: 1 } as const;
const falhasTexto = (cases: Evidencia['cases']) => cases.filter(c => c.status === 'FAIL').slice(0, 5).map(c => `${c.id}: ${c.evidence}`.slice(0, 300)).join('\n');

export class Worker {
  readonly instancia = randomUUID(); private temporizador: ReturnType<typeof setTimeout> | null = null; private ativo = false; private emTick = false;
  private abort = new AbortController(); private atual: Promise<void> | null = null; private ultimoErro: string | null = null; private emitidos = new Map<string, number>(); private processando = false;
  private readonly agora: () => Date; private readonly base?: string; private readonly intervalo: number;
  constructor(private readonly d: DepsWorker = {}) { this.base = d.base; this.agora = d.agora ?? (() => new Date()); this.intervalo = d.intervaloMs ?? 5000; }

  /** Assume a trava ou recusa. Dois workers sobre a mesma agenda nunca coexistem. */
  iniciar() {
    const agora = this.agora(); const t = lerTrava(this.base);
    if (t?.ativo && t.instancia !== this.instancia && agora.getTime() - Date.parse(t.batimento) < 60000 && vivo(t.pid) && t.pid !== process.pid) throw new Error('WORKER_ALREADY_RUNNING');
    if (this.ativo) return;
    this.abort = new AbortController(); this.ativo = true; this.gravarTrava(true);
    // Com a trava assumida, nenhum outro worker está vivo: todo EXECUTANDO que não é desta instância foi interrompido,
    // mesmo com batimento recente (queda e reabertura em menos de 2 min travariam a fila inteira). Só um trabalho ainda
    // em curso NESTE processo (parar() que esgotou a espera) mantém a tolerância por batimento.
    const recuperados = recuperarInterrompidos(this.base, agora, this.processando ? 120000 : 0);
    if (recuperados) this.emitir('WORKER_INTERROMPIDO', '', '', 'Execuções interrompidas recuperadas', `${recuperados} trabalho(s) estavam em andamento quando o Prumo foi encerrado; o histórico foi preservado.`);
    this.agendarProximo(0);
  }
  /** Parada controlada: aborta o filho em execução (árvore de processos), espera registrar e libera a trava. */
  async parar(esperaMs = 15000) {
    if (!this.ativo) return; this.ativo = false; if (this.temporizador) clearTimeout(this.temporizador); this.abort.abort();
    if (this.atual) await Promise.race([this.atual.catch(() => { /* já registrado */ }), new Promise(r => setTimeout(r, esperaMs).unref())]);
    this.gravarTrava(false);
  }
  get executando() { return this.ativo; }
  private gravarTrava(ativo: boolean) { const agora = this.agora().toISOString(); const antigo = lerTrava(this.base); gravarLocal('worker-trava.json', travaSchema.parse({ instancia: this.instancia, pid: process.pid, inicio: antigo?.instancia === this.instancia ? antigo.inicio : agora, batimento: agora, ativo }), this.base); }
  private agendarProximo(ms: number) { if (!this.ativo || this.d.semTemporizador) return; this.temporizador = setTimeout(() => { this.atual = this.tick().catch(e => { this.ultimoErro = (e as Error).message.slice(0, 120); }).finally(() => this.agendarProximo(this.intervalo)); }, ms); this.temporizador.unref?.(); }

  private emitir(tipo: TipoEvento, rotinaId: string, trabalhoId: string, titulo: string, detalhe: string) {
    const chave = `${tipo}|${rotinaId}|${detalhe.slice(0, 40)}`; const t = this.agora().getTime(); const ultimo = this.emitidos.get(chave);
    if (ultimo !== undefined && t - ultimo < 30 * 60000 && tipo !== 'AGENDAMENTO_INICIADO') return; // não repete o mesmo aviso a cada tentativa
    this.emitidos.set(chave, t); if (this.emitidos.size > 200) this.emitidos.delete(this.emitidos.keys().next().value!);
    try { this.d.aoEvento?.({ tipo, rotinaId, trabalhoId, titulo, detalhe, at: this.agora().toISOString() }); } catch { /* notificação nunca derruba o worker */ }
  }

  /** Uma passada: bate o coração, transforma slots vencidos em trabalhos, processa um trabalho e tenta publicações pendentes. */
  async tick() {
    if (this.emTick) return; this.emTick = true;
    try {
      const agora = this.agora(); if (this.ativo) this.gravarTrava(true);
      if (!pausaGlobal(this.base)) this.agendarVencidos(agora);
      if (this.ativo && !pausaGlobal(this.base)) { const pausadas = new Set(listarRotinas(this.base).filter(r => r.estado !== 'ATIVA').map(r => r.id)); const t = reivindicar(this.base, this.agora(), x => x.origem === 'AGENDA' && pausadas.has(x.rotinaId)); if (t) await this.processar(t); }
      if (this.ativo && !pausaGlobal(this.base)) await this.repetirPublicacoes();
    } finally { this.emTick = false; }
  }
  private agendarVencidos(agora: Date) {
    for (const r of listarRotinas(this.base)) {
      if (r.estado !== 'ATIVA') continue;
      for (const v of slotsVencidos(r, agora.getTime())) {
        const iso = new Date(v.slot).toISOString(); const n = { chave: `${r.id}@${iso}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: r.capability ?? (r.k6 ? capabilityK6(r.k6) : undefined), ambiente: r.ambiente, ticket: r.ticket, origem: 'AGENDA' as const, slot: iso };
        if (v.executar) {
          try { enfileirar(n, this.base, agora); } catch (e) { if ((e as Error).message === 'QUEUE_ALREADY_ACTIVE' || (e as Error).message === 'QUEUE_FULL') registrarPerdido(n, 'Pulado: a execução anterior desta rotina ainda estava ativa ou a fila estava cheia.', this.base, agora); else throw e; }
        } else registrarPerdido(n, v.motivo === 'SUBSTITUIDO' ? 'Horário substituído por um mais recente (política: executar uma vez).' : 'Horário perdido: o Prumo estava fechado, o computador desligado/suspenso ou o atraso passou da tolerância. Nada foi executado.', this.base, agora);
        marcarSlot(r.id, v.slot, this.base);
      }
    }
  }
  /** "Executar agora": cria um trabalho manual (aprovação humana nativa a cada execução de testes). */
  executarAgora(rotinaId: string) {
    const r = obterRotina(rotinaId, this.base); const agora = this.agora();
    return enfileirar({ chave: `${r.id}@manual-${randomUUID()}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: r.capability ?? (r.k6 ? capabilityK6(r.k6) : undefined), ambiente: r.ambiente, ticket: r.ticket, origem: 'MANUAL', slot: null }, this.base, agora).trabalho;
  }

  private async projeto(espacoId: string): Promise<Projeto> {
    const e = obterEspaco(espacoId, this.base); if (!e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Esta rotina executa testes e precisa de uma pasta de automação vinculada ao projeto Prumo.');
    return carregarProjeto(e.pastaLocal);
  }
  private resultadoDe(e: Evidencia & { evidencePath?: string }): ResultadoTrabalho {
    const c = contar(e); const f = falhasTexto(e.cases);
    return { status: e.status, motivo: e.reason.slice(0, 600), contagem: c, evidenciaId: e.jobId, ...(f ? { detalhes: f } : {}) };
  }

  private async processar(t: Trabalho) {
    const rotina = (() => { try { return obterRotina(t.rotinaId, this.base); } catch { return null; } })();
    const bat = setInterval(() => { try { batimento(t.id, this.base, this.agora()); } catch { /* trabalho removido */ } }, this.d.heartbeatMs ?? 30000); bat.unref?.();
    const nome = rotina?.nome ?? 'Rotina removida'; this.processando = true;
    this.emitir('AGENDAMENTO_INICIADO', t.rotinaId, t.id, nome, `Execução ${t.tipo} iniciada${t.origem === 'MANUAL' ? ' (manual)' : ''}.`);
    try {
      if (!rotina) { concluir(t.id, { status: 'NOT_RUN', motivo: 'A rotina foi excluída antes da execução.' }, this.base, this.agora()); return; }
      const resultado = await this.executarTrabalho(t, rotina);
      if (this.abort.signal.aborted && (resultado.status === 'BLOCKED' && /CANCELLED/.test(resultado.motivo))) {
        falharInfra(t.id, 'CANCELLED', 'Interrompido porque o Prumo foi encerrado durante a execução; a evidência parcial foi preservada.', false, this.base, this.agora()); this.emitir('EXECUCAO_BLOQUEADA', rotina.id, t.id, nome, 'Execução interrompida ao encerrar o Prumo.'); return;
      }
      const fim = concluir(t.id, resultado, this.base, this.agora());
      const evento: TipoEvento = resultado.status === 'FAIL' ? 'EXECUCAO_FALHOU' : resultado.status === 'BLOCKED' ? 'EXECUCAO_BLOQUEADA' : 'EXECUCAO_CONCLUIDA';
      this.emitir(evento, rotina.id, t.id, nome, `${resultado.status}: ${resultado.motivo}`.slice(0, 200));
      // O resultado já está gravado: uma falha ao publicar nunca pode reescrevê-lo como BLOCKED.
      try { await this.publicarSeAutorizado(fim, rotina); }
      catch (e) {
        const cod = e instanceof ErroServico ? e.codigo : e instanceof ErroQa ? e.codigo : /^([A-Z][A-Z0-9_]{2,63})\b/.exec((e as Error).message)?.[1] ?? 'PUBLICATION_ERROR';
        try { definirJira(t.id, { estado: retentavel(cod) ? 'PENDENTE' : 'FALHA', codigo: cod.slice(0, 80) }, this.base); } catch { /* registro do trabalho indisponível */ }
        this.emitir('PUBLICACAO_JIRA_FALHOU', rotina.id, t.id, nome, `Resultado preservado; comentário no Jira não publicado (${cod}).`);
      }
    } catch (e) {
      const cod = e instanceof ErroServico ? e.codigo : e instanceof ErroQa ? e.codigo : 'WORKER_ERROR';
      const infra = ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);
      if (infra) { falharInfra(t.id, cod, `Falha de infraestrutura: ${cod}`, true, this.base, this.agora()); this.emitir('EXECUCAO_FALHOU', t.rotinaId, t.id, nome, `Falha de infraestrutura (${cod}); nova tentativa automática se restar alguma.`); }
      else { concluir(t.id, { status: 'BLOCKED', motivo: `${cod}: ${(e as Error).message}`.slice(0, 600) }, this.base, this.agora()); this.emitir('EXECUCAO_BLOQUEADA', t.rotinaId, t.id, nome, `${cod}`); }
    } finally { clearInterval(bat); this.processando = false; }
  }

  private async executarTrabalho(t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
    const manual = t.origem === 'MANUAL'; const executar = this.d.executar ?? executarValidacao;
    switch (r.tipo) {
      case 'smoke': case 'regressao': {
        const p = await this.projeto(r.espacoId);
        const e = await executar(p, r.capability!, manual, manual ? undefined : delegadaPara(r.espacoId, r.ambiente, this.base, this.agora), this.abort.signal);
        return this.resultadoDe(e);
      }
      case 'validacao-ticket': {
        const esp = obterEspaco(r.espacoId, this.base);
        const caps = [...new Set(esp.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5);
        if (!caps.length) return { status: 'BLOCKED', motivo: `NO_VERIFIED_LINK: não há automação associada a ${r.ticket} nas relações declaradas do projeto. Nada foi executado.`, ticket: r.ticket };
        const p = await this.projeto(r.espacoId); const evs: Evidencia[] = [];
        for (const cap of caps) { if (this.abort.signal.aborted) break; evs.push(await executar(p, cap, manual, manual ? undefined : delegadaPara(r.espacoId, r.ambiente, this.base, this.agora), this.abort.signal)); }
        const pior = evs.reduce<keyof typeof prioridade>((a, e) => prioridade[e.status] > prioridade[a] ? e.status : a, 'PASS');
        const soma = evs.map(contar).reduce((a, c) => ({ pass: a.pass + c.pass, fail: a.fail + c.fail, blocked: a.blocked + c.blocked, notRun: a.notRun + c.notRun }), { pass: 0, fail: 0, blocked: 0, notRun: 0 });
        const f = falhasTexto(evs.flatMap(e => e.cases));
        return { status: evs.length ? pior : 'NOT_RUN', motivo: `${evs.length} automação(ões) associada(s) a ${r.ticket}: ${evs.map(e => `${e.capability}=${e.status}`).join(', ')}`.slice(0, 600), contagem: soma, evidenciaId: evs.at(-1)?.jobId, ticket: r.ticket, ...(f ? { detalhes: f } : {}) };
      }
      case 'k6': {
        const p = await this.projeto(r.espacoId); const exe = this.d.localizarK6 ? await this.d.localizarK6() : await localizarK6().then(c => c ? { executable: c } : null);
        const e = await (this.d.executarK6 ?? executarK6)(p, r.k6!, r.ambiente, exe, manual, manual ? undefined : delegadaPara(r.espacoId, r.ambiente, this.base, this.agora), undefined, this.abort.signal);
        return this.resultadoDe(e);
      }
      case 'run-qase': return this.runQase(t, r);
      case 'consulta-jira': return this.consultaJira(r);
      case 'analise-mudancas': return this.analiseMudancas(r);
    }
  }
  /** Executa as automações dos casos da run e tenta publicar. Publicar só ocorre com política de escrita vigente para a run; senão os resultados ficam locais. */
  private async runQase(t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
    const runLocal = obterRunLocal(r.runLocalId!, this.base); if (!runLocal.runIdRemoto) return { status: 'BLOCKED', motivo: 'RUN_NOT_CREATED: a run ainda não foi criada no Qase.' };
    const manual = t.origem === 'MANUAL'; const executor = this.d.servicos as unknown as Executor | null | undefined;
    const dep = { executor: executor ?? { comContexto: async () => { throw new ErroServico('SERVICE_UNAVAILABLE'); } }, base: this.base, agora: this.agora };
    await executarRunLocal(dep, runLocal.id, { executar: this.d.executar ?? executarValidacao, modo: manual ? 'MANUAL' : 'AGENDADO', delegada: (e, a) => delegadaPara(e, a, this.base, this.agora), signal: this.abort.signal });
    let pub = 'não houve resultado para publicar'; if (executor) { const p = await publicarRunLocal(dep, runLocal.id, { confirmado: false, origem: 'AGENDADO' }); pub = p.operacao?.estado === 'BLOQUEADA' ? 'publicação no Qase BLOQUEADA (sem política vigente para esta run); resultados mantidos localmente' : p.publicados ? `${p.publicados} resultado(s) publicado(s) no Qase` : pub; }
    const f = obterRunLocal(runLocal.id, this.base); const rs = f.casos.map(c => c.resultado?.status ?? 'NOT_RUN');
    const conta = { pass: rs.filter(x => x === 'PASS').length, fail: rs.filter(x => x === 'FAIL').length, blocked: rs.filter(x => x === 'BLOCKED').length, notRun: rs.filter(x => x === 'NOT_RUN').length };
    const status = conta.fail ? 'FAIL' : conta.blocked ? 'BLOCKED' : conta.pass ? 'PASS' : 'NOT_RUN';
    const detalhes = f.casos.filter(c => c.resultado?.status === 'FAIL').slice(0, 5).map(c => `${c.casoId}: ${c.resultado!.comentario}`.slice(0, 300)).join('\n');
    return { status, motivo: `Run "${f.titulo}" (Qase #${f.runIdRemoto}): ${conta.pass} PASS, ${conta.fail} FAIL, ${conta.blocked} BLOCKED, ${conta.notRun} NOT_RUN; ${pub}.`.slice(0, 600), contagem: conta, ...(detalhes ? { detalhes } : {}) };
  }
  private async consultaJira(r: Rotina): Promise<ResultadoTrabalho> {
    if (!this.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
    const res = await this.d.servicos.consultar(r.espacoId, 'jira', r.operacaoJira, { limite: 50 }, r.ticket);
    const lista = (Array.isArray(res.dados) ? res.dados : [res.dados]) as Record<string, unknown>[]; const atual: Record<string, string> = {};
    for (const i of lista.slice(0, 50)) { const f = (i.fields ?? {}) as Record<string, unknown>; if (typeof i.key === 'string') atual[i.key] = String(f.updated ?? ''); }
    const est = lerEstadoRot(this.base); const antes = est.itens[r.id]?.jira;
    const alterados = antes ? Object.keys(atual).filter(k => antes[k] !== atual[k]) : [];
    est.itens[r.id] = { ...est.itens[r.id], jira: atual }; gravarEstadoRot(est, this.base);
    return { status: 'INFO', motivo: antes ? `${Object.keys(atual).length} ticket(s) consultado(s); ${alterados.length} novo(s) ou alterado(s) desde a última consulta.` : `${Object.keys(atual).length} ticket(s) consultado(s); primeira consulta serve de referência.`, detalhes: alterados.slice(0, 20).join('\n') || undefined, ticket: r.ticket };
  }
  private async analiseMudancas(r: Rotina): Promise<ResultadoTrabalho> {
    if (!this.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
    const res = await this.d.servicos.consultar(r.espacoId, 'github', 'commits', { limite: 30 });
    const commits = (Array.isArray(res.dados) ? res.dados : []) as { sha?: string; commit?: { message?: string } }[];
    const est = lerEstadoRot(this.base); const visto = est.itens[r.id]?.github; const shas = commits.map(c => String(c.sha ?? '')).filter(s => /^[a-f0-9]{40}$/.test(s));
    if (!shas.length) return { status: 'INFO', motivo: 'Nenhum commit retornado pelo repositório vinculado.' };
    est.itens[r.id] = { ...est.itens[r.id], github: shas[0] }; gravarEstadoRot(est, this.base);
    if (!visto) return { status: 'INFO', motivo: `Primeira análise: referência registrada em ${shas[0]!.slice(0, 7)}. Nenhuma execução foi disparada.` };
    const novos = shas.indexOf(visto) < 0 ? shas.length : shas.indexOf(visto);
    return { status: 'INFO', motivo: novos ? `${novos}${shas.indexOf(visto) < 0 ? '+' : ''} commit(s) novo(s) desde ${visto.slice(0, 7)}. Considere executar a regressão; o Prumo não a disparou automaticamente.` : 'Sem commits novos desde a última análise.',
      detalhes: commits.slice(0, novos).map(c => `${String(c.sha).slice(0, 7)} ${String(c.commit?.message ?? '').split('\n')[0]}`.slice(0, 200)).join('\n') || undefined };
  }

  private async publicarSeAutorizado(t: Trabalho, r: Rotina) {
    if (!this.d.servicos) return; const pol = elegivelParaPublicar(t, this.base, this.agora());
    if (pol === 'NAO_APLICAVEL') return;
    if (pol === 'SEM_POLITICA') { definirJira(t.id, { estado: 'PREPARADO', codigo: 'PUBLISH_POLICY_MISSING' }, this.base); return; }
    const reg = await publicar(t.id, 'AGENDADO', this.d.servicos, this.base, false, this.agora());
    if (reg.estado === 'FALHA' || reg.estado === 'BLOQUEADO') this.emitir('PUBLICACAO_JIRA_FALHOU', r.id, t.id, r.nome, `Comentário no Jira não publicado (${reg.erro ?? 'erro'}); o registro local foi mantido.`);
  }
  /** Retenta publicações que falharam por rede/serviço (com o mesmo controle de idempotência). */
  private async repetirPublicacoes() {
    if (!this.d.servicos) return; const agora = this.agora();
    for (const t of listarTrabalhos(this.base)) {
      if (t.jira.estado !== 'PENDENTE' || !t.jira.codigo || !retentavel(t.jira.codigo)) continue;
      const fresco = obterTrabalho(t.id, this.base); const terminado = fresco.terminadoEm ? Date.parse(fresco.terminadoEm) : 0; if (agora.getTime() - terminado < 60000) continue;
      const reg = await publicar(t.id, 'AGENDADO', this.d.servicos, this.base, false, agora);
      if (reg.estado === 'FALHA' && reg.tentativas >= 3) definirJira(t.id, { estado: 'FALHA', codigo: reg.erro ?? 'JIRA_PUBLISH_FAILED' }, this.base);
    }
  }
  /** Estado para a interface e a bandeja. */
  estado() {
    const rot = listarRotinas(this.base); const trab = listarTrabalhos(this.base); const t = this.agora().getTime();
    const proximas = rot.filter(r => r.estado === 'ATIVA').map(r => proximoSlot(r, t)).filter((x): x is number => x !== null);
    return { executando: this.ativo, pausado: pausaGlobal(this.base), trava: estadoTrava(this.base, this.agora()), pendentes: trab.filter(x => x.estado === 'PENDENTE').length, emExecucao: trab.find(x => x.estado === 'EXECUTANDO')?.id ?? null,
      proximaExecucao: proximas.length ? new Date(Math.min(...proximas)).toISOString() : null, rotinasAtivas: rot.filter(r => r.estado === 'ATIVA').length, rotinasPausadas: rot.filter(r => r.estado === 'PAUSADA').length, ultimoErro: this.ultimoErro };
  }
}
