'use strict';
/** Integrações compartilhadas: interpreta texto e consulta serviço remoto. */
/** Lê o conteúdo textual recebido de uma integração externa. */
function textoExterno(v){if(v==null)return '';if(typeof v==='string')return v;if(v.type==='text')return v.text||'';if(Array.isArray(v.content))return v.content.map(textoExterno).join('\n');return JSON.stringify(v);}

/** Consulta Jira, Qase ou GitHub e mostra o resultado paginado. */
function classificacaoCaso(x){if(typeof x.isManual==='boolean')return x.isManual?(x.isToBeAutomated?'MANUAL · automação planejada':'MANUAL'):'AUTOMATIZADO';return ({0:'MANUAL',1:'MANUAL · automação planejada',2:'AUTOMATIZADO'})[x.automation]||'Classificação não informada pela API';}
function tituloItem(x){return x.fields?.summary||x.title||x.name||x.key||x.id||x.hash||x.sha||'Item';}

async function consultaManual(el,servico,operacoes){
  const e=estado.espaco;if(!e)return el.append(faltaEspaco());const v=e.vinculos.find(v=>v.servico===servico);
  if(!v)return el.append(h('div',{class:'vazio'},'Serviço '+servico+' não vinculado a '+e.nome+'. Configure e selecione o recurso em Projetos.'));
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


/** Reúne controles comuns para consultar e executar operações externas com confirmação. */
const area = (rotulo, ...f) => h('div', { class: 'campo' }, h('span', {}, rotulo), ...f);
const campoTexto = (rotulo, id, attrs = {}) => { const input = h('textarea', { id, rows: attrs.rows || 3, maxlength: attrs.maxlength || 4000 }); if (attrs.value) input.value = attrs.value; return { input, no: h('label', { class: 'campo' }, rotulo, input) }; };
const selecaoSimples = (id, opcoes, atual) => h('select', { id }, opcoes.map(([v, t]) => h('option', { value: v, selected: v === atual }, t)));
const seloOp = (s) => selo(s === 'CONFIRMADA' ? 'VALIDADO' : s === 'ENVIADA' ? 'PENDENTE' : s === 'BLOQUEADA' ? 'BLOCKED' : s === 'FALHA' ? 'ERRO' : s);
const nomeServ = { jira: 'Jira', qase: 'Qase', github: 'GitHub' };

/** Estado da habilitação de escrita por serviço no projeto selecionado. */
async function escritaDoProjeto(e) { const r = await chamar(() => api.escritaEstado(e.id)); const m = {}; for (const s of r?.servicos || []) m[s.servico] = s.escrita; return m; }
const vazio = () => document.createDocumentFragment();
const avisoEscrita = (servico, habilitada) => (habilitada ? vazio() : h('div', { class: 'nota', 'data-escrita-desligada': servico }, 'Escrita no ' + nomeServ[servico] + ' desligada. Habilite em Projetos.'));
/** Executa uma operação externa: a janela só pede; o principal confirma de forma nativa, executa e reconcilia. */
async function executarOperacao(e, operacao, parametros, anexo) {
  const r = await chamar(() => api.operacaoExecutar(e.id, operacao, parametros, anexo)); if (!r || r.canceled) return null;
  if (r.estado === 'CONFIRMADA') avisar(r.reutilizada ? 'Operação já concluída antes; nada foi duplicado.' : 'Operação concluída e confirmada no serviço.');
  else if (r.estado === 'BLOQUEADA') avisar('Operação bloqueada: ' + (r.erro || ''), true);
  else avisar('Operação não confirmada (' + r.estado + (r.erro ? ' · ' + r.erro : '') + '). Pode tentar de novo sem duplicar.', true);
  return r;
}
const linkRemoto = (r) => (r?.remoto ? [(r.remoto.chave || r.remoto.id || ''), r.remoto.url ? ' · ' + r.remoto.url : ''].join('') : '');
function painelResultado(r) { return r ? h('div', { class: 'nota', 'data-resultado-operacao': r.estado }, seloOp(r.estado), ' ', r.resumo, linkRemoto(r) ? h('div', { class: 'suave' }, linkRemoto(r)) : null, r.erro ? h('div', { class: 'suave' }, r.erro) : null) : null; }
const semProjetoServico = (el, servico) => { const e = estado.espaco; if (!e) { el.append(faltaEspaco()); return null; } if (!e.vinculos.some(v => v.servico === servico)) return null; return e; };

