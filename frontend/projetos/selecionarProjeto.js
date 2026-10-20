'use strict';
/** Projetos: guarda o projeto escolhido e abre a tela solicitada sem copiar sua lógica. */
function escolherEspaco(espaco, destino = 'projetos') {
  estado.espaco = espaco;
  estado.root = espaco.raizContextos;
  salvarRaiz();

  if (destino === 'testes') {
    (estado.sub ||= {}).testes = 'repositorio';
  }
  return mostrar(destino);
}
