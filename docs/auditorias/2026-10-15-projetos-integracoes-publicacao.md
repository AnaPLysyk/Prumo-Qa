# Prumo QA — projetos manuais, importação Qase e publicação de defeitos

Data: 15/10/2026. Implementação no repositório local, ainda sem release e sem homologação de contas externas.

## Fluxo implementado

1. **Projetos** conserva "Criar projeto manual" (nome/descrição) sem Jira, Qase ou GitHub. A ação "Vincular repositório local" abre o diálogo do Windows para selecionar uma pasta de código sem clonar Git. "Importar projetos do Qase" leva à tela Conexões.
2. **Conexões / Qase:** só token de API; consulta paginada temporária pelo processo principal, sem persistir antes da confirmação. Lista projetos por nome/código, busca, seleção individual e "Selecionar todos", importação após confirmação nativa com credencial criptografada. Relata adicionados, já existentes, falhas e conflitos.
3. **Importação** cria um projeto Prumo independente com vínculo Qase e não importa arquivos Git. Repetir com a mesma conexão não duplica; mesmo código em outra conexão fica bloqueado como `QASE_PROJECT_AMBIGUOUS` porque o Qase v1 não confirma uma identidade global única de conta.
4. **Tickets** mantém "Novo rascunho local" mesmo com Jira conectado. A lista já reúne origem local, Jira e Defeitos Qase e filtra por projeto. No rascunho, selecionar Local, Jira ou Defeitos Qase (apenas bugs). Qase tem campo de severidade quando selecionado; campos e permissões do Jira seguem separados.
5. **Publicação Qase** via operação `qase.criar_defeito`, POST /v1/defect/{code}, com escopo, prévia e confirmação nativa. Confirma via GET /v1/defect/{code}/{id}; usa marcador e releitura para conciliar resposta perdida. Se a API omitir dados exigidos para conciliação, recusa envio para não criar duplicata.
6. **GitHub**: repositório local é independente; a conta GitHub pode ser vinculada depois. GitHub Issues fica visivelmente indisponível para publicação de bugs até haver operação de escrita segura. GitHub Actions é pipeline, não destino de defeitos.

## API e documentação de referência

- Qase: https://developers.qase.io/reference/get-projects
- Qase defeitos GET: https://developers.qase.io/reference/get-defects
- Qase defeitos POST: https://developers.qase.io/reference/create-defect
- Qase defeito individual GET: https://developers.qase.io/reference/get-defect
- Jira: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/
- GitHub Issues: https://docs.github.com/en/rest/issues/issues
- GitHub Actions: https://docs.github.com/en/rest/actions/workflows

Documento complementar: docs/INTEGRACOES-ORIGEM-DESTINO.md.

## QA, limites e decisões

- Build, TypeScript, testes de importação, publicação e contratos realizados em ambiente local com dados sintéticos.
- Regressões direcionadas finais: **30/30 PASS** incluindo integridade frontend/backend, lista paginada, conflitos por credencial, confirmação de defeito e proteção contra duplicações.
- O perfil Electron real, tokens reais, contas Jira KAN / Qase PQ e publicação GitHub **não** foram usados nem declarados aprovados.
- O repositório de referência chamado Qualitest/Quality Control não foi localizado na pasta local de projetos; a referência histórica via GitHub também não pôde ser lida. Não afirmar que seu código foi copiado ou auditado.
- A regra de AGENTS.md proíbe testes automáticos que toquem bancos ou projetos externos. Browser/Electron permanece bloqueado no check protegido; precisa de homologação manual isolada e autorizada.
- Nenhum commit, push, release, alteração remota em Jira/Qase/GitHub ou deploy foi realizado.

## Resultado final de testes (15/10/2026)

- **Build, TypeScript e contratos IPC:** PASS.
- **Testes direcionados de estrutura, Qase e origens/destinos:** 30/30 PASS.
- **Backend completo protegido antes do último refinamento de conflito Qase:** 474/474 PASS. O teste de conflito e a regressão final foram posteriormente validados no check global.
- **npm run check final**, com barreira contra acesso a Chromium e SQLite: 567 testes, **530 PASS**, **37 FAIL somente devido ao bloqueio explícito AUDIT_DESKTOP_BLOCKED**; saída 1 pela política, sem falhas extras. Log: %LOCALAPPDATA%\\Temp\\prumo-check-final-importacao-destinos-20261015.log.
- **Critério ainda pendente:** testes visuais no Electron e leitura/publicação real nas contas Jira KAN/Qase PQ; dependem de exceção manual autorizada e credenciais substituídas.
- **Escopo não implementado:** publicação em GitHub Issues, execução de Actions como ação distinta; usuário não recebe opção ativa que finja estar implementada.
- **Nenhum commit, push, release ou deploy, e nenhuma escrita remota** neste trabalho.
