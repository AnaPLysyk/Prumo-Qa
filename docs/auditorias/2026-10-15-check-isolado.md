# Check isolado — separação auditável da homologação Electron

Data: 15/10/2026 — Prumo QA 2.14.1 — repositório local em desenvolvimento.

## Problema

O comando de check completo engloba testes Playwright que iniciam Electron. Quando a política `AGENTS.md` proíbe contato com banco e projeto externo, a barreira para abertura do Chromium impede esses cenários. Rodadas anteriores terminaram com 110 erros `TEST_ISOLATION_BLOCKED`, apesar de as demais validações terem passado.

Não modificar o status desses testes para PASS e não contornar a política para abrir o navegador em produção.

## Solução aplicada

- `ferramentas/testes/executar.mjs`: opção `--isolado` que classifica os arquivos por dependências conhecidas (Electron/Playwright e arquivos de migração). Cada arquivo não autorizado é explicitado como `NOT_RUN|motivo|arquivo`. O retorno de qualquer teste selecionado que falhe permanece falha.
- `ferramentas/testes/bloquear-efeitos.cjs`: proteção adicional de runtime contra inicialização de executáveis Electron/Chrome/Chromium/Edge via `child_process`, acesso `require` a drivers SQLite conhecidos e conexão TCP fora de localhost. **Não é sandbox do sistema** nem monitoramento completo de todos os efeitos; ESM e programas externos exigem revisão independente.
- `package.json`: comando independente `npm run check:isolado`, preservando `npm run check` sem mudanças.
- `README.md`: finalidade, limites e instruções do comando.
- `testes/unitario/backend/compartilhado/check-isolado.test.mjs`: quatro testes de unidade do filtro e bloqueador, usando somente fixtures e processos Node sintéticos.

## Execução

```powershell
cd C:\Users\DELL\projetos-github\Prumo-Qa
npm.cmd run check:isolado
npm.cmd run test:selecionar -- --isolado --listar
```

O segundo comando apenas lista os arquivos elegíveis e pendentes. É independente do comando geral, que continua sendo exigido para homologação completa.

## Evidências

A primeira rodada, antes do acréscimo dos quatro testes específicos do novo seletor, terminou com `CHECK_ISOLADO_RESULTADO=PASS` (código 0): **564/564 casos de teste PASS**, **92 arquivos elegíveis**, **37 arquivos marcados NOT_RUN**. Log: `C:\Users\DELL\AppData\Local\Temp\prumo-check-isolado-20261015.log`.

Quatro testes isolados adicionais do novo seletor passaram (4/4). A rodada geral protegida com a suíte atual e a segunda rodada isolada serão registradas em complemento abaixo.

## Limites

Este comando NÃO aprova o Electron E2E, Chromium, login humano, confirmações nativas, migrações reais, persistência SQLite real nem chamadas externas de Jira/Qase/GitHub. O check isolado serve para distinguir regressões verificadas e dependências ainda sem ambiente autorizado. Restrições adicionais precisam ser examinadas para usar o conjunto como sandbox de execução não confiável; os próprios testes precisam de revisão antes de serem considerados seguros.

A versão do pacote permanece 2.14.1. Não foi realizado commit, push, release ou deploy.

## Rodadas finais do seletor (após inclusão dos quatro testes novos)

**Check geral padrão protegido:** `npm.cmd run check` com `NODE_OPTIONS` apontando para o bloqueador de navegador/SQLite/TCP: **685 testes; 570 PASS, 110 FAIL, 5 SKIP; saída 1**. Todas as 110 falhas incluíram `electron.launch: TEST_ISOLATION_BLOCKED`; não houve ocorrência de `TEST_EXTERNAL_NETWORK_BLOCKED`. O check geral permanece **não homologado**. Log: `C:\Users\DELL\AppData\Local\Temp\prumo-check-normal-protegido-20261015.log`.

**Check isolado final:** `npm.cmd run check:isolado`: **568 testes; 568 PASS, 0 FAIL, 0 SKIP; saída 0**. **93 arquivos de teste elegíveis, 37 arquivos NOT_RUN** por dependência de Electron ou migração. Log: `C:\Users\DELL\AppData\Local\Temp\prumo-check-isolado-final-20261015.log`.

Os totais de 37/93 são arquivos de teste, enquanto 568/685 são casos reportados pelo runner; não confundir as unidades. É incorreto afirmar que os 110 testes bloqueados foram executados ou passaram. A ferramenta nova possibilita um gate **parcial e auditável** para o ambiente local sem autorização de navegador/banco, sem suprimir falhas de testes selecionados.
