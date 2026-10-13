# Testes avançados: código, casos Qase e catálogo

O código em `app/renderer/testes-v40.js` é carregado pela janela e depende de funções do arquivo `fluxos-v40.js`. Para preservar essa dependência, os dois arquivos são **gerados** de partes distribuídas por função.

A origem do Testes avançados está nesta pasta em `17 partes` com nome de função e frase inicial explicativa.

**Para editar:** abra a parte pelo nome da ação, altere somente essa função e execute `node ferramentas/frontend/gerar-telas-modulares.mjs` para atualizar o bundle.

**Para conferir:** `node ferramentas/frontend/gerar-telas-modulares.mjs --check`, `node ferramentas/frontend/verificar-modulos.mjs` e `npm.cmd run check`.

O bundle carregado na tela foi inicialmente reconstruído byte a byte, sem qualquer alteração no comportamento original. A fonte está em `ferramentas/frontend/telas-modulares.json`.
