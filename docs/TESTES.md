# Seleção e classificação dos testes

Os arquivos ficam em `testes/<tipo>/<camada>/` (por exemplo `testes/contrato/mcp/`, `testes/seguranca/externa/`, `testes/e2e/ui/`), regras do repositório em `testes/estrutura/` e auxiliares em `testes/apoio/`; o mapa completo está em [testes/LEIA-ME.md](../testes/LEIA-ME.md) e `testes/estrutura/organizacao-testes.test.mjs` recusa arquivo fora do lugar. `testes/catalogo.json` enumera cada `.test.mjs` existente. Cada registro distingue a camada principal (`ui`, `ipc`, `mcp`, `regra`, `persistencia`, `integracao`, `estrutura`) das naturezas (`unidade`, `contrato`, `smoke`, `e2e`, `regressao`, `seguranca`, `migracao`, `acessibilidade`, `visual`). Um arquivo pode reunir naturezas e responsabilidades; sua camada principal não transforma todos os casos internos em testes unitários.

Os motivos e evidências registram títulos e imports das fontes lidas. Não são resultados de execução nem porcentagens de cobertura. `perfilReal` identifica os três testes de migração que dependem do perfil de instalação; a migração 2.9 usa fixtures e permanece selecionável normalmente.

Exemplos:

```powershell
node ferramentas/testes/executar.mjs --listar
node ferramentas/testes/executar.mjs --camada estrutura --listar
node ferramentas/testes/executar.mjs --camada mcp --natureza contrato --listar
node ferramentas/testes/executar.mjs --funcionalidade agentes --listar
node ferramentas/testes/executar.mjs --camada estrutura
```

Os filtros combinam com AND e valores desconhecidos falham. `--listar` apenas lê o catálogo e as pastas; não importa módulos da aplicação e não abre banco, janela ou rede. O catálogo precisa cobrir exatamente todos os arquivos, incluindo novos testes estruturais. Atualize-o ao criar um teste; não há classificação silenciosa de arquivos novos.

A execução usa `node:test`, concorrência 1, module mocks e o hook atual `testes/apoio/conhecimento-hook.cjs`, que substitui conhecimento por memória. Não existe build implícito: os testes que importam `dist/` exigem build prévio. Não há interface para comandos arbitrários ou caminhos de teste fornecidos pelo usuário.

Sem filtros, o runner seleciona todos os arquivos que não usam perfil real. Com filtros explícitos, selecionar uma migração de perfil real falha; ela pertence exclusivamente ao workflow de instalação isolado. A presença de qualquer valor em `PRUMO_APP_EXE` ou `PRUMO_MIGRACAO*` bloqueia a execução normal, mesmo que um arquivo de migração não tenha sido selecionado. Nenhuma flag deste seletor desativa essa proteção.

Os testes reais de UI continuam dependendo da janela e das fixtures existentes; serviços externos não são autorização para testes contra contas reais. O hook não fornece sandbox de sistema operacional. Estes comandos não devem receber segredos ou acesso a banco real. `npm.cmd run check` continua sendo o gate principal após alterações.

Verificação do seletor: `node --test testes/estrutura/seletor-testes.test.mjs`. Esses testes conferem catálogo real, filtros com fixtures em memória, argumentos do runner e recusa de perfil real sem executar a seleção. O seletor não inventa aprovação humana e preserva códigos de saída e falhas do Node.

Os scripts npm `test:unitarios`, `test:contratos`, `test:smoke`, `test:ui`, `test:mcp`, `test:persistencia` e `test:estrutura` usam esse mesmo seletor. `test:selecionar -- --funcionalidade agentes` permite combinações. Faça o build antes de executar os testes que usam `dist/`.

No contrato do próprio Prumo, `nucleo` executa arquivos sem janela, incluindo contratos, integração e persistência sintética; não significa apenas testes unitários. `unidade` permanece como alias compatível. `janela-1`…`janela-3` distribuem os arquivos Electron existentes. Todos continuam sujeitos à autenticação humana ao serem executados pelo produto.

O adaptador `reporters/prumo-node-reporter.mjs` transforma eventos de cada caso em resultados Prumo. `ferramentas/qa/qa-suite.mjs` grava esses resultados somente no arquivo da rodada informado pelo núcleo, por criação exclusiva; falha de gravação faz a rodada falhar. Skip e TODO viram `NOT_RUN`, suites agregadas não duplicam casos, e o processo com falha permanece `FAIL`. Um teste com subprocesso sintético confere eventos reais de PASS, FAIL, skip e TODO; isso não representa execução autorizada da capability do próprio Prumo.
