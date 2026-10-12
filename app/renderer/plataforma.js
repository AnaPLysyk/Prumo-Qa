'use strict';
// Apresentação apenas. Credenciais e chamadas HTTP ficam no processo principal.
const botao = (texto, fn, id) => h('button', {class:'acao', id, onclick:async e => { const b=e.currentTarget;b.disabled=true; try { await fn(); } catch { avisar('Falha ao concluir a ação.',true); } finally { b.disabled=false; } }}, texto);
const campoPlataforma = (texto, attrs={}) => { const input=h('input', attrs); return {input, no:h('label', {class:'campo'}, texto, input)}; };
const dadosVisiveis = v => h('pre', {}, JSON.stringify(v,null,2));
const faltaEspaco = () => h('div',{class:'vazio'},'Selecione um projeto Prumo em Projetos. Uma pasta local é opcional.');
function escolherEspaco(e){estado.espaco=e;estado.root=e.raizContextos;salvarRaiz();mostrar('projetos');}
const projetosLocais=abas.projetos;
abas.projetos=async el=>{
  el.append(h('h1',{},'Projetos'));
  const formulario=h('div',{id:'espaco-form'});
  const editar=e=>{
    const nome=campoPlataforma('Nome',{id:'espaco-nome',maxlength:200,value:e?.nome||''});
    const descricao=campoPlataforma('Descrição',{id:'espaco-descricao',maxlength:1000,value:e?.descricao||''});
    formulario.replaceChildren(h('h2',{},e?'Editar projeto':'Novo projeto Prumo'),nome.no,descricao.no,
      botao('Salvar projeto',async()=>{const dados={nome:nome.input.value,descricao:descricao.input.value};const r=await chamar(()=>e?api.espacoEditar(e.id,dados):api.espacoCriar(dados));if(r)escolherEspaco(r);},'espaco-salvar'),botao('Cancelar',()=>formulario.replaceChildren()));nome.input.focus();
  };
  el.append(botao('Novo projeto Prumo',()=>editar(), 'espaco-novo'),formulario);
  const lista=await chamar(api.espacos);if(!lista)return;
  for(const e of lista){
    const acoes=h('div',{class:'barra-acoes'},botao(estado.espaco?.id===e.id?'Projeto selecionado':'Selecionar projeto',()=>escolherEspaco(e)),botao('Editar projeto',()=>editar(e)),botao('Vincular pasta de automação…',async()=>{const r=await chamar(()=>api.espacoPasta(e.id));if(r&&!r.canceled)mostrar('projetos');}));
    // v40: cada vínculo mantém a identidade própria (serviço, chave, ID e instância) e as ações dele na mesma linha.
    const chips=h('ul',{class:'ds-lista proj-vinculos'},e.vinculos.map(v=>h('li',{class:'proj-vinculo','data-servico':v.servico},DS.origem(v.servico,DS.nomesServico[v.servico]+' · '+v.recurso.chave),h('span',{class:'ds-sub'},'ID '+v.recurso.id+' · '+v.recurso.instancia+' · '+tr('validado {q}',{q:hora(v.validadoEm)})),selo(v.estado),h('span',{class:'proj-vinculo-acoes'},DS.link('Validar',async()=>{if(await chamar(()=>api.servicoConferir(e.id,v.servico)))mostrar('projetos');},{rotulo:'Validar vínculo '+v.servico,seta:false}),DS.link('Remover',async()=>{const r=await chamar(()=>api.servicoDesvincular(e.id,v.servico));if(r&&!r.canceled)mostrar('projetos');},{rotulo:'Remover vínculo '+v.servico,seta:false})))),h('li',{class:'proj-vinculo','data-servico':'local'},DS.origem('local',e.pastaLocal?tr('Pasta vinculada'):tr('Sem pasta local')),h('span',{class:'ds-sub'},e.pastaLocal||tr('Opcional: necessária para catálogo, automações e evidências locais.'))));
    el.append(h('section',{class:'nota','data-espaco':e.id},h('h2',{},e.nome),e.descricao?h('p',{class:'suave'},e.descricao):null,chips,acoes,h('p',{class:'suave'},'ID Prumo: '+e.id)));
  }
  await projetosLocais(el);
};
const agentesLegados=abas.conexoes;
abas.agentes=agentesLegados;
abas.conexoes=async el=>{
  el.append(h('h1',{},'Conexões'));
  const form=h('div',{class:'formulario',id:'conexao-form'}),recursos=h('div',{id:'recursos-remotos'});
  el.append(botao('Configurar conexão',()=>{
    const tipo=h('select',{id:'conexao-servico'},['jira','qase','github'].map(s=>h('option',{value:s},s)));
    const nome=campoPlataforma('Nome da conexão',{id:'conexao-nome',maxlength:100});const instancia=campoPlataforma('Instância Jira (https://suaempresa.atlassian.net)',{id:'conexao-instancia'});
    const usuario=campoPlataforma('E-mail Jira',{id:'conexao-usuario',type:'email'});const token=campoPlataforma('Token',{id:'conexao-token',type:'password',autocomplete:'off',maxlength:6000});
    const atualizar=()=>{instancia.no.hidden=usuario.no.hidden=tipo.value!=='jira';};tipo.addEventListener('change',atualizar);atualizar();
    form.replaceChildren(h('label',{class:'campo'},'Serviço',tipo),nome.no,instancia.no,usuario.no,token.no,
      botao('Validar e guardar credencial',async()=>{const dados={servico:tipo.value,nome:nome.input.value,token:token.input.value};if(tipo.value==='jira'){dados.instancia=instancia.input.value;dados.usuario=usuario.input.value;}try{const r=await chamar(()=>api.servicoAdicionar(dados));if(r&&!r.canceled)mostrar('conexoes');}finally{token.input.value='';dados.token='';}},'conexao-salvar'),botao('Cancelar',()=>{token.input.value='';form.replaceChildren();}));
  },'conexao-nova'),form);
  const contas=await chamar(api.servicos);if(!contas)return;
  for(const c of contas.filter(c=>c.ativa))el.append(h('section',{class:'nota'},h('h2',{},c.nome+' · '+c.servico),h('p',{},c.identidade+' · '+c.instancia+' · validada: '+hora(c.validadaEm)),
    botao('Validar conexão',async()=>{const r=await chamar(()=>api.servicoValidar(c.id));if(r)avisar('Credencial validada por consulta de leitura.');}),
    botao('Listar recursos disponíveis',()=>listar(c,{offset:0,limite:50})),
    botao('Remover conexão',async()=>{const r=await chamar(()=>api.servicoRemover(c.id));if(r&&!r.canceled)mostrar('conexoes');})));
  el.append(recursos);
  async function listar(c,pagina){
    const espacoId=estado.espaco?.id;const r=await chamar(()=>api.servicoRecursos(c.id,pagina));if(!r)return;
    recursos.replaceChildren(h('h2',{},'Recursos de '+c.nome),h('p',{class:'suave'},'Consulta atual · '+r.origem+' · '+hora(r.consultadoEm)+' · sem cache persistido'),
      r.recursos.length?h('div',{},r.recursos.map(x=>h('div',{class:'nota'},h('strong',{},x.nome),h('p',{},'Chave '+x.chave+' · ID '+x.id+' ('+x.tipoId+') · conta '+x.contaId),
        espacoId?botao('Vincular '+x.chave,async()=>{const v=await chamar(()=>api.servicoVincular(espacoId,c.id,x));if(v&&!v.canceled)avisar('Vínculo confirmado para o projeto selecionado nesta consulta.');}):h('p',{},'Selecione primeiro um projeto Prumo.')))):h('p',{},'A API retornou uma lista vazia para esta credencial.'),
      r.proxima!==null?botao('Próxima página de recursos',()=>listar(c,{offset:r.proxima,limite:50})):null);
  }
};
function textoExterno(v){if(v==null)return '';if(typeof v==='string')return v;if(v.type==='text')return v.text||'';if(Array.isArray(v.content))return v.content.map(textoExterno).join('\n');return JSON.stringify(v);}
function tituloItem(x){return x.fields?.summary||x.title||x.name||x.key||x.id||x.hash||x.sha||'Item';}
function classificacaoCaso(x){if(typeof x.isManual==='boolean')return x.isManual?(x.isToBeAutomated?'MANUAL · automação planejada':'MANUAL'):'AUTOMATIZADO';return ({0:'MANUAL',1:'MANUAL · automação planejada',2:'AUTOMATIZADO'})[x.automation]||'Classificação não informada pela API';}
async function consultaManual(el,servico,operacoes){
  const e=estado.espaco;if(!e)return el.append(faltaEspaco());const v=e.vinculos.find(v=>v.servico===servico);
  if(!v)return el.append(h('div',{class:'vazio'},'Serviço '+servico+' não vinculado a '+e.nome+'. Configure e selecione o recurso em Conexões.'));
  el.append(h('p',{class:'suave'},e.nome+' · '+v.recurso.instancia+' · '+v.recurso.chave+' · ID '+v.recurso.id+' · ',selo(v.estado)));
  const detalhe=h('div',{id:'detalhe-remoto'}),lista=h('div',{id:'lista-remota'}),fonte=h('p',{class:'suave',id:'fonte-remota'});
  const operacao=h('select',{id:'operacao-remota'},Object.entries(operacoes).map(([key,label])=>h('option',{value:key},label)));
  const ident=campoPlataforma('ID para detalhe / run / SHA (quando necessário)',{id:'id-remoto',maxlength:200});
  el.append(h('div',{class:'barra'},h('label',{},'Consulta',operacao),ident.no,botao('Consultar API',()=>consultar(operacao.value,{},ident.input.value||undefined),'consultar-remoto')),fonte,lista,detalhe);
  let consultaAtual=0;
  async function consultar(op,pagina={},id){
    const tentativa=++consultaAtual;if(!(servico==='qase'&&op==='caso'&&window.PrumoQualidadeV39))lista.replaceChildren();detalhe.replaceChildren();fonte.textContent='Consultando…';
    const raw=await api.servicoConsultar(e.id,servico,op,pagina,id);if(tentativa!==consultaAtual)return;
    if(!raw.ok){fonte.textContent='Consulta falhou: '+raw.error+'. Nenhum resultado foi substituído por lista vazia.';avisar(raw.error,true);return;}
    const r=raw.data;fonte.textContent='Consulta atual · '+r.origem+' · '+r.endpoint+' · '+hora(r.consultadoEm)+' · sem cache. '+r.interpretacao+' '+r.limitesExibicao;
    const itens=Array.isArray(r.dados)?r.dados:[r.dados];
    if(!itens.length)lista.append(h('p',{},'A API retornou uma lista vazia.'));
    for(const x of itens){const card=h('section',{class:'nota'},h('h2',{},String(tituloItem(x))));
      if(servico==='jira'){
        const f=x.fields||{};card.append(h('p',{},(x.key||'')+' · '+(f.issuetype?.name||'tipo não informado')+' · '+(f.status?.name||'estado não informado')+' · '+(f.priority?.name||'prioridade não informada')),
          h('p',{},'Responsável: '+(f.assignee?.displayName||'não informado')+' · atualizado: '+(f.updated||'não informado')),
          h('pre',{},textoExterno(f.description)),v.campoAceite?h('pre',{},'Critérios de aceite ('+v.campoAceite+'): '+textoExterno(f[v.campoAceite])):h('p',{},'Campo de critérios de aceite ainda não configurado.'));
        if(x.key)card.append(botao('Detalhar '+x.key,()=>consultar('ticket',{},x.key)),botao('Comentários de '+x.key,()=>consultar('comentarios',{},x.key)),botao('Importar '+x.key+' como rascunho',async()=>{const r=await chamar(()=>api.servicoImportar(e.id,x.key));if(r&&!r.canceled)avisar('Contexto importado como RASCUNHO.');}));
        if(op==='campos'&&x.custom&&/^customfield_\d+$/.test(x.id))card.append(botao('Usar '+x.id+' como critérios de aceite',async()=>{if(await chamar(()=>api.servicoAceite(e.id,x.id)))avisar('Campo configurado. Reabra Tickets para atualizar o vínculo exibido.');}));
      }
      if(servico==='qase'){
        if(op==='casos'||op==='caso')card.append(h('p',{},classificacaoCaso(x)),h('p',{},Array.isArray(x.external_issues)&&x.external_issues.length?'Associações retornadas pelo Qase (fonte externa; confirme instância e ticket no detalhe).':'Vínculo ainda não definido.'),botao('Detalhar caso '+x.id,()=>consultar('caso',{},String(x.id))));
        if(op==='runs'||op==='run')card.append(botao('Resultados do run '+x.id,()=>consultar('resultados',{},String(x.id))));
        card.append(h('p',{},'Estado informado pela API: '+(x.status??'não informado')+'. Não representa evidência de execução local nem cobertura verificada.'));
      }
      if(servico==='github'){
        card.append(h('p',{},'Estado: '+(x.state||x.status||'não informado')+' · conclusão: '+(x.conclusion??'não informada')));
        if(op==='commits'&&x.sha)card.append(botao('Verificações '+x.sha.slice(0,7),()=>consultar('verificacoes',{},x.sha)));
        if(op==='prs'&&x.number)card.append(botao('Detalhar PR '+x.number,()=>consultar('pr',{},String(x.number))));
      }
      card.append(h('details',{},h('summary',{},'Dados retornados: IDs, passos, relações e origem'),dadosVisiveis(x)));
      if(servico==='qase'&&op==='caso'&&window.PrumoQualidadeV39)window.PrumoQualidadeV39.abrirModal('Detalhes do caso',card);else lista.append(card);
    }
    if(r.proxima!==null)lista.append(botao('Próxima página',()=>consultar(op,typeof r.proxima==='string'?{cursor:r.proxima}:{offset:r.proxima},id)));
  }
}
abas.tickets=async el=>{el.append(h('h1',{},'Tickets'));await consultaManual(el,'jira',{tickets:'Tickets do projeto',ticket:'Detalhe de ticket',campos:'Descobrir campos de critérios de aceite',comentarios:'Comentários de ticket'});};
abas.testes=async el=>{el.append(h('h1',{},'Testes'));await consultaManual(el,'qase',{suites:'Suites',casos:'Casos manuais e automatizados',caso:'Detalhe e passos do caso',planos:'Planos'});};
const execucoesExternas=async el=>{el.append(h('h2',{},'Execuções externas do Qase'));await consultaManual(el,'qase',{runs:'Runs',run:'Detalhe do run',resultados:'Resultados (informe o ID do run para filtrar)'});};
abas.automacoes=async el=>{
  el.append(h('h1',{},'Automações'));const e=estado.espaco;if(!e)return el.append(faltaEspaco());
  const a=await chamar(()=>api.espacoAutomacoes(e.id));if(a)el.append(h('h2',{},'Contrato local'),h('div',{class:'proj-chips'},h('span',{class:'chip-servico'},a.pastaLocal?'Pasta vinculada':'Sem pasta local'),h('span',{class:'chip-servico'},'k6 '+(a.k6Disponivel?'disponível':'não encontrado')),(a.frameworks||[]).map(f=>h('span',{class:'chip-servico'},f))),a.pastaLocal?h('p',{class:'suave'},a.pastaLocal):null,(a.capacidades||[]).length?h('ul',{},a.capacidades.map(c=>h('li',{},h('code',{},c)))):h('p',{class:'suave'},'Nenhuma automação declarada.'));
  await consultaManual(el,'github',{repositorio:'Repositório',branches:'Branches',commits:'Commits',prs:'Pull requests',pr:'Detalhe do PR',verificacoes:'Check runs de um commit (SHA completo)'});
};
abas.rastreabilidade=async el=>{
  el.append(h('h1',{},'Rastreabilidade'));const e=estado.espaco;if(!e)return el.append(faltaEspaco());
  el.append(h('p',{},'Uma associação declarada registra sua decisão. Não comprova cobertura, requisito aprovado ou execução. Nenhuma relação entre serviços é deduzida por nome.'),
    e.relacoes.length?h('div',{},e.relacoes.map(r=>h('div',{class:'nota'},h('strong',{},r.de.tipo+' '+r.de.id+' → '+r.para.tipo+' '+r.para.id),h('p',{},r.justificativa+' · DECLARADO PELO USUÁRIO · '+hora(r.at)),h('p',{},'Origem: '+r.de.origem+' → '+r.para.origem),e.vinculos.some(v=>v.id===r.de.vinculoId)&&e.vinculos.some(v=>v.id===r.para.vinculoId)?selo('VINCULADO'):selo('DESATUALIZADO')))):h('p',{},'Vínculo ainda não definido.'));
  const jira=e.vinculos.find(v=>v.servico==='jira'),qase=e.vinculos.find(v=>v.servico==='qase');if(!jira||!qase)return el.append(h('p',{},'Vincule Jira e Qase deste projeto para declarar uma associação ticket–caso.'));
  const ticket=campoPlataforma('Chave do ticket consultado',{id:'rastro-ticket'}),caso=campoPlataforma('ID do caso consultado',{id:'rastro-caso'}),porque=campoPlataforma('Justificativa da associação',{id:'rastro-justificativa',maxlength:1000});
  el.append(ticket.no,caso.no,porque.no,botao('Conferir origens e declarar vínculo',async()=>{
    const t=await chamar(()=>api.servicoConsultar(e.id,'jira','ticket',{},ticket.input.value));if(!t)return;const c=await chamar(()=>api.servicoConsultar(e.id,'qase','caso',{},caso.input.value));if(!c)return;
    const r=await chamar(()=>api.espacoAssociar(e.id,{de:{tipo:'jira',id:ticket.input.value,vinculoId:jira.id,origem:t.origem},para:{tipo:'qase',id:String(c.dados.id),vinculoId:qase.id,origem:c.origem},justificativa:porque.input.value}));if(r)mostrar('rastreabilidade');
  },'rastro-salvar'));
};
const historicoNucleo=abas.historico;
abas.historico=async el=>{const e=estado.espaco;if(e)el.append(h('details',{},h('summary',{},'Histórico dos vínculos e consultas deste projeto'),dadosVisiveis(e.historico)));await historicoNucleo(el);};
