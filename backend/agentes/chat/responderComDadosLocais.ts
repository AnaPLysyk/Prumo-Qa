/** Monta a resposta do agente com os dados locais do projeto (sem IA), com fontes e fatos usados. */
import { listarRotinas } from '../../agendamentos/banco/listarRotinas.js';
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { classificarFalha } from './classificarFalha.js';
import { Coleta, GUIA_MANUAL, guia } from '../tipos/chat.js';
import { AgenteChat } from '../tipos/persona.js';
import { dataEmPortugues } from '../../compartilhado/texto/dataEmPortugues.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { listarContextosDaPasta } from '../../contextos/regras/listarContextosDaPasta.js';
import { listarHistoricoDoProjeto } from '../../historico/regras/listarHistoricoDoProjeto.js';
import { perguntarAoAssistenteLocal } from '../../inicio/regras/perguntarAoAssistenteLocal.js';
import { situacaoDoProjeto } from '../../inicio/regras/situacaoDoProjeto.js';
import { Fonte } from '../../inicio/tipos/assistenteLocal.js';
import { metricasDasExecucoes } from '../../metricas/regras/metricasDasExecucoes.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { listarRunsLocais } from '../../testes/banco/listarRunsLocais.js';
import { catalogoDeTestes } from '../../testes/regras/catalogoDeTestes.js';
import { listarPropostas } from '../../tickets/banco/listarPropostas.js';

