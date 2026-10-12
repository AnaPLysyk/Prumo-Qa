# Rotina de release

Toda versão nova segue os mesmos passos. Do passo 1 ao 4 o trabalho é no repositório; o passo 5 é a tag; o CI faz o resto e só termina quando a versão está disponível para todo mundo: release com instalador, catálogo, site, ajuda e aviso no aplicativo.

## 1. Número da versão

- `package.json` e `package-lock.json` (dois lugares no lock).
- `README.md`: título e linha "Versão atual".

## 2. Catálogo de versões (`app/versoes.json`)

Entrada nova no topo com `status: "repositorio"`, `date: null`, `releaseUrl: null` e sem `installer`. Descreva só o que existe no código e nos documentos; limitações reais entram em `limitations`. As notas da release, a tela Ajuda › Versões e o site saem desta entrada.

## 3. Ajuda e site

- Páginas de ajuda em `app/ajuda/` (PT e, quando houver, `.en.md`). Página nova: registrar em `src/painel.ts` (`documentosAjuda`) e no índice de `app/renderer/telas/ajuda/mostrarAjuda.js`.
- Textos novos da interface com tradução em `app/renderer/i18n-en-*.js`.
- Capturas do site: `node scripts/capturar-site.mjs` (aplicativo real, dados sintéticos). Textos do site: `scripts/gerar-site.mjs`.
- `npm run site` e conferir `site/public` (escuro, claro e celular). O site e a ajuda do aplicativo leem os mesmos arquivos de `app/ajuda`.

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
4. `node scripts/publicar-versao.mjs X.Y.Z <sha256> <data>`: o catálogo passa a `publicada` (data, link da release e SHA-256), num commit na `main`.
5. Dispara `.github/workflows/site.yml`, que publica o site (Render) e espera o commit certo no ar (`build.txt`). O site passa a oferecer o download da versão com o SHA-256.

Depois disso, o aplicativo instalado (2.10.1 em diante) avisa sozinho: ao abrir e a cada 6 horas consulta a release mais recente e, uma vez por versão, acende o sino e mostra uma notificação do Windows que leva a Ajuda › Atualizações. Quem desligou o aviso continua podendo verificar pelo botão.

## Pré-requisito: publicação do site

O fluxo do site publica no Render pelo **Deploy Hook**, guardado no segredo `RENDER_DEPLOY_HOOK_URL` do repositório (Render › `prumo-qa-docs` › Settings › Deploy Hook; GitHub › Settings › Secrets and variables › Actions). Sem ele o fluxo fica vermelho e o site não muda; enquanto isso, publique pelo Render em Manual Deploy › Deploy latest commit.

## Conferência final

- `https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/vX.Y.Z`: instalador e `.sha256`.
- Site: Início ("Baixar a versão X.Y.Z") e Download (SHA-256 igual ao da release).
- Aplicativo: Ajuda › Versões mostra a versão como publicada; um aplicativo de versão anterior mostra o aviso.

## Se algo falhar

- Etapa antes da release: nada é publicado. Corrija, faça novo commit na `main` e mova a tag só se a release ainda não existir.
- Release criada mas catálogo ou site falharam: rode à mão `node scripts/publicar-versao.mjs X.Y.Z <sha256>` (o SHA-256 está no `.sha256` da release), faça o commit na `main` e o push; o site publica sozinho.
- Nunca apague uma release publicada nem reutilize o número de uma versão já baixada.
