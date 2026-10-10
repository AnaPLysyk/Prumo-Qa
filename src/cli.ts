#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { carregarProjeto, contextoProjeto, mascarar } from './projeto.js';
import { executarValidacao } from './execucao.js';
import { consultarEvidencias } from './evidencias.js';
import { revisarCobertura } from './qualidade.js';

async function main() {
  const args=process.argv.slice(2); const pos=args.indexOf('--root');
  let raiz=process.cwd();
  if(pos>=0){if(!args[pos+1])throw new Error('--root exige caminho absoluto');raiz=args[pos+1]!;args.splice(pos,2);}
  const pc=args.indexOf('--readonly-contract');let contrato:string|undefined;
  if(pc>=0){contrato=args[pc+1];if(!contrato)throw new Error('--readonly-contract exige arquivo absoluto');args.splice(pc,2);}
  const [cmd,...resto]=args;
  if(cmd==='help' || cmd==='--help' || !cmd) return {usage:'qa doctor | context | review <plano.json> | run <capability> | approve <capability> | evidence [jobId] [--root <raiz-absoluta>]',approval:'approve abre autenticação humana Windows e executa uma única rodada no mesmo processo. Não gera token reutilizável.'};
  if(!['doctor','context','review','run','approve','evidence'].includes(cmd))throw new Error('Comando desconhecido. Use qa help.');
  if(resto.length>(['doctor','context'].includes(cmd)?0:1) || resto.some(v=>v.startsWith('--')))throw new Error('Parâmetros não autorizados.');
  const p=await carregarProjeto(raiz,contrato);
  if(cmd==='doctor')return {ok:true,node:process.version,root:p.raiz,projectId:p.manifesto.id,schemaVersion:2,commands:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,approval:{required:true,provider:process.platform==='win32'?'Windows CredUI + LogonUser (senha da conta atual)':'indisponível: execução bloqueada',maxMs:120000}};
  if(cmd==='context')return contextoProjeto(p);
  if(cmd==='evidence')return consultarEvidencias(p,resto[0]);
  if(!resto[0])throw new Error('Informe capability ou arquivo do plano.');
  if(cmd==='review') {
    // Plano é entrada explícita do usuário, separado dos arquivos do projeto. Tamanho limitado.
    const alvo=path.resolve(resto[0]);const st=await fs.stat(alvo);if(!st.isFile()||st.size>262144)throw new Error('Plano inválido ou muito grande.');
    return revisarCobertura(p,JSON.parse(await fs.readFile(alvo,'utf8')));
  }
  const e=await executarValidacao(p,resto[0],cmd==='approve');
  if(e.status!=='PASS')process.exitCode=e.status==='FAIL'?1:2;
  return e;
}
main().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(JSON.stringify({error:mascarar(e.message)}));process.exitCode=2;});
