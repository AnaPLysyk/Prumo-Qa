# Fontes oficiais da interface

Edite a interface **só** em `frontend/`. `app/renderer/` é gerado no build (`npm run build` ou `npm run frontend:sync`) e não é versionado; num clone novo ele ainda não existe.

`recursos.json` mapeia explicitamente os recursos transversais para seus caminhos de execução originais:

- `compartilhado/runtime/`: entrada `index.html`, aplicação `app.js` e todos os arquivos `i18n*.js`.
- `design-system/`: componentes, estilos de base, tema e modal compartilhado.
- `inicio/identidade/`: esfera, órbitas e robôs.
- `agentes/atividades/`: painel de atividades e seu estilo.
- `execucoes/operacao-v40.js`: apresentação das operações.

`npm run frontend:sync` sincroniza os recursos mapeados e os scripts e estilos das telas. `npm run frontend:check` detecta divergências. Documentos Markdown e o manifesto são dados de desenvolvimento e não são copiados.

Os bundles listados em `ferramentas/frontend/telas-modulares.json` são gerados das partes em `frontend/`; não têm segunda fonte editável. `app/renderer/status.css` é gerado de `app/suporte-status.json`. A biblioteca de terceiros em `app/renderer/vendor/` é o único conteúdo versionado ali.

Para editar traduções, altere `frontend/compartilhado/runtime/i18n*.js` e sincronize. Os paths distribuídos e a ordem de carregamento permanecem os mesmos.

A lógica correspondente permanece em `backend/<tela>/`. A interface usa Electron e JavaScript clássico, com IPC; login, cadastro, recuperação de senha e administração web continuam na Proposta.
