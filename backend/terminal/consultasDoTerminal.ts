/** consultasDoTerminal: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { createInterface } from "node:readline/promises";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { descreverAchados } from "../logs/regras/resumoDoDiario.js";
import { Evento } from "../logs/contratos.js";
import { Projeto } from "../compartilhado/projeto/contratos.js";
import { observar, consultarAtividades } from "../logs/regras/iniciarAtividade.js";
import { consultarEvidencias } from "../testes/banco/publicacoes.js";
import { calcularMetricas } from "../metricas/servico.js";
import { aplicarConexao, prepararConexao } from "../conexoes/ia/conectarIa.js";
import { setTimeout as esperar } from "node:timers/promises";
import { versaoDoPacote } from "../compartilhado/raizDoAplicativo.js";

// --- perguntarNoTerminal ---
export async function perguntarNoTerminal(pergunta:string) {
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try{return await rl.question(pergunta);}catch{return '';}finally{rl.close();}
}

// --- consultasDoTerminal ---
// --- consultasDoTerminal ---
// ── saidaDoTerminal ──
export const avisarHistoricoIncompleto = (registros: unknown[]) => {
  if (registros.length) {
    console.error('HISTORY_INCOMPLETE: registros inválidos/truncados excluídos; métricas são parciais.');
    process.exitCode = 3;
  }
};

export const imprimirJson = (valor: unknown) =>
  console.log(JSON.stringify(valor, null, 2));

/** Linha do diário, sempre com indicação de evidências e achados reais. */
export function linhaDaOperacao(evento: Evento) {
  const e = evento;
  return `${e.at} · ${e.tool} · ${e.origin}/${e.client} (identidade declarada) · ${e.phase === 'start' ? 'SEM TÉRMINO OBSERVADO' : e.state} · ${e.durationMs} ms
  ${e.summary.findings} achados · ${e.summary.recommendations} recomendações · ${e.summary.gaps} lacunas · ${e.summary.candidateRedundancies} redundâncias candidatas
  operação ${e.operationId}${e.summary.code ? ' · ' + e.summary.code : ''}${e.summary.evidenceJobId ? ' · evidência ' + e.summary.evidenceJobId + (e.summary.evidencePersisted === false ? ' (não persistida)' : '') : ''}${e.summary.types.length ? '\n  ' + descreverAchados(e) : ''}`;
}

export const textoSeguroNoTerminal = (texto: string) =>
  mascarar(texto).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');

// ── chamadaRegistrada ──
/** Erros ao registrar o diário não descartam a resposta da operação. */
const avisarFalhaDeRegistroNoTerminal = (fase: string, id: string): void => {
  console.error(
    `PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado. Confira diretório de dados, permissões e limites.`
  );
  if (!process.exitCode) process.exitCode = 3;
};

export const chamadaRegistrada = <T>(
  projeto: Projeto,
  ferramenta: string,
  entrada: unknown,
  executar: () => Promise<T>
) => observar(projeto, ferramenta, { origin: 'CLI' }, entrada, executar, {
  diagnostico: avisarFalhaDeRegistroNoTerminal
});

// ── consultasDoTerminal ──
/** Resume as últimas 20 atividades, sem apresentar um histórico parcial como completo. */
export function comandoAtividade(projeto: Projeto, json = false) {
  const historico = consultarAtividades(projeto);
  avisarHistoricoIncompleto(historico.problems);
  if (json) {
    imprimirJson(historico);
    return;
  }

  console.log(
    'ATIVIDADES · ' + textoSeguroNoTerminal(projeto.manifesto.name) +
    '\nHistórico: ' + historico.directory
  );
  console.log(
    historico.activities.length
      ? historico.activities.slice(-20).reverse().map(linhaDaOperacao).join('\n\n')
      : 'Não existem atividades registradas.'
  );
}

