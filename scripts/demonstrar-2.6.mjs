// Janela, SDK e Codex reais; somente dados sintéticos. Confirmações de contexto e status são fixtures declaradas.
// Autenticação Windows não é simulada: a tentativa protegida permanece BLOCKED. Nenhuma issue é criada.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { carregarProjeto } from '../dist/compartilhado/projeto/carregarProjeto.js';
import { prepararConexao } from '../dist/conexoes/ia/prepararConexao.js';
import { gravarPermissaoDeContextosNoMcp as gravarConfig } from '../dist/contextos/banco/gravarPermissaoDeContextosNoMcp.js';
import { aprovarContexto } from '../dist/contextos/regras/aprovarContexto.js';
import { criarContexto } from '../dist/contextos/regras/criarContexto.js';
import { consultarAtividades } from '../dist/logs/banco/consultarAtividades.js';
import { gerarSite } from './gerar-site.mjs';

const repo=path.resolve('.');const out=path.resolve('.prumo/demonstracao-2.6',new Date().toISOString().replace(/[^0-9]/g,''));fs.mkdirSync(out,{recursive:true});
const root=path.join(out,'projeto');const dados=path.join(out,'dados');
if(fs.existsSync(root))throw new Error('Demonstração anterior preservada: arquive a pasta antes de repetir.');
fs.cpSync('exemplos/projeto-demo',root,{recursive:true,filter:p=>!p.split(path.sep).includes('.prumo')});
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));pkg.devDependencies={'@playwright/test':'referencia-estatica-nao-instalada'};fs.writeFileSync(path.join(root,'package.json'),JSON.stringify(pkg));
fs.writeFileSync(path.join(root,'testes/engenharia.spec.ts'),"import {test,expect} from '@playwright/test';\ntest('Editor salva',async({page})=>{\n await page.locator('div > div > button').click();\n await page.waitForTimeout(2000);\n expect(await page.title()).toBeTruthy();\n});\n");
process.env.PRUMO_DATA_DIR=dados;const p=await carregarProjeto(root);
const requisito='R1: Somente Editor pode salvar uma publicação.';
const ctx=criarContexto(p,{tipo:'requisito',titulo:'Requisito sintético R1',chave:'R1',texto:requisito,origem:{tipo:'documento',referencia:'README.md (fixture sintética)'}},'fixture-demonstracao');
aprovarContexto(p,ctx.id,'fixture-demonstracao');gravarConfig(p,true);
const passos=[];const passo=(nome,estado='PASS',data={})=>{passos.push({n:passos.length+1,nome,estado,...data});console.log(`${passos.length}. ${estado} ${nome}`);};
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
let app;const abrir=async()=>{app=await electron.launch({executablePath:electronPath,args:[repo],env});const page=await app.firstWindow();await page.waitForSelector('#nav button');return page;};
const ir=async(page,aba)=>{await page.locator(`[data-aba=${aba}]`).click();const titulo={contextos:'Contextos',conexoes:'Conexões de IA',suporte:'Suporte'}[aba];await page.getByRole('heading',{name:titulo,exact:true,level:1}).waitFor();};
const api=(page,nome,...args)=>page.evaluate(([n,a])=>window.prumo[n](...a),[nome,args]);
const sdk=new Client({name:'prumo-sdk-demonstracao',version:'1.0.0'});
const call=async(name,args={})=>{const r=await sdk.callTool({name,arguments:args});assert.ok(!r.isError);return JSON.parse(r.content[0].text);};
try {
  let page=await abrir();passo('Abrir aplicativo em desenvolvimento');
  await app.evaluate(({dialog},r)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[r]});},root);
  await page.getByRole('button',{name:'Vincular pasta…',exact:true}).click();await page.waitForSelector('table');passo('Selecionar projeto sintético');
  await ir(page,'contextos');await page.getByRole('button',{name:'Requisito sintético R1',exact:true}).waitFor();assert.match(await page.textContent('#conteudo'),/Requisito sintético R1/);passo('Consultar contextos');
  const refs=await api(page,'contextosListar',root);assert.equal(refs.data.contextos[0].estado,'APROVADO');passo('Conferir requisito aprovado de fixture','PASS',{approval:'Fixture semeada pelo módulo; não é aprovação humana nem autenticação Windows'});
  await ir(page,'conexoes');passo('Abrir Conexões');const conexoes=await api(page,'conexoes',root);passo('Inspecionar configuração sem alterá-la','PASS',{configuracoes:conexoes.data.map(c=>({client:c.client,code:c.inspection?.code??'indisponível'}))});
  const protocolo=await api(page,'testarIntegracao',root,'codex');assert.equal(protocolo.data.lastProtocol.state,'VALIDADO');passo('Testar protocolo real','PASS',{id:protocolo.data.lastProtocol.id});
  const plano=prepararConexao(p,'codex');let codexReal=false;
  if(plano.executable&&!plano.manualOnly){
    const neutro=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-demo-neutro-'));
    const fwd=s=>s.replaceAll('\\','/');const config=['-c',`mcp_servers.prumo-demo.command="${fwd(process.execPath)}"`,'-c',`mcp_servers.prumo-demo.args=["${fwd(path.join(repo,'dist/mcp.js'))}","${fwd(root)}"]`,'-c',`mcp_servers.prumo-demo.env={PRUMO_DATA_DIR="${fwd(dados)}"}`];
    const r=await new Promise(resolve=>{let stdout='',stderr='';const c=spawn(plano.executable,['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--json','-s','read-only','-C',neutro,...config,'Use somente o MCP prumo-demo. Chame contexto_projeto e consultar_evidencias. Não use shell, não execute testes, não edite arquivos. Resuma o estado e as referências de contexto retornadas.'],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>c.kill(),180000);c.stdout.on('data',b=>stdout+=b);c.stderr.on('data',b=>stderr+=b);c.on('error',()=>{clearTimeout(timer);resolve({stdout,stderr,code:null});});c.on('close',code=>{clearTimeout(timer);resolve({stdout,stderr,code});});});
    fs.writeFileSync(path.join(out,'codex-real.jsonl'),r.stdout);fs.writeFileSync(path.join(out,'codex-real-stderr.txt'),r.stderr);
    codexReal=r.code===0&&consultarAtividades(p).activities.some(e=>e.client==='codex'&&e.clientClassificationVersion===2&&e.phase==='end'&&e.tool==='contexto_projeto');
    fs.rmSync(neutro,{recursive:true,force:true});
  }
  passo('Chamada pelo Codex real',codexReal?'PASS':'NOT_RUN');
  const observadas=await api(page,'conexoes',root);const uso=observadas.data.find(c=>c.client==='codex').lastObserved;
  if(codexReal)assert.ok(uso);await ir(page,'conexoes');if(uso)await page.getByText(uso.id,{exact:false}).waitFor();await page.screenshot({path:path.join(out,'conexoes.png'),fullPage:true});passo('Evidência do cliente na janela',codexReal?'PASS':'NOT_RUN',{operationId:uso?.id??null});
  await sdk.connect(new StdioClientTransport({command:process.execPath,args:[path.join(repo,'dist/mcp.js'),root],env:{PRUMO_DATA_DIR:dados}}));
  const revisao=await call('revisar_cobertura',{requirement:requisito,source:'README.md',sourcePath:'README.md',contextoId:ctx.id,existingTests:[{id:'PW',behavior:'Editor salva',testPath:'testes/engenharia.spec.ts'}],candidates:[]});passo('Revisar referência Playwright estática','PASS',{executed:revisao.executed});
  const achado=revisao.findings.find(f=>f.type==='PW_ESPERA_FIXA');assert.ok(achado);passo('Identificar espera fixa','PASS',{source:achado.source});assert.ok(achado.evidence[0].fonteOficial.startsWith('https://playwright.dev/'));passo('Conferir recomendação e fonte oficial');
  const bloqueio=await call('executar_validacao',{capability:'unit'});assert.equal(bloqueio.status,'BLOCKED');passo('Validação protegida sem autenticação','BLOCKED',{reason:bloqueio.reason,executed:bloqueio.executed});
  const ev=await api(page,'evidencias',root,bloqueio.jobId);assert.equal(ev.data.results[0].status,'BLOCKED');passo('Consultar resultado real do bloqueio');
  const metricas=await api(page,'visao',root);const historico=await api(page,'historico',root);const ids=historico.data.activities.filter(a=>a.origin==='MCP').map(a=>a.operationId);assert.equal(metricas.data.metrics.executions.PASS,0);assert.equal(metricas.data.metrics.mcpCalls,new Set(ids).size);assert.ok(ids.length>=3);passo('Conferir métricas e histórico','PASS',{calls:metricas.data.metrics.mcpCalls});
  await ir(page,'suporte');passo('Abrir Suporte');const relato={categoria:'bug',titulo:'Relato sintético de demonstração',descricao:'Histórico do exemplo não atualiza nesta situação fictícia.',passos:'1. Consultar histórico',consentimento:true,incluirVersao:false};
  const md=await api(page,'suportePreparar',relato);assert.match(md.data.markdown,/^---\nid: LOCAL-/);fs.writeFileSync(path.join(out,'relato-local.md'),md.data.markdown);passo('Preparar Markdown local','PASS',{id:md.data.idLocal});
  // Fixture explícita de API pública: prova apresentação/transição, não existência de uma issue no GitHub.
  await app.evaluate(()=>{globalThis.__statusDemo='status: recebido';globalThis.fetch=async u=>new Response(JSON.stringify(u.includes('/events')?[{event:'labeled',created_at:'2026-10-10T12:00:00Z',actor:{login:'fixture'},label:{name:globalThis.__statusDemo}}]:{number:12,title:'Chamado fictício',state:'open',created_at:'2026-10-10T11:00:00Z',updated_at:'2026-10-10T12:00:00Z',user:{login:'fixture'},assignees:[],labels:[{name:globalThis.__statusDemo}]}));});
  await page.getByLabel('Número do chamado',{exact:true}).fill('12');await page.getByRole('button',{name:'Consultar chamado',exact:true}).click();await page.getByText('Recebido',{exact:true}).waitFor();
  await app.evaluate(()=>globalThis.__statusDemo='status: em desenvolvimento');await page.getByRole('button',{name:'Consultar chamado',exact:true}).click();await page.getByText('Em desenvolvimento',{exact:true}).waitFor();passo('Demonstrar status com resposta controlada','PASS',{fixture:true,publicIssueCreated:false});
  const versoes=await api(page,'versoes');assert.equal(versoes.data.installed,'2.6.0');passo('Consultar histórico de versões');const site=gerarSite();assert.ok(fs.existsSync(path.join(site.output,'documentacao-seguranca.html')));passo('Conferir documentação gerada','PASS',{publicacao:'Validar URL Render separadamente; esta etapa é o artefato local'});
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.setSize(1280,900);w.webContents.setZoomFactor(4);});await page.getByLabel('Número do chamado',{exact:true}).focus();assert.equal(await page.evaluate(()=>document.activeElement.id),'sup-numero');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));passo('Zoom 400%, teclado e reflow');
  await app.close();passo('Fechar aplicativo');page=await abrir();const persistido=await api(page,'contextosListar',root);assert.equal(persistido.data.contextos[0].id,ctx.id);passo('Reabrir e confirmar persistência');
  assert.equal((await api(page,'testarIntegracao',path.join(out,'nao-vinculado'),'codex')).ok,false);assert.equal((await api(page,'suportePreparar',{...relato,consentimento:false})).ok,false);passo('Conferir bloqueios IPC e consentimento');
  assert.equal(passos.length,24);
  fs.writeFileSync(path.join(out,'resumo.json'),JSON.stringify({versao:'2.6.0',at:new Date().toISOString(),approval:'Contexto semeado como fixture, execução humana não simulada',passos},null,2));
  fs.writeFileSync(path.resolve('.prumo/demonstracao-2.6/ultima.json'),JSON.stringify({directory:out,resumo:path.join(out,'resumo.json')},null,2));
} finally {await sdk.close().catch(()=>{});await app?.close().catch(()=>{});}
