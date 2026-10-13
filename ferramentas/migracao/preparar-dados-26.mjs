// Executado no runner Windows descartável, com a 2.6 publicada realmente instalada.
// Não consulta serviços nem fabrica aprovação humana. Contexto nasce RASCUNHO.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const instalacao=process.argv[2];if(!instalacao)throw new Error('Informe instalação 2.6 do runner');
const app=path.join(instalacao,'resources','app');assert.equal(JSON.parse(fs.readFileSync(path.join(app,'package.json'))).version,'2.6.0');
delete process.env.PRUMO_DATA_DIR;
const antigo=n=>import(pathToFileURL(path.join(app,'dist',n+'.js')).href);
const {copiarDemonstracao,adicionarVinculo}=await antigo('vinculos'),{diretorioDados}=await antigo('atividades'),{carregarProjeto}=await antigo('projeto'),ctx=await antigo('contextos'),prefs=await antigo('preferencias'),painel=await antigo('painel');
const raiz=copiarDemonstracao(path.join(instalacao,'resources','demo'));await adicionarVinculo(raiz);const p=await carregarProjeto(raiz);
const contexto=ctx.criarContexto(p,{tipo:'requisito',titulo:'Migração 2.6 sintética',texto:'Regra fictícia preservada na atualização.',origem:{tipo:'documento',referencia:'laboratorio/migracao-2.6'}},'RUNNER_FIXTURE');
assert.equal(contexto.estado,'RASCUNHO');prefs.alterarPreferencias({som:false,silenciar:true,verificarAoIniciar:false});
const client=new Client({name:'sdk-migracao-2.6',version:'1.0.0'});await client.connect(new StdioClientTransport({command:path.join(instalacao,'Prumo QA.exe'),args:[path.join(app,'dist','mcp.js'),raiz],env:{ELECTRON_RUN_AS_NODE:'1'}}));
try{assert.equal(client.getServerVersion().version,'2.6.0');for(const name of ['contexto_projeto','consultar_evidencias'])assert.ok(!(await client.callTool({name,arguments:{}})).isError);}finally{await client.close();}
const visao=await painel.visao(raiz),dados=diretorioDados();
const snapshot={versao:'2.6.0',raiz,contexto:{id:contexto.id,hash:contexto.hash,estado:contexto.estado,versao:contexto.versao},totalOperations:visao.metrics.totalOperations,preferencias:prefs.lerPreferencias()};
fs.writeFileSync(path.join(dados,'instantaneo-2.6.0.json'),JSON.stringify(snapshot,null,2));console.log('Snapshot 2.6 criado no runner: contexto RASCUNHO, preferências e histórico MCP real.');
