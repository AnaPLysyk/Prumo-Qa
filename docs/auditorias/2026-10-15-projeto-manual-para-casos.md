# Continuação — projeto manual até casos de teste

**Data:** 15/10/2026  
**Versão local:** 2.14.1  
**Escopo:** criação manual de projetos e abertura contextual do repositório, com persistência controlada em pasta temporária.

## Problema observado

A tela Projetos já criava projetos sem Qase/GitHub e permitia vincular um repositório de código depois, mas não tinha atalho direto para a lista de casos. Era necessário selecionar o projeto e navegar manualmente até Testes › Repositório.

## Alteração aplicada

- `frontend/projetos/mostrarProjetos.js`: cada projeto exibe **Abrir casos de teste**. O botão só aparece se `PrumoConta.pode('testes')` permitir acesso à tela.
- `frontend/projetos/selecionarProjeto.js`: `escolherEspaco(e, destino='projetos')` mantém o comportamento existente de seleção e, para destino `testes`, define a subaba `repositorio` antes da navegação. O projeto e a raiz continuam salvos pelo fluxo existente.
- `frontend/compartilhado/runtime/i18n-en-v41.js`: tradução de **Abrir casos de teste** para inglês.
- Os arquivos distribuídos no Electron são sincronizados pela etapa existente do build, não devem ser editados em duplicidade.

## Nova regressão isolada

`testes/regressao/frontend/projetos/jornada-criacao-manual-casos.test.mjs`

Jornada com código real de frontend em Node VM, criação real de projeto Prumo, contrato local `qa.project.json`, repositório JSON temporário e serviços verdadeiros de criação de suíte/caso, com chamada ao contrato Zod. Nenhum Electron, Chromium, SQLite, rede, banco ou projeto externo.

**4/4 PASS:**
1. Criação de projeto manual sem Qase/GitHub, contrato local somente leitura e atalho de casos que seleciona `Testes › Repositório`.
2. Cadastro de suíte e caso com passos pelo formulário, relendo o registro persistido na pasta TEMP.
3. Dois projetos isolados: caso do primeiro não aparece no segundo.
4. Atalho oculto quando a pessoa não tem permissão de acesso à tela Testes.

**Verificações adicionais:**
- `npm.cmd run build`: PASS.
- `node ferramentas/testes/executar.mjs --natureza unitario --camada frontend`: **61/61 PASS**.
- Regressões integradas de frontend (nova jornada + anterior, usando `--experimental-test-module-mocks`): **9/9 PASS**.
- `git diff --check`: PASS.

## Limites e pendências

O teste verifica código real de formulários, seleção e serviços com DOM sintético, mas **não** comprova renderização visual, foco real do Electron, armazenamento interno do Chromium, sessão real ou integrações externas. O check geral continua protegido contra Electron/Chromium e SQLite, portanto testes Playwright reais permanecerão bloqueados até homologação que respeite a política de isolamento.

Nenhum commit, push, release, deploy ou alteração no perfil normal do Prumo.

## Check geral protegido

O resultado será acrescentado abaixo depois da execução.

### Resultado registrado em 15/10/2026

- `npm.cmd run check` com `NODE_OPTIONS` de isolamento para SQLite e Electron/Chromium: **681 testes, 566 PASS, 110 FAIL, 5 SKIP**, saída **1**.
- Todas as **110 falhas** registraram `electron.launch: TEST_ISOLATION_BLOCKED`, impedimento deliberado dos testes que iniciariam um navegador. **O check geral não passou** e a homologação E2E do Electron continua pendente.
- Os quatro cenários novos aparecem como aprovados na execução geral.
- Log da rodada: `C:\Users\DELL\AppData\Local\Temp\prumo-check-projeto-manual-20261015.log`.
- Preflight somente leitura: `node ferramentas/homologacao/preparar-ambiente.mjs --verificar` terminou com `PREPARADO_SEM_INICIAR`, **PASS**. Não abriu Electron nem criou perfil.
