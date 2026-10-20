'use strict';
/** Conexões: seleção de projetos Qase em uma prévia temporária, sem duplicar formulários. */
function criarApresentacaoProjetosQase(controleQase,limparPrevia){
  function apresentarProjetos(pre,container){
    controleQase.previaId=pre.previaId;
    const projetos=pre.projetos||[];
    const filtro=h('input',{id:'qase-busca',type:'search',placeholder:'Buscar por nome ou código','aria-label':'Buscar projetos Qase',autocomplete:'off'});
    const todos=h('input',{type:'checkbox',id:'qase-todos'});
    const lista=h('div',{id:'qase-projetos-lista',class:'cx-lista',role:'group','aria-label':'Projetos do Qase'});
    const status=h('span',{id:'qase-status',class:'suave'});
    const selecao=new Set();
    const visiveis=()=>projetos.filter(p=>(p.nome+' '+p.codigo).toLocaleLowerCase().includes(filtro.value.toLocaleLowerCase()));
    function render(){
      const encontrados=visiveis();
      lista.replaceChildren(...encontrados.map(p=>{
        const ck=h('input',{type:'checkbox','data-codigo':p.codigo,'aria-label':p.nome+' · '+p.codigo});
        ck.checked=selecao.has(p.codigo);
        ck.addEventListener('change',()=>{if(ck.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);contar();});
        return h('label',{class:'cx-item'},ck,h('span',{class:'cx-item-nome'},p.nome),chipCx(p.codigo),
          p.jaImportado?chipCx('já no Prumo','ok'):p.conflitoOutraConta?chipCx('mesmo código em outra conexão','aviso'):null);
      }));
      if(!encontrados.length)lista.append(h('p',{class:'suave cx-vazio'},'Nenhum projeto corresponde à busca.'));
      todos.checked=encontrados.length>0&&encontrados.every(p=>selecao.has(p.codigo));
      contar();
    }
    function contar(){status.textContent=selecao.size+' de '+projetos.length+' selecionado(s)';importar.disabled=!selecao.size;}
    todos.addEventListener('change',()=>{for(const p of visiveis()){if(todos.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);}render();});
    filtro.addEventListener('input',render);
    const importar=primaria(botao('Adicionar ao Prumo',async()=>{
      if(!selecao.size){avisar('Selecione pelo menos um projeto Qase.',true);return;}
      status.textContent='Adicionando projetos…';
      const resultado=await chamar(()=>api.qaseImportar(controleQase.previaId,[...selecao]));
      if(!resultado){status.textContent='Não foi possível concluir a importação.';return;}
      if(resultado.canceled){status.textContent='Importação cancelada. Nenhum projeto foi adicionado.';return;}
      controleQase.previaId=null;
      status.textContent=resultado.adicionados.length+' adicionados · '+resultado.existentes.length+' já existentes · '+resultado.falhas.length+' com falha';
      if(resultado.falhas.length)status.textContent+=' ('+resultado.falhas.map(f=>f.codigo+': '+f.erro).join(', ')+')';
      else{avisar('Projetos Qase vinculados ao Prumo. Você pode selecioná-los em Projetos.');mostrar('projetos');}
    },'qase-importar'));
    container.replaceChildren(
      h('div',{class:'cx-lista-cab'},h('strong',{},'Projetos do token'),infoCx('Escolha quais projetos usar no Prumo. Nada é enviado ao Qase nesta etapa.')),
      h('div',{class:'cx-barra'},filtro,h('label',{class:'cx-todos'},todos,' Selecionar todos')),
      lista,
      h('div',{class:'cx-rodape'},status,h('span',{class:'cx-acoes'},botao('Cancelar importação',async()=>{await limparPrevia();container.replaceChildren();}),importar)));
    render();
  }
  return apresentarProjetos;
}
