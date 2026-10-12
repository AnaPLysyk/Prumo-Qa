'use strict';
/** Identifica o título adequado para um registro remoto. */
function tituloItem(x){return x.fields?.summary||x.title||x.name||x.key||x.id||x.hash||x.sha||'Item';}
