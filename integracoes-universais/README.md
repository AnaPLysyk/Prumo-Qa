# Prumo QA — núcleo OAuth multiplataforma (protótipo isolado)

**Estado: protótipo funcional com testes unitários; NÃO pronto para produção e NÃO integrado ainda ao Electron/servidor do Prumo.**

Este diretório é deliberadamente autocontido porque os arquivos do GitHub estão defasados em relação ao projeto local do Prumo QA. Não substituir arquivos locais nem mesclar sem revisão. Nenhum segredo real está embutido.

## Objetivo de experiência

1. A pessoa abre **Projetos > GitHub ou Jira > Conectar** no Prumo, em Windows, macOS ou Linux.
2. O Electron chama um endpoint autenticado do backend do Prumo (`POST /integracoes/iniciar`), que gera uma tentativa vinculada à conta e ao projeto.
3. O servidor devolve apenas uma URL de consentimento e identificador da tentativa; `shell.openExternal(url)` abre o navegador padrão no computador.
4. GitHub/Atlassian retornam ao callback HTTPS do servidor, que verifica `state`, prazo e consumo único; troca o `code` por tokens **apenas no servidor**, nunca no instalador.
5. O Electron consulta o status da tentativa usando **a sessão autenticada do Prumo**. O backend devolve a lista de recursos autorizados, sem tokens.
6. A pessoa escolhe repositório (GitHub) ou site/projeto (Jira). O backend vincula explicitamente ao projeto Prumo com leitura como padrão. A escrita exige outra permissão.
7. Ativar/desativar/remover são persistidos e verificados no backend antes de qualquer operação. Remover o vínculo não apaga o histórico; desconectar globalmente a conta e revogar credenciais é uma ação diferente.

## Implementação disponível

- `oauth-broker.mjs` — lógica de autorização de GitHub App (PKCE) e Atlassian Jira 3LO; callbacks com state de uso único; consulta de instalações/repositórios ou sites autorizados; seleção explícita do recurso; bloqueio de operações em vínculo desativado; Qase corretamente identificado como API Token.
- `oauth-broker.test.mjs` — testes de permissões mínimas, state, replay, segregação de contas, HTTPS, concorrência, estado do vínculo, seleção de recursos, ausência de segredos no status.
- `.github/workflows/integracoes-multiplataforma.yml` — matriz de testes Node 24 em `windows-latest`, `macos-latest` e `ubuntu-latest`. **A aprovação nesses runners só pode ser afirmada após o workflow executar no GitHub.**

Execute localmente: `node --test integracoes-universais/oauth-broker.test.mjs` (ou `node --test oauth-broker.test.mjs` dentro desta pasta).

## Pré-requisitos do produto (uma vez, não por usuário)

**GitHub**: registrar uma GitHub App **pública**, callback HTTPS estático do Prumo, permissões de leitura mínimas, seleção de repositórios na instalação. Guardar Client Secret/chave privada exclusivamente no servidor, sem inseri-los no Electron. Se for preciso acessar somente repositórios selecionados, validar os direitos do usuário **e** a instalação da App. A instalação e a autorização do usuário são etapas distintas.

**Jira Cloud**: registrar uma integração OAuth 2.0 (3LO) distribuível na Atlassian Developer Console, configurar callback HTTPS e escopos de leitura (verificar escopos específicos da API usada). Solicitar `offline_access` para refresh token rotativo e usar `accessible-resources` para encontrar sites. Nunca coletar API tokens pessoais como solução normal de Jira distribuído.

**Qase**: a API pública atualmente exige token no cabeçalho `Token`. Não fingir que abrir a página de tokens concluiu OAuth. Permitir App Token/Personal Token de maneira segura até haver mecanismo de integração de terceiros documentado.

## Trabalho obrigatório antes de produção

1. Conectar `start`, `complete`, `status`, `link`, `toggle` e `unlink` às rotas HTTP do **servidor já existente** do Prumo; não criar outro servidor sem necessidade.
2. Exigir autenticação e autorização de projeto em **todas** as rotas, com proteção CSRF para mutações web e rate limit. Não aceitar `actorId` diretamente do renderer: derive-o da sessão verificada do backend. No callback, use state aleatório, TTL e política de origem segura.
3. Substituir `Map` de tentativas por store compartilhada com TTL e consumo **atômico** (por exemplo, Redis ou tabela transacional); evitar perder autenticações quando o servidor reiniciar.
4. Implementar vault criptografado persistente; rotacionar refresh tokens do Jira **atomicamente** e implementar a renovação dos tokens expiráveis do GitHub. O protótipo não implementa renovação.
5. Fazer as consultas autorizadas **no backend**, usando o recurso vinculado. O backend atual do Prumo usa adaptadores locais de token: será necessário criar um transporte autenticado para esse modelo sem expor tokens ao IPC. Nunca devolver o `getAuthorizedConnection().credential` à janela Electron.
6. Tratar paginação completa, rate limits, retries, revogação, alterações de acesso e webhooks conforme necessidades reais.
7. Confirmar a instalação GitHub App e suas permissões, não confiar em `installation_id` vindo da URL de redirecionamento.
8. Criar UI consistente nas bolinhas: abrir autorização, escolher recurso, exibir status, desativar/reativar/remover. Continuar oferecendo seleção de pasta local e controle Manual/Prumo isolado por projeto.
9. Testar em CI nas três plataformas e executar E2E real com **contas de teste próprias** dos provedores e callback HTTPS hospedado. Não copiar credenciais reais para o Prumo Lab.

A configuração dos produtos GitHub e Atlassian, da hospedagem HTTPS, vault e banco é necessária uma única vez pelo mantenedor do Prumo. A pessoa usuária apenas autoriza no navegador.

## Fontes oficiais

- GitHub App: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- GitHub App PKCE: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
- Jira 3LO: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
- Qase token: https://developers.qase.io/reference/introduction-to-the-qase-api