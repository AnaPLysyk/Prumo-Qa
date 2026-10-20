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

O runner exclui testes `migracao*.test.mjs` da execução normal, com ou sem filtros, e registra cada um como `NOT_RUN|MIGRACAO_PERFIL_REAL`. O teste de migração do perfil instalado exige uma execução separada e autorizada; não há autorização para rodá-lo pelo seletor. A presença de qualquer valor em `PRUMO_APP_EXE` ou `PRUMO_MIGRACAO*` bloqueia a execução normal. O plano também rejeita migrações caso sejam passadas diretamente a ele. Nenhuma opção deste seletor remove essas barreiras.

Os testes reais de UI continuam dependendo da janela e das fixtures existentes; serviços externos não são autorização para testes contra contas reais. O hook não fornece sandbox de sistema operacional. Estes comandos não devem receber segredos ou acesso a banco real. `npm.cmd run check` continua sendo o gate principal após alterações.

Verificação do seletor: `node --test testes/unitario/backend/compartilhado/seletor-testes.test.mjs`. Esses testes conferem a organização real, filtros com fixtures em memória, argumentos do runner e recusa de perfil real sem executar a seleção. O seletor não inventa aprovação humana e preserva códigos de saída e falhas do Node.

`npm run check:isolado` (ou `test:selecionar -- --isolado`) roda só o que não precisa de janela: arquivos que usam o Electron ou de migração ficam `NOT_RUN|motivo|arquivo`, e `ferramentas/testes/bloquear-efeitos.cjs` recusa abrir navegador, carregar driver SQLite e conectar fora de localhost. Não é sandbox do sistema, e a falha de um teste selecionado continua falha; `--isolado --listar` mostra a divisão sem executar.

O `npm test` também usa esse seletor após o build, sem ignorar os bloqueios de migração. Os scripts npm `test:unitarios`, `test:smoke`, `test:regressao`, `test:backend` e `test:frontend` usam esse mesmo seletor; `test:selecionar -- --modulo agentes` permite combinações. Faça o build antes de executar os testes que usam `dist/`.

No contrato do próprio Prumo, `nucleo` executa arquivos sem janela, incluindo contratos, integração e persistência sintética; não significa apenas testes unitários. `unidade` permanece como alias compatível. `janela-1`…`janela-3` distribuem os arquivos Electron existentes. Todos continuam sujeitos à autenticação humana ao serem executados pelo produto.

O adaptador `backend/testes/reporters/prumo-node-reporter.mjs` transforma eventos de cada caso em resultados Prumo.  Skip e TODO viram `NOT_RUN`, suites agregadas não duplicam casos, e o processo com falha permanece `FAIL`. Um teste com subprocesso sintético confere eventos reais de PASS, FAIL, skip e TODO; isso não representa execução autorizada da capability do próprio Prumo.

## Conexões, login e jornada manual

- `conexoes-aparecem-nos-modulos` e `conexoes-alimentam-testes-e-tickets`: GitHub, Qase e Jira alimentam Projetos, Testes e Tickets; sem Qase e sem Jira as abas seguem usáveis, e a run sem Qase usa casos locais.
- `jornada-manual-e-publicacao`: tudo local sem conexão (run, resultado manual, rascunho de bug); depois de conectar, publicação no Qase, no Jira e no GitHub. Run com caso local nunca vai ao Qase.
- `entrada-pelo-github` (unitário e de tela) e `abre-na-entrada`: login por GitHub e Google com retorno local real e provedor simulado, primeiro acesso, nada habilitado sem concluir. O navegador é um double.
- `chat-claude-codex` e `localizar-cliente-de-ia`: chat com executor falso, travas dos argumentos e busca do CLI. Nenhum CLI real roda.

Os arquivos ficam em `testes/<natureza>/<camada>/<módulo>/`. Os testes de janela usam `abrir()`, que faz o primeiro acesso com a conta de teste; `{ semLogin: true }` testa a própria entrada.
