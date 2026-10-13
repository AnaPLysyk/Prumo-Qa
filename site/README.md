# Documentação pública

`npm.cmd run site` gera `site/public` a partir de `app/ajuda`, documentos públicos selecionados, `app/versoes.json` e `app/suporte-status.json`. Sem framework, dependências, backend ou acesso ao núcleo pelo visitante. Os arquivos gerados não são fonte editorial e ficam fora do Git.

A implementação fica em `site/gerar.mjs`, com a estrutura HTML comum em `site/componentes/pagina.mjs` e o CSS estático em `site/estilos/base.css`. As regras de animação das órbitas continuam geradas junto ao SVG e são acrescentadas ao CSS publicado. `site/gerar.mjs` mantém a entrada compatível e reexporta `gerarSite` e `markdown`; npm, Render e consumidores existentes continuam usando o mesmo comando. Os caminhos das fontes são resolvidos a partir do módulo, sem depender da pasta atual do terminal.

Render Static Site gratuito: repositório oficial, branch main, build `node site/gerar.mjs`, publish `site/public`, `SKIP_INSTALL_DEPS=true`. Configuração reproduzível em `render.yaml`. Auto deploy desligado para publicação deliberada. Somente esse novo serviço pertence à tarefa.

O build não compila o broker Windows. A mesma fonte de versões alimenta o desktop, o site e as release notes. Apenas versões marcadas como publicadas têm download oficial; código da 2.6 não deve ser anunciado como release até o CI de distribuição passar.

HTTPS protege a conexão do site. Assinatura Authenticode protege a identidade/integridade dos executáveis; uma não substitui a outra.

## Publicação automática

`.github/workflows/site.yml` gera o site a cada push em `main` que altere documentação, ajuda, catálogo de versões, capturas ou o gerador, confere que ele cita a versão publicada (e o SHA-256) e dispara o deploy do `prumo-qa-docs` pelo **Deploy Hook** guardado no segredo `RENDER_DEPLOY_HOOK_URL` do repositório. Sem o segredo, o fluxo gera e confere o site mas avisa que NÃO publicou. Na release: a tag gera o instalador; o commit que marca a versão como publicada (`app/versoes.json`) dispara a publicação do site com o link e o SHA-256 verificados.

Para ativar: Render › `prumo-qa-docs` › Settings › Deploy Hook (copie a URL) e GitHub › Settings › Secrets and variables › Actions › New repository secret › `RENDER_DEPLOY_HOOK_URL`.
