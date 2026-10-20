/** Lê os argumentos do comando prumo e executa a ação pedida. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { contextoCompleto } from '../agentes/mcp/consultasDoProjeto.js';
import { textoDoPrompt } from '../agentes/servicoPropostasMcp.js';
import { promptsPrumo } from '../agentes/tipos/roteiros.js';
import { carregarProjeto } from '../compartilhado/projeto/carregarProjeto.js';
import { Projeto } from '../compartilhado/projeto/contratos.js';
import { executarValidacao } from '../testes/regras/executarValidacao.js';
import { consultarAtividades } from '../logs/regras/iniciarAtividade.js';
import { calcularMetricas } from '../metricas/servico.js';
import { avisarHistoricoIncompleto } from './consultasDoTerminal.js';
import { chamadaRegistrada } from './consultasDoTerminal.js';
import { comandoAtividade } from './consultasDoTerminal.js';
import { comandoConectar } from './consultasDoTerminal.js';
import { comandoEvidencias } from './consultasDoTerminal.js';
import { comandoLogs } from './consultasDoTerminal.js';
import { comandoMetricas } from './consultasDoTerminal.js';
import { imprimirJson } from './consultasDoTerminal.js';
import { menuDoTerminal } from './consultasDoTerminal.js';
import { perguntarNoTerminal } from './consultasDoTerminal.js';
import { textoSeguroNoTerminal } from './consultasDoTerminal.js';
import { ajuda } from './consultasDoTerminal.js';
import { revisarCobertura } from '../testes/regras/revisaoDeCobertura.js';

export async function executarComandoPrumo() {
  const args=process.argv.slice(2);
  const valor=(flag:string)=>{const pos=args.indexOf(flag);if(pos<0)return undefined;const v=args[pos+1];if(!v||v.startsWith('--'))throw new Error(flag+' exige um caminho absoluto.');args.splice(pos,2);return v;};
  let raiz=valor('--root')??process.cwd();const contrato=valor('--readonly-contract');
  const json=args.includes('--json');if(json)args.splice(args.indexOf('--json'),1);
  const [cmd,...resto]=args;
  if(cmd==='help'||cmd==='--help'){imprimirJson(ajuda);return;}
  // Roteiros (prompts MCP): só texto, sem projeto, sem execução. Argumentos de prompt não são aceitos aqui (a IA os preenche).
  if(cmd==='prompts'){if(resto.length>1)throw new Error('Use prompts [nome].');
    if(!resto[0]){if(json)imprimirJson(promptsPrumo.map(p=>({nome:p.nome,titulo:p.titulo,descricao:p.descricao,argumentos:p.argumentos})));else console.log(promptsPrumo.map(p=>`${p.nome} — ${p.descricao}`).join('\n'));return;}
    const p=promptsPrumo.find(x=>x.nome===resto[0]);if(!p)throw new Error('Prompt desconhecido. Use prumo prompts.');
    const args=Object.fromEntries(p.argumentos.map(a=>[a.nome,a.obrigatorio?`<${a.nome}>`:undefined]));const texto=textoDoPrompt(p.nome,args);if(json)imprimirJson({nome:p.nome,texto});else console.log(texto);return;}
  if(!cmd) {
    let p:Projeto;
    try{p=await carregarProjeto(raiz,contrato);}catch(e){
      if(!process.stdin.isTTY||json)throw new Error(`Projeto não vinculado ou contrato inválido. Use prumo doctor --root <raiz-absoluta> com qa.project.json v2. ${textoSeguroNoTerminal((e as Error).message)}`);
      console.log('PRUMO QA · Informe a raiz de um projeto autorizado com qa.project.json v2. Nenhuma pasta será descoberta ou alterada.');
      raiz=await perguntarNoTerminal('Raiz absoluta (Enter sai): ');if(!raiz)return;p=await carregarProjeto(raiz,contrato);
    }
    await menuDoTerminal(p,contrato,json);return;
  }
  if(!['doctor','context','review','run','approve','evidence','evidencias','atividade','metricas','logs','conectar'].includes(cmd))throw new Error('Comando desconhecido. Use prumo help.');
  const max=['review','run','approve','evidence','evidencias','conectar','logs'].includes(cmd)?1:0;
  if(resto.length>max||resto.some(v=>v.startsWith('--')&&!(cmd==='logs'&&v==='--follow')))throw new Error('Parâmetros não autorizados.');
  if(cmd==='logs'&&resto.length&&resto[0]!=='--follow')throw new Error('Use logs [--follow].');
  const p=await carregarProjeto(raiz,contrato);
  if(cmd==='atividade'){comandoAtividade(p,json);return;}
  if(cmd==='metricas'){comandoMetricas(p,json);return;}
  if(cmd==='logs'){await comandoLogs(p,json,resto[0]==='--follow');return;}
  if(cmd==='conectar'){await comandoConectar(p,resto[0]??'codex',contrato,json);return;}
  if(cmd==='doctor'){const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);imprimirJson({ok:true,node:process.version,root:p.raiz,projectId:p.manifesto.id,schemaVersion:2,commands:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,approval:{required:true,provider:process.platform==='win32'?'Windows CredUI + LogonUser (senha da conta atual)':process.platform==='darwin'?'macOS: autenticação do sistema (senha ou Touch ID)':process.platform==='linux'?'Linux: zenity/kdialog + polkit (pkexec)':'indisponível: execução bloqueada',maxMs:120000},observability:calcularMetricas(h)});return;}
  if(cmd==='context'){imprimirJson(await chamadaRegistrada(p,'contexto_projeto',{},()=>contextoCompleto(p)));return;}
  if(cmd==='evidence'||cmd==='evidencias'){await comandoEvidencias(p,resto[0],json||cmd==='evidence');return;}
  if(!resto[0])throw new Error('Informe capability ou arquivo do plano.');
  if(cmd==='review') {
    const alvo=path.resolve(resto[0]);const st=await fs.stat(alvo);if(!st.isFile()||st.size>262144)throw new Error('Plano inválido ou muito grande.');
    const plano:unknown=JSON.parse(await fs.readFile(alvo,'utf8'));
    imprimirJson(await chamadaRegistrada(p,'revisar_cobertura',plano,()=>revisarCobertura(p,plano)));return;
  }
  const e=await chamadaRegistrada(p,'executar_validacao',{capability:resto[0]},()=>executarValidacao(p,resto[0]!,cmd==='approve'));
  if(e.status!=='PASS')process.exitCode=e.status==='FAIL'?1:2;
  imprimirJson(e);
}
