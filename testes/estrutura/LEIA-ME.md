# Testes de estrutura

Estes testes verificam a organização das telas, os contratos de arquivos e a sincronização frontend/Electron. São verificações de arquitetura, não testes unitários de regras nem smoke do aplicativo instalado.

Execute todos com `npm run check`. Para rodar só esta pasta, após o build:

```powershell
node --require ./testes/apoio/conhecimento-hook.cjs --experimental-test-module-mocks --test --test-concurrency=1 testes/estrutura/*.test.mjs
```

O seletor `ferramentas/testes/executar.mjs` descobre esses arquivos nas subpastas.
