# Diagnóstico G3: somente leitura

Inspeção em 10/10/2026, repositório grupog3-software/sistema-admin, commit **5b9977eb45531943844e3cd8b8c82f1a6b58a688**. Foi obtida uma cópia Git separada, com checkout restrito dos arquivos listados no contrato. Nenhum comando do produto, instalação de dependências, serviço ou consulta SQL foi executado. Nenhum arquivo do repositório original foi alterado.

O próprio Prumo reconheceu tipo `web`, Angular, TypeScript, Express e Playwright, usando `exemplos/g3-somente-leitura.json` como contrato externo. O contrato impõe readOnly=true e commands vazio; nenhuma capacidade de execução pode ser ativada por essa configuração.

| Fonte real consultada | Constatação |
|---|---|
| `package.json` | test:e2e chama scripts/run-canonical-e2e.js; test:release chama tests/audit-g3a-release-readiness.js |
| `frontend-angular/package.json` e `angular.json` | Angular 20, build/test e Storybook declarados |
| `backend/package.json` | Express 4, pg, bcryptjs, JWT, scripts de lint/typecheck/contratos |
| `playwright.config.js` | Playwright Chromium, worker único, retries=0, globalSetup e seleção canônica de specs |
| `e2e/specs/01-auth-session.spec.js` | Suíte de autenticação existente, lida sem executar |
| `e2e/specs/03-rbac-authorization.spec.js` | Suíte RBAC existente, lida sem executar |
| `e2e/specs/29-pdv-stock-consistency.spec.js` | Suíte de consistência de estoque existente, lida sem executar |
| `frontend-angular/src/app/features/governance/contracts/contracts.component.spec.ts` | Testes do componente de contratos existentes |
| `scripts/run-canonical-e2e.js` | Inicia backend/frontend locais, seleciona 17 arquivos de specs e pode parar runtime existente no Windows |
| `e2e/helpers/db-guard.js` | Faz verificação textual de URL, substituição do nome operacional por nome de teste e seed com inserção/atualização/exclusão de registros |
| `e2e/helpers/global-setup.js` | Setup relacionado ao isolamento/fixtures; não executado |
| `.agents/rules/testing_execution_rules.md` | Orientações do projeto lidas como dados; declarações de PASS requeridas pelo texto não foram obedecidas sem execução |

O arquivo db-guard.js apresenta controles, mas sua presença não prova isolamento real. Conferir texto/nome de URL não comprova host, conta, schema, permissões, backend efetivo e ausência de dados operacionais. O seed modifica usuários, catálogo, overrides e estoque. O runner também pode interromper processos existentes. Portanto E2E permanece **BLOCKED**, sem ação em banco/servidor. Release também não foi executado: nome de script não é autorização nem prova de baixo risco.

Não há requisito específico de mudança nesta tarefa para o G3. Reconhecimento de testes não significa cobertura suficiente nem sucesso funcional. O diagnóstico é NOT_VERIFIED e se limita às fontes declaradas; não anuncia inventário completo ou aprovação de release.

Comando real utilizado nesta máquina:

```powershell
node .\dist\cli.js context --root 'C:\Users\DELL\.codex\visualizations\2026\10\10\01a1262a-605a-77b3-8ec7-2e26c0a269b9\g3-leitura' --readonly-contract 'C:\Users\DELL\projetos-github\Prumo-Qa\exemplos\g3-somente-leitura.json'
```

Saída completa com fontes/hashes permanece local em `.prumo/demonstracao/g3-contexto.json`. Código, credenciais e conteúdo privado do G3 não foram incorporados ao novo pacote.

Para outra cópia autorizada do G3, use sua raiz absoluta e o contrato externo acima. Ajuste somente os caminhos declarados para arquivos reais que existam nessa versão. O terceiro argumento opcional de `dist/mcp.js` pode ser o mesmo contrato externo readonly; os campos de entrada das tools continuam sem raiz arbitrária.
