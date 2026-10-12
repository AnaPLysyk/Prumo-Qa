'use strict';
/** Monta a consulta de casos e runs Qase na tela Testes. */
abas.testes=async el=>{el.append(h('h1',{},'Testes'));await consultaManual(el,'qase',{suites:'Suites',casos:'Casos manuais e automatizados',caso:'Detalhe e passos do caso',planos:'Planos'});};
const execucoesExternas=async el=>{el.append(h('h2',{},'Execuções externas do Qase'));await consultaManual(el,'qase',{runs:'Runs',run:'Detalhe do run',resultados:'Resultados (informe o ID do run para filtrar)'});};
