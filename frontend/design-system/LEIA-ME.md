# Design System

Esta pasta contém as fontes oficiais dos componentes compartilhados (`ds.js`, `ds.css`), estilos de base (`estilo.css`, `qc.css`) e apresentação do modal (`qualidade-v39.js`, `qualidade-v39.css`). Edite os arquivos nesta pasta.

`npm run frontend:sync` gera as cópias `app/renderer/ds.js` e `app/renderer/ds.css`, nos mesmos caminhos carregados pelo Electron. `npm run frontend:check` confere se as cópias correspondem às fontes. O build também sincroniza os arquivos.

A documentação desta pasta não é distribuída como uma tela. As cores e os temas usam `estilo.css` e `qc.css` desta pasta; a migração preserva o conteúdo e a ordem de carregamento. O contrato dos componentes está em `docs/DESIGN-SYSTEM.md`. `status.css` continua gerado de `app/suporte-status.json` por `scripts/gerar-status.mjs`.

As abas mantêm um único botão no percurso de Tab. Setas esquerda/direita alternam e ativam a aba com retorno nas extremidades; Home e End ativam a primeira e a última. Os painéis do modal têm associação ARIA estável e carregam o conteúdo na primeira ativação. Uma resposta que termina depois de a pessoa trocar de aba permanece no painel correspondente, sem mudar a seleção.

`testes/desktop-design-system.test.mjs` verifica esse comportamento em Electron, com conteúdo sintético e armazenamento de conhecimento em memória pelo bootstrap de teste.
