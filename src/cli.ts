#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { carregarProjeto, contextoProjeto, mascarar, type Projeto } from './projeto.js';
import { executarValidacao } from './execucao.js';
import { consultarEvidencias } from './evidencias.js';
import { revisarCobertura } from './qualidade.js';
import { consultarAtividades, calcularMetricas, observar, acompanharLogs, descreverAchados, type Evento } from './atividades.js';
import { prepararConexao, aplicarConexao } from './conexoes.js';

const imprimir=(v:unknown)=>console.log(JSON.stringify(v,null,2));
const texto=(s:string)=>mascarar(s).replace(/[\x00-\x1f\x7f-\x9f]/g,' ');
const ajuda={usage:'prumo [--root <raiz-absoluta>] | atividade | logs [--follow] | metricas | evidencias | conectar codex | doctor',
  automation:'--json em consultas. Mantidos context, review <plano.json>, run <capability>, approve <capability>, evidence [jobId].',
  approval:'approve exige autenticação humana Windows; conectar exige confirmação no terminal antes de alterar a configuração do cliente.'};
const problemas=(p:unknown[])=>{if(p.length){console.error('HISTORY_INCOMPLETE: registros inválidos/truncados excluídos; métricas são parciais.');process.exitCode=3;}};
function linha(e:Evento) {
  return `${e.at} · ${e.tool} · ${e.origin}/${e.client} (identidade declarada) · ${e.phase==='start'?'SEM TÉRMINO OBSERVADO':e.state} · ${e.durationMs} ms\n  ${e.summary.findings} achados · ${e.summary.recommendations} recomendações · ${e.summary.gaps} lacunas · ${e.summary.candidateRedundancies} redundâncias candidatas\n  operação ${e.operationId}${e.summary.code?' · '+e.summary.code:''}${e.summary.evidenceJobId?' · evidência '+e.summary.evidenceJobId+(e.summary.evidencePersisted===false?' (não persistida)':''):''}${e.summary.types.length?'\n  '+descreverAchados(e):''}`;
}
function atividades(p:Projeto,json=false) {
  const h=consultarAtividades(p);problemas(h.problems);
  if(json)imprimir(h);else {console.log(`ATIVIDADES · ${texto(p.manifesto.name)}\nHistórico: ${h.directory}`);console.log(h.activities.length?h.activities.slice(-20).reverse().map(linha).join('\n\n'):'Não existem atividades registradas.');}
}
function metricas(p:Projeto,json=false) {
  const m=calcularMetricas(consultarAtividades(p));problemas(m.problems);
  if(json)imprimir(m);else console.log(`MÉTRICAS · ${texto(p.manifesto.name)}\n${m.complete?'Histórico válido':'HISTÓRICO PARCIAL'}\nOperações: ${m.totalOperations} · Chamadas MCP: ${m.mcpCalls}\nContextos: ${m.contextAnalyses} · Revisões: ${m.coverageReviews}\nAchados: ${m.findings} · Recomendações: ${m.recommendations}\nLacunas: ${m.gaps} · Redundâncias candidatas: ${m.candidateRedundancies}\nExecuções solicitadas: ${m.executionsRequested}\nPASS: ${m.executions.PASS} · FAIL: ${m.executions.FAIL} · BLOCKED: ${m.executions.BLOCKED} · NOT_RUN: ${m.executions.NOT_RUN}\nErros: ${m.errors} · Sem término observado: ${m.unfinished}\nDuração média: ${m.averageDurationMs===null?'indisponível':m.averageDurationMs+' ms'}\nÚltima atividade: ${m.lastActivity??'nenhuma'}\nTokens/custos: ${m.providerMetrics}\nAlterações aplicadas pela IA: não observadas pelo Prumo.`);
}
async function logs(p:Projeto,json:boolean,follow:boolean) {
  const emitir=(e:Evento)=>console.log(json?JSON.stringify(e):`${e.phase==='start'?'INÍCIO':'TÉRMINO'} · ${linha(e)}`);
  if(!follow){const h=consultarAtividades(p);problemas(h.problems);h.events.forEach(emitir);if(!json&&!h.events.length)console.log('Não existem logs registrados.');return;}
  if(!json)console.log('Acompanhando logs locais. Ctrl+C encerra. Aguardando operações...');
  const ctrl=new AbortController();const parar=()=>ctrl.abort();process.on('SIGINT',parar);process.on('SIGTERM',parar);
  try{await acompanharLogs(p,emitir,{signal:ctrl.signal,problemas});}finally{process.off('SIGINT',parar);process.off('SIGTERM',parar);}
}
const diagnostico=(fase:string,id:string)=>{console.error(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado. Confira diretório de dados, permissões e limites.`);if(!process.exitCode)process.exitCode=3;};
const chamada=<T>(p:Projeto,tool:string,entrada:unknown,fn:()=>Promise<T>)=>observar(p,tool,{origin:'CLI'},entrada,fn,{diagnostico});
async function evidencias(p:Projeto,id?:string,json=false) {
  const r=await chamada(p,'consultar_evidencias',{jobId:id},()=>consultarEvidencias(p,id));
  if(json)imprimir(r);else {console.log(`EVIDÊNCIAS · ${texto(p.manifesto.name)}`);console.log(r.results.length?r.results.map(e=>`${e.endedAt} · ${e.status} · ${e.jobId}\n  ${texto(e.reason)}\n  ${e.evidencePath}`).join('\n'): 'NOT_RUN · Nenhuma evidência para esta consulta.');}
}
async function perguntar(pergunta:string) {
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try{return await rl.question(pergunta);}catch{return '';}finally{rl.close();}
}
async function conexao(p:Projeto,cliente:string,contrato?:string,json=false,interagir=true) {
  const plano=prepararConexao(p,cliente,contrato);
  if(json){imprimir(plano);return;}
  console.log(`CONEXÃO · ${cliente}\nProjeto validado: ${texto(p.manifesto.name)}\nRaiz: ${p.raiz}\nDestino: ${plano.destination}\nNome: ${plano.name}\nCliente ${plano.installed?'localizado':'não instalado'}\n\n${plano.command}\n\n${plano.notice}`);
  if(!interagir||!process.stdin.isTTY||!process.stdout.isTTY||!plano.installed||plano.manualOnly||cliente!=='codex'){console.log('Revise e execute o comando acima quando desejar configurar o cliente.');return;}
  const confirmacao=await perguntar(`Para adicionar SEM sobrescrever, digite "${plano.confirmation}" (Enter cancela): `);
  imprimir(aplicarConexao(plano,confirmacao));
}
async function menu(p:Projeto,contrato?:string,json=false) {
  const painel=()=>{
    const h=consultarAtividades(p);const m=calcularMetricas(h);problemas(h.problems);
    const ultima=h.activities.filter(e=>e.origin==='MCP').at(-1);
    if(json){imprimir({project:p.manifesto.name,metrics:m,lastObservedClient:ultima?.client??null,connection:'Sessão ativa não verificada'});return;}
    console.log(`\nPRUMO QA · v2.2\nEngenharia de Qualidade\n\nProjeto: ${texto(p.manifesto.name)}\nConexão: ${ultima?'última chamada observada de '+ultima.client+' (identidade declarada)':'nenhuma chamada MCP observada'}; sessão ativa não verificada\nÚltima atividade: ${m.lastActivity??'nenhuma'}\n\nATIVIDADES\n  ${m.totalOperations} operações registradas · ${m.mcpCalls} via MCP\n  ${m.coverageReviews} revisões de cobertura\n  ${m.gaps} lacunas identificadas\n\nOPÇÕES\n  1. Atividades recentes\n  2. Logs\n  3. Métricas\n  4. Evidências\n  5. Conexões\n  0. Sair\n`);
  };
  painel();if(json||!process.stdin.isTTY||!process.stdout.isTTY)return;
  const rl=createInterface({input:process.stdin,output:process.stdout});rl.setPrompt('Opção: ');rl.prompt();
  try {for await(const op of rl){
    if(op.trim()==='0')break;
    try {switch(op.trim()) {
      case '1':atividades(p);break;case '2':await logs(p,false,false);break;case '3':metricas(p);break;
      case '4':await evidencias(p);break;
      case '5':await conexao(p,'codex',contrato,false,false);console.log('Para confirmar a configuração use prumo conectar codex com esta mesma raiz.');break;
      default:console.log('Escolha uma opção de 0 a 5.');
    }}catch(e){console.error(texto((e as Error).message));}
    painel();rl.prompt();
  }}finally{rl.close();}
}

async function main() {
  const args=process.argv.slice(2);
  const valor=(flag:string)=>{const pos=args.indexOf(flag);if(pos<0)return undefined;const v=args[pos+1];if(!v||v.startsWith('--'))throw new Error(flag+' exige um caminho absoluto.');args.splice(pos,2);return v;};
  let raiz=valor('--root')??process.cwd();const contrato=valor('--readonly-contract');
  const json=args.includes('--json');if(json)args.splice(args.indexOf('--json'),1);
  const [cmd,...resto]=args;
  if(cmd==='help'||cmd==='--help'){imprimir(ajuda);return;}
  if(!cmd) {
    let p:Projeto;
    try{p=await carregarProjeto(raiz,contrato);}catch(e){
      if(!process.stdin.isTTY||json)throw new Error(`Projeto não vinculado ou contrato inválido. Use prumo doctor --root <raiz-absoluta> com qa.project.json v2. ${texto((e as Error).message)}`);
      console.log('PRUMO QA · Informe a raiz de um projeto autorizado com qa.project.json v2. Nenhuma pasta será descoberta ou alterada.');
      raiz=await perguntar('Raiz absoluta (Enter sai): ');if(!raiz)return;p=await carregarProjeto(raiz,contrato);
    }
    await menu(p,contrato,json);return;
  }
  if(!['doctor','context','review','run','approve','evidence','evidencias','atividade','metricas','logs','conectar'].includes(cmd))throw new Error('Comando desconhecido. Use prumo help.');
  const max=['review','run','approve','evidence','evidencias','conectar','logs'].includes(cmd)?1:0;
  if(resto.length>max||resto.some(v=>v.startsWith('--')&&!(cmd==='logs'&&v==='--follow')))throw new Error('Parâmetros não autorizados.');
  if(cmd==='logs'&&resto.length&&resto[0]!=='--follow')throw new Error('Use logs [--follow].');
  const p=await carregarProjeto(raiz,contrato);
  if(cmd==='atividade'){atividades(p,json);return;}
  if(cmd==='metricas'){metricas(p,json);return;}
  if(cmd==='logs'){await logs(p,json,resto[0]==='--follow');return;}
  if(cmd==='conectar'){await conexao(p,resto[0]??'codex',contrato,json);return;}
  if(cmd==='doctor'){const h=consultarAtividades(p);problemas(h.problems);imprimir({ok:true,node:process.version,root:p.raiz,projectId:p.manifesto.id,schemaVersion:2,commands:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,approval:{required:true,provider:process.platform==='win32'?'Windows CredUI + LogonUser (senha da conta atual)':'indisponível: execução bloqueada',maxMs:120000},observability:calcularMetricas(h)});return;}
  if(cmd==='context'){imprimir(await chamada(p,'contexto_projeto',{},()=>contextoProjeto(p)));return;}
  if(cmd==='evidence'||cmd==='evidencias'){await evidencias(p,resto[0],json||cmd==='evidence');return;}
  if(!resto[0])throw new Error('Informe capability ou arquivo do plano.');
  if(cmd==='review') {
    const alvo=path.resolve(resto[0]);const st=await fs.stat(alvo);if(!st.isFile()||st.size>262144)throw new Error('Plano inválido ou muito grande.');
    const plano:unknown=JSON.parse(await fs.readFile(alvo,'utf8'));
    imprimir(await chamada(p,'revisar_cobertura',plano,()=>revisarCobertura(p,plano)));return;
  }
  const e=await chamada(p,'executar_validacao',{capability:resto[0]},()=>executarValidacao(p,resto[0]!,cmd==='approve'));
  if(e.status!=='PASS')process.exitCode=e.status==='FAIL'?1:2;
  imprimir(e);
}
main().catch(e=>{console.error(JSON.stringify({error:mascarar(e.message)}));process.exitCode=2;});
