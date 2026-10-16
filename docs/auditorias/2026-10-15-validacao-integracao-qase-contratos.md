# Prumo QA — confirmação dos dados Qase e origem Jira

Data: 15/10/2026. Estado: validação técnica com serviços simulados; **não** é homologação real de Jira KAN ou Qase PQ.

## Alterações aplicadas
- `backend/testes/integracoes/criarCasoNoQase.ts`: depois de criar um caso, a confirmação não depende mais só do ID. O Prumo relê título, descrição, pré/pós-condições, passos com dados e resultados, tipo de automação e campos opcionais enviados. Se diferirem, a operação permanece não confirmada.
- `backend/testes/integracoes/criarSuiteNoQase.ts`: passa a confirmar ID, título, descrição e suíte pai pela leitura no Qase. Distingue suítes homônimas de raízes/hierarquias diferentes nas buscas e reconciliação.
- `backend/testes/integracoes/associarTicketAoCasoNoQase.ts`: confirma o vínculo apenas se o ticket exato aparecer em `external_issues` após a operação.
- `frontend/testes/fluxos-casos-qase.parte.js`: antes de criar um caso Qase com ticket Jira, exige consultar o ticket na instância e projeto Jira vinculados. Falha ou chave de outro projeto impede o envio ao Qase.

## Validações dirigidas
- Cinco testes de confirmação do caso recém-criado, três cenários de suíte e associação, todos com dados de API simulados.
- Quatro cenários dinâmicos adicionais no formulário Qase, em Node VM com DOM sintético: ticket existente, ausente, de outro projeto e criação não confirmada.
- Simulador existente `testes/regressao/backend/conexoes/escrita.test.mjs` passou nos fluxos de criação, edição, idempotência, resposta perdida e escrita controlada.
- Execução de build e testes direcionados da alteração: **PASS**. Nenhuma rede externa, Electron real ou perfil do usuário utilizado.

## Limites
- Releitura não substitui homologação da resposta Qase real, especialmente em projetos com paginação extensa, formatos de tags ou campos opcionais diferentes.
- Uma associação declarada no Prumo não representa resultado de teste ou cobertura aprovada.
- O contrato `AGENTS.md` impede testes que toquem banco ou projeto externo. A jornada real do usuário precisa de execução separada em ambiente isolado e com autorização adequada.
- Nenhum commit, push, deploy ou release foi realizado nesta etapa.

## Regressão final da rodada
- `npm run build`: PASS.
- Regressões dirigidas Qase/Jira/GitHub: PASS, inclusive criação/releitura, suite pai, associação ao ticket e idempotência.
- `node ferramentas/testes/executar.mjs --camada backend` com bloqueio de SQLite: **446/446 PASS**, código 0. Log: `%LOCALAPPDATA%\\Temp\\prumo-backend-qase-integracao-20261015.log`.
- `npm run check` com proteção contra SQLite e importação do Playwright: **531 totais, 494 PASS, 37 FAIL exclusivamente pelo bloqueio intencional `AUDIT_DESKTOP_BLOCKED`**, código 1. Log: `%LOCALAPPDATA%\\Temp\\prumo-check-qase-integracao-20261015.log`. Não equivale a aprovação global e não valida GUI Electron.
- Sem chamadas reais às APIs Jira/Qase nesta rodada. O fluxo manual na janela do Prumo e a confirmação das alterações nos serviços KAN/PQ permanecem `NOT_RUN`, conforme `2026-10-15-roteiro-homologacao-jira-qase.md`.