/** Consulta evidências somente através do canal registrado de leitura. */
export async function comandoEvidencias(projeto: Projeto, id?: string, json = false) {
  const resposta = await chamadaRegistrada(
    projeto,
    'consultar_evidencias',
    { jobId: id },
    () => consultarEvidencias(projeto, id)
  );
  if (json) {
    imprimirJson(resposta);
    return;
  }

  console.log('EVIDÊNCIAS · ' + textoSeguroNoTerminal(projeto.manifesto.name));
  console.log(
    resposta.results.length
      ? resposta.results.map(item =>
          item.endedAt + ' · ' + item.status + ' · ' + item.jobId +
          '\n  ' + textoSeguroNoTerminal(item.reason) +
          '\n  ' + item.evidencePath
        ).join('\n')
      : 'NOT_RUN · Nenhuma evidência para esta consulta.'
  );
}

/** Mostra métricas observadas pelo Prumo sem inventar dados de custo ou execução de IA. */
export function comandoMetricas(projeto: Projeto, json = false) {
  const metricas = calcularMetricas(consultarAtividades(projeto));
  avisarHistoricoIncompleto(metricas.problems);
  if (json) {
    imprimirJson(metricas);
    return;
  }

  console.log([
    'MÉTRICAS · ' + textoSeguroNoTerminal(projeto.manifesto.name),
    metricas.complete ? 'Histórico válido' : 'HISTÓRICO PARCIAL',
    'Operações: ' + metricas.totalOperations + ' · Chamadas MCP: ' + metricas.mcpCalls,
    'Contextos: ' + metricas.contextAnalyses + ' · Revisões: ' + metricas.coverageReviews,
    'Achados: ' + metricas.findings + ' · Recomendações: ' + metricas.recommendations,
    'Lacunas: ' + metricas.gaps + ' · Redundâncias candidatas: ' + metricas.candidateRedundancies,
    'Execuções solicitadas: ' + metricas.executionsRequested,
    'PASS: ' + metricas.executions.PASS +
      ' · FAIL: ' + metricas.executions.FAIL +
      ' · BLOCKED: ' + metricas.executions.BLOCKED +
      ' · NOT_RUN: ' + metricas.executions.NOT_RUN,
    'Erros: ' + metricas.errors + ' · Sem término observado: ' + metricas.unfinished,
    'Duração média: ' + (metricas.averageDurationMs === null
      ? 'indisponível' : metricas.averageDurationMs + ' ms'),
    'Última atividade: ' + (metricas.lastActivity ?? 'nenhuma'),
    'Tokens/custos: ' + metricas.providerMetrics,
    'Alterações aplicadas pela IA: não observadas pelo Prumo.'
  ].join('\n'));
}

// ── comandoConectar ──
export async function comandoConectar(p:Projeto,cliente:string,contrato?:string,json=false,interagir=true) {
  const plano=prepararConexao(p,cliente,contrato);
  if(json){imprimirJson(plano);return;}
  console.log(`CONEXÃO · ${cliente}\nProjeto validado: ${textoSeguroNoTerminal(p.manifesto.name)}\nRaiz: ${p.raiz}\nDestino: ${plano.destination}\nNome: ${plano.name}\nCliente ${plano.installed?'localizado':'não instalado'}\n\n${plano.command}\n\n${plano.notice}`);
  if(!interagir||!process.stdin.isTTY||!process.stdout.isTTY||!plano.installed||plano.manualOnly||cliente!=='codex'){console.log('Revise e execute o comando acima quando desejar configurar o cliente.');return;}
  const confirmacao=await perguntarNoTerminal(`Para adicionar SEM sobrescrever, digite "${plano.confirmation}" (Enter cancela): `);
  imprimirJson(aplicarConexao(plano,confirmacao));
}

// ── comandoLogs ──
export async function comandoLogs(p:Projeto,json:boolean,follow:boolean) {
  const emitir=(e:Evento)=>console.log(json?JSON.stringify(e):`${e.phase==='start'?'INÍCIO':'TÉRMINO'} · ${linhaDaOperacao(e)}`);
  if(!follow){const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);h.events.forEach(emitir);if(!json&&!h.events.length)console.log('Não existem logs registrados.');return;}
  if(!json)console.log('Acompanhando logs locais. Ctrl+C encerra. Aguardando operações...');
  const ctrl=new AbortController();const parar=()=>ctrl.abort();process.on('SIGINT',parar);process.on('SIGTERM',parar);
  try{await acompanharLogs(p,emitir,{signal:ctrl.signal,problemas: avisarHistoricoIncompleto});}finally{process.off('SIGINT',parar);process.off('SIGTERM',parar);}
}