export async function responderComDadosLocais(agente: AgenteChat, pergunta: string, espacoId: string | null, base?: string): Promise<Coleta> {
  const p = semAcentos(pergunta); const linhas: string[] = []; const fontes: Fonte[] = []; const fatos: string[] = []; let generico = false;
  const fonte = (f: Fonte) => { if (!fontes.some((x) => x.aba === f.aba)) fontes.push(f); };
  const e = espacoId ? (() => { try { return obterEspaco(espacoId, base); } catch { return null; } })() : null;
  const trabalhos = listarTrabalhos(base).filter((t) => !espacoId || t.espacoId === espacoId);
  const semProjeto = () => { linhas.push('Selecione um projeto para eu consultar os dados dele.'); fonte({ rotulo: 'Projetos', aba: 'projetos' }); };
  switch (agente.id) {
    case 'orquestrador': {
      const g = guia.filter(([ks]) => ks.some((k) => p.includes(k)));
      if (g.length) for (const [, texto, f] of g.slice(0, 2)) { linhas.push(texto); fonte(f); }
      else { generico = true; linhas.push(...situacaoDoProjeto(espacoId, base)); linhas.push('Posso consultar testes, falhas, execuções, contextos, histórico e métricas, e explicar técnicas de teste. Pergunte, ou chame um agente pelo nome.'); }
      break;
    }
    case 'qa-geral': {
      if (/manua/.test(p)) { linhas.push(GUIA_MANUAL); fonte({ rotulo: 'Testes', aba: 'testes' }); }
      linhas.push(...situacaoDoProjeto(espacoId, base));
      if (e) { const ps = listarPropostas(e.id, base).filter((x) => x.estado !== 'DESCARTADA').slice(0, 4); if (ps.length) { linhas.push(`Propostas abertas: ${ps.map((x) => `"${x.titulo}" (${x.estado})`).join('; ')}.`); fonte({ rotulo: 'Testes', aba: 'testes' }); } fatos.push(`propostas=${ps.length}`); }
      break;
    }
    case 'requisitos': {
      if (!e) { semProjeto(); break; }
      const r = await perguntarAoAssistenteLocal(espacoId, pergunta, base); const ctx = r.linhas.filter((l) => l.startsWith('Contextos aprovados'));
      if (ctx.length) { linhas.push(...ctx); fonte({ rotulo: 'Contextos', aba: 'contextos' }); }
      else {
        try { const todos = (await listarContextosDaPasta(e.raizContextos, {})).contextos; const aprov = todos.filter((c) => c.estado === 'APROVADO');
          linhas.push(aprov.length ? `${aprov.length} contexto(s) aprovado(s): ${aprov.slice(0, 5).map((c) => `${c.titulo} (${c.tipo})`).join('; ')}.` : 'Ainda não há contextos aprovados neste projeto.'); fatos.push(`contextosAprovados=${aprov.length}`); fonte({ rotulo: 'Contextos', aba: 'contextos' });
        } catch { linhas.push('Não consegui ler os contextos deste projeto.'); }
      }
      break;
    }
    case 'playwright': case 'api-rest': case 'acessibilidade': {
      if (!e) { semProjeto(); break; }
      if (!e.pastaLocal) { linhas.push('Vincule a pasta do repositório ao projeto para eu ler os testes.'); fonte({ rotulo: 'Testes', aba: 'testes' }); break; }
      const tipos: Record<string, string[]> = { playwright: ['funcional', 'smoke', 'regressao'], 'api-rest': ['integracao'], acessibilidade: ['acessibilidade'] };
      try {
        const c = catalogoDeTestes(e.pastaLocal); const area = tipos[agente.id] ?? []; const meus = c.features.flatMap((f) => f.testes.filter((t) => area.includes(t.tipo)).map((t) => ({ f: f.nome, t })));
        linhas.push(meus.length ? `${meus.length} teste(s) da minha área no repositório (de ${c.testes} no total). Exemplos: ${meus.slice(0, 3).map((x) => `"${x.t.titulo}" (${x.f})`).join('; ')}.` : `Não encontrei testes da minha área no repositório (${c.testes} testes no total).`);
        fatos.push(`testesArea=${meus.length}`, `testesTotal=${c.testes}`); fonte({ rotulo: 'Testes', aba: 'testes' });
      } catch { linhas.push('Não consegui ler o catálogo de testes do repositório.'); }
      break;
    }
    case 'investigacao-bugs': {
      const f = trabalhos.filter((t) => t.resultado?.status === 'FAIL').sort((a, b) => (b.terminadoEm ?? '').localeCompare(a.terminadoEm ?? '')).slice(0, 3);
      linhas.push(f.length ? `Últimas falhas: ${f.map((t) => `${t.capability ?? t.tipo}${t.ticket ? ' (' + t.ticket + ')' : ''} em ${dataEmPortugues(t.terminadoEm)}`).join('; ')}.` : 'Não encontrei execuções com FAIL registradas.');
      if (f.length) {
        fonte({ rotulo: 'Execuções', aba: 'execucoes' }); const cls = f.map((t) => ({ t, c: classificarFalha(`${t.resultado?.motivo ?? ''} ${t.resultado?.detalhes ?? ''}`) }));
        if (/classific|causa|por que|porque|motivo|hipotes/.test(p)) for (const { t, c } of cls) linhas.push(`Hipótese para ${t.capability ?? t.tipo}${t.ticket ? ' (' + t.ticket + ')' : ''}: ${c.rotulo}, porque ${c.motivo}.`);
        else { const conta = new Map<string, number>(); for (const { c } of cls) conta.set(c.rotulo, (conta.get(c.rotulo) ?? 0) + 1); linhas.push(`Hipóteses, ainda não confirmadas: ${[...conta].map(([r, n]) => `${n} ${r}`).join('; ')}. Reproduzir antes de classificar.`); }
        fatos.push(...cls.map(({ c }) => `hipotese=${c.classe}`));
      }
      fatos.push(`falhas=${f.length}`);
      if (e) { try { const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 200 }); const prob = h.activities.filter((a) => ['FAIL', 'ERROR', 'BLOCKED'].includes(a.state)).slice(0, 3);
        if (prob.length) { linhas.push(`Operações com problema no núcleo: ${prob.map((a) => `${a.tool} ${a.state}${a.summary.code ? ' (' + a.summary.code + ')' : ''}`).join('; ')}.`); fonte({ rotulo: 'Logs', aba: 'logs' }); } fatos.push(`operacoesProblema=${prob.length}`);
      } catch { /* projeto sem histórico legível */ } }
      if (e) { const bugs = listarPropostas(e.id, base).filter((x) => x.estado !== 'DESCARTADA' && /bug/i.test(String((x as { tipo?: string }).tipo ?? ''))); if (bugs.length) linhas.push(`${bugs.length} proposta(s) de bug em aberto.`); }
      break;
    }
    case 'regressao': {
      const m = metricasDasExecucoes(espacoId ?? undefined, base);
      linhas.push(m.execucoes ? `${m.execucoes} execução(ões) registrada(s): ${m.pass} PASS, ${m.fail} FAIL, ${m.blocked} BLOCKED, ${m.notRun} NOT_RUN.` : 'Ainda não há execuções registradas.');
      if (m.ultimaExecucao) linhas.push(`Última execução: ${m.ultimaExecucao.resultado} em ${dataEmPortugues(m.ultimaExecucao.em)}.`);
      const rot = listarRotinas(base).filter((r) => !espacoId || r.espacoId === espacoId);
      linhas.push(m.proximaExecucao ? `Próxima rotina: ${dataEmPortugues(m.proximaExecucao)} (${m.rotinasAtivas} ativa(s)).` : rot.length ? 'Nenhuma rotina ativa agendada.' : 'Nenhuma rotina cadastrada.');
      fatos.push(`execucoes=${m.execucoes}`, `pass=${m.pass}`, `fail=${m.fail}`, `rotinas=${rot.length}`); fonte({ rotulo: 'Execuções', aba: 'execucoes' }); fonte({ rotulo: 'Agendamentos', aba: 'agenda' });
      if (e) { const r = listarRunsLocais(e.id, base).slice(0, 3); if (r.length) linhas.push(`Features/execuções: ${r.map((x) => `"${x.titulo}" (${x.estado})`).join('; ')}.`); }
      break;
    }
    case 'monitoramento': {
      if (!e) { semProjeto(); break; }
      try { const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 50 }); const rec = h.activities.slice(0, 4);
        linhas.push(rec.length ? `Atividades recentes: ${rec.map((a) => `${a.tool} ${a.state} em ${dataEmPortugues(a.at)}`).join('; ')}.` : 'Nenhuma atividade registrada ainda.'); fatos.push(`atividades=${h.activities.length}`); fonte({ rotulo: 'Histórico', aba: 'historico' });
      } catch { linhas.push('Não consegui ler o histórico deste projeto.'); }
      const m = metricasDasExecucoes(espacoId ?? undefined, base); if (m.ultimaExecucao) linhas.push(`Última execução registrada: ${m.ultimaExecucao.resultado} em ${dataEmPortugues(m.ultimaExecucao.em)}.`);
      fonte({ rotulo: 'Métricas', aba: 'metricas' });
      break;
    }
  }
  const vazio = !linhas.length; if (vazio) linhas.push('Não encontrei nada sobre isso nos dados locais deste projeto.');
  return { linhas, fontes, fatos, generico, vazio };
}
