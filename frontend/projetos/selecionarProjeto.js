'use strict';
/** Guarda o projeto selecionado e atualiza a tela Projetos. */
function escolherEspaco(e, destino='projetos'){
  estado.espaco=e; estado.root=e.raizContextos; salvarRaiz();
  if(destino==='testes') (estado.sub ||= {}).testes='repositorio';
  return mostrar(destino);
}
