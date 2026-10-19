# Rotina de release

Toda versão nova segue os mesmos passos. Do passo 1 ao 4 o trabalho é no repositório; o passo 5 é a tag; o CI faz o resto e só termina quando a versão está disponível para todo mundo: release com instalador, catálogo, site, ajuda e aviso no aplicativo.

## 1. Número da versão

- `package.json` e `package-lock.json` (dois lugares no lock).
- `package.json` e `docs/catalogo/versoes.json`: versão atual e versões publicadas.

## 2. Catálogo de versões (`docs/catalogo/versoes.json`)

Entrada nova no topo com `status: "repositorio"`, `date: null`, `releaseUrl: null` e sem `installer`. Descreva só o que existe no código e nos documentos; limitações reais entram em `limitations`. As notas da release, a tela Ajuda › Versões e o site saem desta entrada.

## 3. Ajuda e site

- Páginas de ajuda em `docs/ajuda/` (PT e, quando houver, `.en.md`). Página nova: registrar em `backend/projetos/tipos/painel.ts` (`documentosAjuda`) e no índice da fonte `frontend/ajuda/mostrarAjuda.js`; sincronizar a cópia Electron.
- Textos novos da interface com tradução em `frontend/compartilhado/runtime/i18n-en-*.js`; sincronizar as cópias distribuídas com `npm run frontend:sync`.
- Capturas do site: `node ferramentas/site/capturar-site.mjs` (aplicativo real, dados sintéticos). Textos do site: `site/gerar.mjs`.
- `npm run site` e conferir `site/public` (escuro, claro e celular). O site e a ajuda do aplicativo leem os mesmos arquivos de `docs/ajuda`.

## 4. Verificação e main

`npm run check` sem falhas (os pulados são só instalador e migração, que rodam no CI). Commit e push para `main`. O push dispara o CI do Windows e o deploy do site (que passa a mostrar a versão nova no histórico como "código, sem release").

## 5. Tag

```
git tag vX.Y.Z <commit da main>
git push origin vX.Y.Z
```

## O que o CI faz sozinho a partir da tag

`.github/workflows/windows.yml`, numa máquina Windows limpa:

1. Suíte completa, instalador NSIS, atualização sobre a 2.2, 2.6 e 2.7 publicadas com dados preservados, janela e MCP do programa instalado, desinstalação.
2. SHA-256 do instalador e estado real da assinatura.
3. Release `vX.Y.Z` com o `.exe`, o `.sha256` e as notas geradas do catálogo; confere que o arquivo publicado é idêntico ao gerado.
4. `node ferramentas/release/publicar-versao.mjs X.Y.Z <sha256> <data>`: o catálogo passa a `publicada` (data, link da release e SHA-256), num commit na `main`.
5. Dispara `.github/workflows/site.yml`, que publica o site (Render) e espera o commit certo no ar (`build.txt`). O site passa a oferecer o download da versão com o SHA-256.

### macOS e Linux (em paralelo ao Windows)

`.github/workflows/multiplataforma.yml` roda na mesma tag, em máquinas macOS e Ubuntu: compila, roda os testes de plataforma (`testes/unitario/backend/aplicativo/multiplataforma.test.mjs` e `aprovacao-multiplataforma.test.mjs`), gera os instaladores (`npm run dist:mac` e `npm run dist:linux`: .dmg para Apple Silicon e Intel, .AppImage e .deb), gera o `.sha256` de cada um, abre o programa empacotado e confere janela e isolamento. Depois espera a release criada pelo fluxo do Windows e anexa os arquivos. Quando as duas plataformas terminam (mesmo que uma falhe), um único job dispara o `site.yml` de novo, para o site passar a oferecê-los. Os nomes dos arquivos vêm de `electron-builder.yml` e de `site/instaladores.mjs` e precisam coincidir com `nomeDoInstalador` do aplicativo (há teste).

Se o fluxo de macOS ou Linux falhar, a versão continua publicada para Windows e o site omite os instaladores que não estão na release (nunca anuncia um arquivo ausente). Corrija e rode o fluxo de novo pelo `workflow_dispatch` na tag; os arquivos são anexados com `--clobber`.

Depois disso, o aplicativo instalado (2.10.1 em diante) avisa sozinho: ao abrir e a cada 6 horas consulta a release mais recente e, uma vez por versão, acende o sino e mostra uma notificação do Windows que leva a Ajuda › Atualizações. Quem desligou o aviso continua podendo verificar pelo botão.

## Instaladores no Render

O build do site no Render roda `node site/construir-no-render.mjs` (`render.yaml`; o serviço atual ainda chama `node scripts/gerar-site.mjs`, que chama o mesmo arquivo): baixa da release os instaladores conferidos pelo SHA-256 e o site os serve do próprio Render (`/download/`). Se o GitHub não responder ou um SHA-256 divergir, o site sai com os botões apontando para a release (nunca com link quebrado) e o motivo fica no log; os de macOS e Linux entram quando já estiverem na release. Quem baixa não precisa passar pelo GitHub.

## Pré-requisito: publicação do site

O fluxo do site publica no Render pelo **Deploy Hook**, guardado no segredo `RENDER_DEPLOY_HOOK_URL` do repositório (Render › `prumo-qa-docs` › Settings › Deploy Hook; GitHub › Settings › Secrets and variables › Actions). Cadastrado em 16/10/2026. Sem ele, o fluxo falha na hora com a explicação; publique pelo Render em Manual Deploy › Deploy latest commit (ou pelo conector do Render). O fluxo aguarda no `build.txt` este commit (ou um mais novo da `main` que o contenha) e a versão publicada no site; sem essa prova fica vermelho. Gerar as páginas não comprova publicação.

As publicações do site rodam em fila, uma por vez (`concurrency` sem cancelamento): o push do commit da versão, o disparo do Windows depois do catálogo e o de macOS/Linux depois dos instaladores terminam cada um verde, sem um cancelar o outro.

## Conferência final

- `https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/vX.Y.Z`: instalador e `.sha256`.
- Site: Início ("Baixar a versão X.Y.Z") e Download (SHA-256 igual ao da release).
- Aplicativo: Ajuda › Versões mostra a versão como publicada; um aplicativo de versão anterior mostra o aviso.

## Se algo falhar

- Etapa antes da release: nada é publicado. Corrija, faça novo commit na `main` e mova a tag só se a release ainda não existir.
- Release criada mas catálogo ou site falharam: rode à mão `node ferramentas/release/publicar-versao.mjs X.Y.Z <sha256>` (o SHA-256 está no `.sha256` da release), faça o commit na `main` e o push; o site publica sozinho.
- Nunca apague uma release publicada nem reutilize o número de uma versão já baixada.
