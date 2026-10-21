import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { criarEspaco } from '../../../../dist/projetos/servicoProjetos.js';
import { salvarAgentePessoal, consultarAgentePessoal, listarAgentesPessoais, importarPreviasAntigas } from '../../../../dist/agentes/regras/agentesPessoais.js';
import { gravarAgenda } from '../../../../dist/agendamentos/banco/agenda.js';
import { gravarRunsLocais } from '../../../../dist/testes/banco/runs.js';
import { acessoDosCanais } from '../../../../dist/login/tipos/acessoDosCanais.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';
import { responderComDadosLocais } from '../../../../dist/agentes/chat/responderComDadosLocais.js';
import { agentesChat } from '../../../../dist/agentes/tipos/persona.js';

test('quatro agentes pessoais consultam fontes reais locais sem criar execucoes ficticias', async t => {
  const b=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-agentes-ferramentas-'));
  t.after(()=>fs.rmSync(b,{recursive:true,force:true}));
  const e=await criarEspaco({nome:'Projeto de prova',descricao:'Dados fictícios'},b);
  const dono=randomUUID(), outro=randomUUID();
  const em=new Date('2026-10-21T13:00:00.000Z').toISOString();
  gravarAgenda({version:1,pausaGlobal:false,rotinas:[{
    id:randomUUID(),espacoId:e.id,nome:'Smoke QA diário',tipo:'smoke',capability:'smoke',
    ambiente:'local',frequencia:{tipo:'diario',hora:'09:00'},fuso:'America/Sao_Paulo',
    politicaPerdido:'PULAR',toleranciaMinutos:10,operacaoJira:'tickets',
    estado:'ATIVA',ancora:em,ultimoSlot:null,criadaEm:em,historico:[]
  }]},b);
  gravarRunsLocais({version:1,itens:[{
    id:randomUUID(),espacoId:e.id,titulo:'Run de validação de login',
    ambiente:'homologacao',runIdRemoto:null,planoId:null,
    estado:'PREPARADA',confirmadaNoQase:false,criadaEm:em,atualizadaEm:em,
    casos:[{casoId:42,titulo:'Login autorizado',capability:null,casoRunner:null,resultado:null,publicado:false}],
    execucoes:[],publicacoes:[]
  }]},b);
  const cenarios=[
    ['projeto','Projeto de prova','espacos.json'],
    ['agenda','Smoke QA diário','agenda.json'],
    ['execucoes','Run de validação de login','runs-qase.json'],
    ['tickets','Nenhuma proposta local','propostas.json']
  ];
  for(const [ferramenta,evidencia,origem] of cenarios) {
    const id=salvarAgentePessoal(e.id,{nome:'Especialista em '+ferramenta,descricao:'Teste controlado',objetivo:'Consultar dados reais',instrucoes:'Somente leitura.',publico:true,ferramenta},dono,b).id;
    const resultado=consultarAgentePessoal(e.id,id,dono,b);
    assert.equal(resultado.modo,'CONSULTA_LOCAL');
    assert.equal(resultado.origem,origem);
    assert.equal(resultado.ferramenta,ferramenta);
    assert.ok(resultado.linhas.join(' ').includes(evidencia),ferramenta);
    assert.throws(()=>consultarAgentePessoal(e.id,id,outro,b),/AGENT_NOT_FOUND/,'público não transfere execução');
    assert.equal(listarAgentesPessoais(e.id,outro,b).find(a=>a.id===id)?.meu,false);
  }
  assert.throws(()=>salvarAgentePessoal(e.id,{nome:'Perigoso',descricao:'',objetivo:'Fazer ações',instrucoes:'Executar comandos',publico:false,ferramenta:'shell'},dono,b),/invalid|Invalid|option/i);
  assert.deepEqual(acessoDosCanais['agentes:pessoalconsultar'],['agentes','VER']);
  assert.equal(esquemasIpc['agentes:pessoalconsultar'].safeParse({espacoId:e.id,id:'pessoal-abc',usuarioId:dono}).success,false,'janela não define usuário');
  const migrado=importarPreviasAntigas(e.id,[{id:'legado-1',nome:'Antigo',descricao:'',objetivo:'Ler',instrucoes:'Somente leitura.'}],dono,b);
  assert.equal(migrado.importados,1);
  assert.equal(listarAgentesPessoais(e.id,dono,b).find(a=>a.id==='legado-1')?.ferramenta,'projeto');
});
test('especialista oficial UI/UX devolve resposta local específica com limitação explícita', async t => {
  const b=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-uiux-local-'));
  t.after(()=>fs.rmSync(b,{recursive:true,force:true}));
  const e=await criarEspaco({nome:'Produto fictício',descricao:''},b);
  const agente=agentesChat.find(a=>a.id==='ui-ux');
  assert.ok(agente);
  const r=await responderComDadosLocais(agente,'Avalie a usabilidade e o design da tela',e.id,b);
  assert.ok(r.linhas.join(' ').includes('hierarquia visual'));
  assert.ok(r.linhas.join(' ').includes('não tem pasta local vinculada'));
  assert.equal(r.vazio,false);
  assert.equal(r.fontes.some(f=>f.aba==='projetos'),true);
});

test('todos os nove agentes oficiais respondem a um projeto fictício sem executar ações', async t => {
  const b=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-nove-especialistas-'));
  t.after(()=>fs.rmSync(b,{recursive:true,force:true}));
  const e=await criarEspaco({nome:'Inspeção de especialistas',descricao:''},b);
  for(const agente of agentesChat.filter(x=>x.especializacao)) {
    const r=await responderComDadosLocais(agente,'Faça uma análise factual do seu domínio',e.id,b);
    assert.ok(r.linhas.length>0,agente.id);
    assert.ok(!r.linhas.join(' ').includes('Não encontrei nada sobre isso nos dados locais'),agente.id);
    assert.equal(r.vazio,false,agente.id);
  }
  assert.equal(agentesChat.filter(x=>x.especializacao).length,9);
});