## Regressão de paginação e prevenção de duplicatas (continuação)
- **Falha encontrada:** `listarNoQase.ts` usava sempre `offset=0` e no máximo 100 registros. Casos e suítes depois da primeira página poderiam não ser encontrados, assim como planos/runs recuperáveis após perda da resposta.
- **Correção:** percorrer páginas Qase com `offset` progressivo e `limit` até 100 por chamada, preferir `filtered` ao `total` quando presente, validar contagens e impedir resultado parcial silencioso. Respostas sem `entities`, com contagem inconsistente ou com mais de **1000 registros** são recusadas com `SERVICE_RESPONSE_INVALID`, antes de qualquer conclusão de inexistência.
- **Impacto:** as buscas de duplicata de caso e suíte e as reconciliações de plano/run compartilham o mesmo leitor paginado. O limite é deliberado e deve ser configurado/revisto se a homologação real mostrar consultas acima de 1000 resultados filtrados.
- **Testes:** `testes/regressao/backend/conexoes/paginacao-completa-qase.test.mjs` cobre 3 páginas, duplicata na terceira, reconciliação de plano, ausência de contagem, contagem inválida e teto de segurança (sem rede). As 24 regressões direcionadas da paginação e escrita Qase/Jira/GitHub passaram.
- **Check protegido:** `npm run check` gerou **537 testes, 500 PASS, 37 FAIL**, todos os 37 por `AUDIT_DESKTOP_BLOCKED` (importação do Playwright bloqueada intencionalmente). Código de saída 1, **não constitui aprovação global**. Log: `%LOCALAPPDATA%\\Temp\\prumo-check-paginacao-qase-20261015.log`.
- **Homologação remota:** não executada nesta rodada. Nenhum projeto Qase/Jira real foi escrito, e não há evidência de funcionamento visual Electron. Seguir o roteiro separado e rotacionar credenciais antes do teste.

- **Regressão completa de back-end** com proteção contra acesso a SQLite: **452/452 PASS**, saída 0. Log: `%LOCALAPPDATA%\\Temp\\prumo-backend-paginacao-qase-20261015.log`. `git diff --check`: PASS. Sem commit, push ou deploy.

## Correção de confirmação Jira Cloud por releitura Qase
- GET de caso Qase só fornece relações externas quando solicitado via `include=external_issues`, segundo a documentação oficial do Qase: https://developers.qase.io/reference/get-case.
- A operação `qase.criar_caso`, quando recebe ticket, exige confirmação de correspondência de ID e vínculo Jira Cloud após releitura com `include=external_issues`. Caso sem vínculo não pode receber `CONFIRMADA` por conta apenas do ID e dados do caso.
- As operações `qase.associar_ticket` de reconciliação e confirmação também consultam o caso com `include=external_issues` e validam a origem `jira-cloud`, evitando aceitar outras integrações com a mesma chave.
- Testes com simulação da API comprovam o endpoint com `include`, não confirmação de vínculo ausente ou de Jira Server, reconciliação da associação e preservação das regras de escrita. Build e regressões direcionadas **25/25 PASS**, sem rede externa.

### Regressão após correção do parâmetro include
- `npm run build`: PASS.
- 25 testes direcionados de criação/associação Qase, integração simulada Jira/GitHub e paginação: **25/25 PASS**.
- `npm run check`, com proteção `no-database-no-desktop.cjs`: **538 totais; 501 PASS; 37 FAIL exclusivamente por `AUDIT_DESKTOP_BLOCKED`**; código 1 (sem aprovação global). Log: `%LOCALAPPDATA%\\Temp\\prumo-check-qase-external-issues-20261015.log`.
- Camada de back-end com proteção SQLite: **453/453 PASS**, código 0. Log: `%LOCALAPPDATA%\\Temp\\prumo-backend-qase-external-issues-20261015.log`.
- Contratos reais da API consultados em `https://developers.qase.io/reference/get-case` e `https://developers.qase.io/reference/case-attach-external-issue`. **Não houve execução das APIs contra contas reais ou teste visual Electron**. Nenhum commit, push ou deploy nesta etapa.

