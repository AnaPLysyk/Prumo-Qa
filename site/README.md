# Documentação pública

`npm.cmd run site` gera `site/public` a partir de `docs/ajuda`, documentos públicos selecionados, `docs/catalogo/versoes.json` e `docs/catalogo/suporte-status.json`. Sem framework, dependências, backend ou acesso ao núcleo pelo visitante. Os arquivos gerados não são fonte editorial e ficam fora do Git.

A implementação fica em `site/gerar.mjs`, com a estrutura HTML comum em `site/componentes/pagina.mjs` e o CSS estático em `site/estilos/base.css`. As regras de animação das órbitas continuam geradas junto ao SVG e são acrescentadas ao CSS publicado. `site/gerar.mjs` mantém a entrada compatível e reexporta `gerarSite` e `markdown`; npm, Render e consumidores existentes continuam usando o mesmo comando. Os caminhos das fontes são resolvidos a partir do módulo, sem depender da pasta atual do terminal.

As páginas técnicas mantêm o conteúdo completo das fontes. A página de contratos, gerada pelo catálogo do backend, recebe uma introdução simples e deixa os detalhes em uma seção expansível; o arquivo `docs/CONTRATOS.md` continua sem edição manual.

A página de versões agrupa os instaladores disponíveis por plataforma em cartões com o símbolo de cada marca; formatos e arquiteturas aparecem como opções compactas, sem repetir o nome do sistema.

Render Static Site gratuito: repositório oficial, branch main, build `node site/gerar.mjs`, publish `site/public`, `SKIP_INSTALL_DEPS=true`. Configuração reproduzível em `render.yaml`. Auto deploy desligado para publicação deliberada. Somente esse novo serviço pertence à tarefa.

O build não compila o broker Windows. A mesma fonte de versões alimenta o desktop, o site e as release notes. Apenas versões marcadas como publicadas têm download oficial; código da 2.6 não deve ser anunciado como release até o CI de distribuição passar.

HTTPS protege a conexão do site. Assinatura Authenticode protege a identidade/integridade dos executáveis; uma não substitui a outra.

## Publicação automática

`.github/workflows/site.yml` gera o site a cada push em `main` que altere documentação, ajuda, catálogo de versões, capturas ou o gerador, confere que ele cita a versão publicada (e o SHA-256) e dispara o deploy do `prumo-qa-docs` pelo **Deploy Hook** guardado no segredo `RENDER_DEPLOY_HOOK_URL` do repositório. Sem o segredo, o fluxo gera e confere o site mas avisa que NÃO publicou. Na release: a tag gera o instalador; o commit que marca a versão como publicada (`docs/catalogo/versoes.json`) dispara a publicação do site com o link e o SHA-256 verificados.

Para ativar: Render › `prumo-qa-docs` › Settings › Deploy Hook (copie a URL) e GitHub › Settings › Secrets and variables › Actions › New repository secret › `RENDER_DEPLOY_HOOK_URL`.

## Instaladores servidos pelo Render

No Render o build é `node site/construir-no-render.mjs` (o comando antigo `node scripts/gerar-site.mjs` chama o mesmo arquivo). Ele baixa da release oficial do GitHub os instaladores da última versão publicada (Windows, macOS Apple Silicon e Intel, Linux AppImage e .deb, nomes em `site/instaladores.mjs`), confere cada SHA-256 contra o `.sha256` da release (e, no Windows, também contra `docs/catalogo/versoes.json`) e os coloca em `site/public/download/` com um `instaladores.json`. Em seguida gera as páginas com os botões apontando para esses arquivos. Se o download falhar ou algum SHA-256 divergir (inclusive o do Windows), o site sai com os botões apontando para a release do GitHub e o motivo fica no log: nunca há link quebrado. Os de macOS e Linux entram quando já estiverem anexados à release (o fluxo `multiplataforma.yml` termina depois do Windows e republica o site); os que faltam são omitidos, nunca anunciados. Fora do Render (testes, CI, `npm run site` local) nada é baixado e os botões apontam para a release do GitHub.
