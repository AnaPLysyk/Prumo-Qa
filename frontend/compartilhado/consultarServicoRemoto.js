'use strict';
/** Consulta Jira, Qase ou GitHub e mostra o resultado paginado. */
function tituloItem(x){return x.fields?.summary||x.title||x.name||x.key||x.id||x.hash||x.sha||'Item';}

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