## Confirmação integral de planos e runs — continuidade
- **Falha corrigida:** `qase.criar_plano` não tinha função `confirmar`, então o resultado de POST era tratado como suficiente. `qase.criar_run` só verificava o ID depois do GET.
- Ambas as operações agora usam GET de recurso específico, conferindo ID, título, descrição com marcador de idempotência e **identificadores exatos de todos os casos**. Runs usam `include=cases`, além de `include_all_cases=false`, `is_autotest` e plano selecionado quando presente.
- `conferirIdsDoObjetoQase.ts` entende IDs numéricos, strings numéricas ou objetos com `id`/`case_id`; rejeita omissões, duplicatas, outros valores e conjuntos diferentes. Respostas incompletas ficam `ENVIADA / NOT_CONFIRMED` em vez de receber `CONFIRMADA` sem prova.
- Testes dirigidos: `testes/regressao/backend/conexoes/confirmacao-plano-run-qase.test.mjs`; cinco testes de releitura e diferenças. Build e 15 testes combinados com simulador de escrita: PASS, sem rede.
- Endpoints revisados na documentação Qase: https://developers.qase.io/reference/get-plan, https://developers.qase.io/reference/get-run e https://developers.qase.io/reference/create-run.
- **Ainda não homologado com uma conta Qase real:** o formato da coleção `cases` retornada pela API precisa ser conferido. O algoritmo bloqueia confirmação caso o formato seja incompleto/desconhecido, sem apagar ou reexecutar a criação inadvertidamente.

### Fechamento técnico da correção de planos/runs
- `npm run leia-me`: PASS, documentação modular regenerada.
- `npm run check` com proteção SQLite/Chromium: **543 testes, 506 PASS, 37 FAIL** (todos bloqueios deliberados `AUDIT_DESKTOP_BLOCKED`); código 1. Log: `%LOCALAPPDATA%\\Temp\\prumo-check-plan-run-20261015.log`. **Não declarar aprovação global.**
- `node ferramentas/testes/executar.mjs --camada backend` com bloqueio SQLite: **458/458 PASS**, código 0. Log: `%LOCALAPPDATA%\\Temp\\prumo-backend-plan-run-20261015.log`.
- **Próxima condição de liberação:** validar na aplicação Electron isolada e consultar planos/runs reais do Qase para confirmar o formato de `cases`. Essas ações não foram executadas devido à política atual de testes do repositório.

## Recuperação de caso Qase criado com associação Jira incompleta
- Correção: ao repetir uma operação que havia criado o caso mas falhou ao vincular o ticket, `executarOperacaoUmaVez` agora transmite à reconciliação o `remoto.id` já registrado para a **mesma chave de operação e escopo de conexão**.
- `criarCasoNoQase.reconciliar` recupera pelo ID anterior, relê e compara **todos os dados do caso** antes de qualquer nova escrita. Consulta `external_issues` do Jira Cloud. Se o vínculo não existe, envia somente a associação pendente; se já existe, não repete; caso os dados do caso divergirem, recusa a atualização.
- Sem ID anterior, não vincula automaticamente um ticket a um caso encontrado apenas por título. A confirmação remota permanece obrigatória; não se fabricam evidências de cobertura.
- Testes novos: `testes/regressao/backend/conexoes/recuperar-vinculo-qase-jira.test.mjs` (falha parcial seguida de recuperação, alteração remota e associação já existente). **13/13 testes direcionados PASS**, incluindo a suíte geral simulada de escrita. Nenhuma conexão remota nem banco externo foram acessados.

### Fechamento da recuperação de vínculo parcial Qase/Jira
- `npm run leia-me`: PASS; documentação do back-end regenerada.
- `npm run build`: PASS. 13/13 testes de escrita e recuperação isoladas passaram.
- `npm run check` com guardas de SQLite e Chromium: 546 testes, **509 PASS e 37 bloqueados** por `AUDIT_DESKTOP_BLOCKED`, exit code 1 (não é aprovação global). Log: `%LOCALAPPDATA%\\Temp\\prumo-check-recuperacao-qase-20261015.log`.
- `node ferramentas/testes/executar.mjs --camada backend` com guarda SQLite: **461/461 PASS**, exit code 0. Log: `%LOCALAPPDATA%\\Temp\\prumo-backend-recuperacao-qase-20261015.log`.
- Implementação de reconciliação usa o ID remoto do livro-razão validado para evitar POST duplicado; o caso é relido e validado antes de associar o Jira faltante. Sem ID confiável, um caso encontrado somente por título não autoriza associação automática.
- Os serviços nesta rodada foram simulados. A experiência real de escrita em Jira e Qase pelo Electron segue `NOT_RUN` até homologação isolada e consentimento em conformidade com `AGENTS.md`. Não houve commit, push ou deploy.
