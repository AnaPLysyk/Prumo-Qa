'use strict';
/** Guarda o projeto selecionado e atualiza a tela Projetos. */
function escolherEspaco(e){estado.espaco=e;estado.root=e.raizContextos;salvarRaiz();mostrar('projetos');}
