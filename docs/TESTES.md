# Seleção e organização dos testes

Os arquivos ficam em `testes/<natureza>/<camada>/<módulo>/`: natureza `unitario`, `smoke` ou `regressao`; camada `backend` ou `frontend`; módulo igual à pasta da tela em `backend/` ou `frontend/` (ou `compartilhado`). Auxiliares ficam em `testes/apoio/`. Não há catálogo: o caminho do arquivo é a classificação, e `testes/unitario/backend/compartilhado/seletor-testes.test.mjs` recusa arquivo fora do lugar. Migração (`migracao*.test.mjs`) depende do perfil instalado e só roda no workflow de instalação.

Exemplos:

```powershell
node ferramentas/testes/executar.mjs --listar
node ferramentas/testes/executar.mjs --natureza smoke
node ferramentas/testes/executar.mjs --natureza unitario --camada backend --listar
node ferramentas/testes/executar.mjs --camada frontend --modulo agentes --listar
```

Os filtros combinam com AND e valores desconhecidos falham. `--listar` apenas lê as pastas; não importa módulos da aplicação e não abre banco, janela ou rede.

A execução usa `node:test`, concorrência 1, module mocks e o hook atual `testes/apoio/conhecimento-hook.cjs`, que substitui conhecimento por memória. Não existe build implícito: os testes que importam `dist/` exigem build prévio. Não há interface para comandos arbitrários ou caminhos de teste fornecidos pelo usuário.

Sem filtros, o runner seleciona todos os arquivos que não usam perfil real. Com filtros explícitos, selecionar uma migração de perfil real falha; ela pertence exclusivamente ao workflow de instalação isolado. A presença de qualquer valor em `PRUMO_APP_EXE` ou `PRUMO_MIGRACAO*` bloqueia a execução normal, mesmo que um arquivo de migração não tenha sido selecionado. Nenhuma flag deste seletor desativa essa proteção.

Os testes reais de UI continuam dependendo da janela e das fixtures existentes; serviços externos não são autorização para testes contra contas reais. O hook não fornece sandbox de sistema operacional. Estes comandos não devem receber segredos ou acesso a banco real. `npm.cmd run check` continua sendo o gate principal após alterações.

Verificação do seletor: `node --test testes/unitario/backend/compartilhado/seletor-testes.test.mjs`. Esses testes conferem a organização real, filtros com fixtures em memória, argumentos do runner e recusa de perfil real sem executar a seleção. O seletor não inventa aprovação humana e preserva códigos de saída e falhas do Node.

Os scripts npm `test:unitarios`, `test:smoke`, `test:regressao`, `test:backend` e `test:frontend` usam esse mesmo seletor; `test:selecionar -- --modulo agentes` permite combinações. Faça o build antes de executar os testes que usam `dist/`.

No contrato do próprio Prumo, `nucleo` executa arquivos sem janela, incluindo contratos, integração e persistência sintética; não significa apenas testes unitários. `unidade` permanece como alias compatível. `janela-1`…`janela-3` distribuem os arquivos Electron existentes. Todos continuam sujeitos à autenticação humana ao serem executados pelo produto.

O adaptador `backend/testes/reporters/prumo-node-reporter.mjs` transforma eventos de cada caso em resultados Prumo.  Skip e TODO viram `NOT_RUN`, suites agregadas não duplicam casos, e o processo com falha permanece `FAIL`. Um teste com subprocesso sintético confere eventos reais de PASS, FAIL, skip e TODO; isso não representa execução autorizada da capability do próprio Prumo.

## Conexões, login por provedor e jornada manual

- `testes/regressao/frontend/projetos/conexoes-aparecem-nos-modulos.test.mjs` e `testes/regressao/frontend/testes/conexoes-alimentam-testes-e-tickets.test.mjs`: GitHub, Qase e Jira conectados alimentam Projetos, Testes (Repositório, Runs, Planos) e Tickets; sem Qase e sem Jira as abas seguem usáveis, e a run sem Qase usa casos locais.
- `testes/regressao/backend/testes/jornada-manual-e-publicacao.test.mjs`: primeiro sem nenhuma conexão (run local, resultado manual, rascunho de bug) e só depois, conectando Jira, Qase e GitHub, a publicação; run com caso local nunca vai ao Qase.
- `testes/unitario/backend/login/entrada-pelo-github.test.mjs` e `testes/regressao/frontend/login/entrada-pelo-github.test.mjs`: login pelo GitHub e pelo Google com servidor de retorno real em 127.0.0.1 e provedor simulado; cadastro novo pendente, nada habilitado sem concluir, identidade por provedor e id. O navegador é um double: nada é aberto nem enviado.
- `testes/unitario/backend/agentes/chat-claude-codex.test.mjs`, `testes/regressao/frontend/agentes/chat-claude-codex.test.mjs` e `testes/unitario/backend/conexoes/localizar-cliente-de-ia.test.mjs`: chat com Claude e Codex usando executor falso, travas dos argumentos e busca do CLI. Nenhum CLI real roda.