/** Acompanha somente os eventos locais até a interrupção solicitada. */
export async function acompanharLogs(p:Projeto,emitir:(e:Evento)=>void,opcoes:{signal:AbortSignal;base?:string;intervalMs?:number;problemas?:(p:ReturnType<typeof consultarAtividades>['problems'])=>void}) {
  const vistos=new Set<string>();let ultimosProblemas='';
  while(!opcoes.signal.aborted) {
    const h=consultarAtividades(p,opcoes.base);
    for(const e of h.events) {const chave=e.operationId+e.phase;if(!vistos.has(chave)){vistos.add(chave);emitir(e);}}
    const problemas=JSON.stringify(h.problems);if(problemas!==ultimosProblemas&&h.problems.length)opcoes.problemas?.(h.problems);ultimosProblemas=problemas;
    try{await esperar(opcoes.intervalMs??1000,undefined,{signal:opcoes.signal});}catch(e){if(!opcoes.signal.aborted)throw e;}
  }
}

// --- menuDoTerminal ---
export async function menuDoTerminal(p:Projeto,contrato?:string,json=false) {
  const painel=()=>{
    const h=consultarAtividades(p);const m=calcularMetricas(h);avisarHistoricoIncompleto(h.problems);
    const ultima=h.activities.filter(e=>e.origin==='MCP').at(-1);
    if(json){imprimirJson({project:p.manifesto.name,metrics:m,lastObservedClient:ultima?.client??null,connection:'Sessão ativa não verificada'});return;}
    console.log(`\nPRUMO QA · v${versaoDoPacote}\nEngenharia de Qualidade\n\nProjeto: ${textoSeguroNoTerminal(p.manifesto.name)}\nConexão: ${ultima?'última chamada observada de '+ultima.client+' (identidade declarada)':'nenhuma chamada MCP observada'}; sessão ativa não verificada\nÚltima atividade: ${m.lastActivity??'nenhuma'}\n\nATIVIDADES\n  ${m.totalOperations} operações registradas · ${m.mcpCalls} via MCP\n  ${m.coverageReviews} revisões de cobertura\n  ${m.gaps} lacunas identificadas\n\nOPÇÕES\n  1. Atividades recentes\n  2. Logs\n  3. Métricas\n  4. Evidências\n  5. Conexões\n  0. Sair\n`);
  };
  painel();if(json||!process.stdin.isTTY||!process.stdout.isTTY)return;
  const rl=createInterface({input:process.stdin,output:process.stdout});rl.setPrompt('Opção: ');rl.prompt();
  try {for await(const op of rl){
    if(op.trim()==='0')break;
    try {switch(op.trim()) {
      case '1':comandoAtividade(p);break;case '2':await comandoLogs(p,false,false);break;case '3':comandoMetricas(p);break;
      case '4':await comandoEvidencias(p);break;
      case '5':await comandoConectar(p,'codex',contrato,false,false);console.log('Para confirmar a configuração use prumo conectar codex com esta mesma raiz.');break;
      default:console.log('Escolha uma opção de 0 a 5.');
    }}catch(e){console.error(textoSeguroNoTerminal((e as Error).message));}
    painel();rl.prompt();
  }}finally{rl.close();}
}

// --- contratos ---
/** Textos de ajuda dos comandos do Prumo no terminal. */
export const ajuda = {
  usage: 'prumo [--root <raiz-absoluta>] | atividade | logs [--follow] | metricas | evidencias | conectar codex | doctor | prompts [nome]',
  automation: '--json em consultas. Mantidos context, review <plano.json>, run <capability>, approve <capability>, evidence [jobId].',
  approval: 'approve exige autenticação humana Windows; conectar exige confirmação no terminal antes de alterar a configuração do cliente.',
  prompts: 'prompts lista os roteiros do Prumo (os mesmos prompts do servidor MCP); prompts <nome> imprime o texto, sem executar nada.'
};
