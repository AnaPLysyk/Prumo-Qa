# Prumo QA: origem dos projetos e destino de publicação

15–16/10/2026 — arquitetura e evidências. Homologado com contas reais da autora (Qase PQ, Jira KAN, GitHub Prumo-QA-Lab) em 15–16/10/2026; cada conta tem plano e permissões próprios.

## Projeto Prumo é a identidade central

Um projeto Prumo usa UUID próprio, pode ser local/manual e mantém vínculos independentes com Qase, Jira e GitHub. O nome igual não comprova identidade: vínculo externo exige a conexão, o serviço, a instância e o ID/código remoto. Trocar projeto deve renovar os dados apresentados e nunca usar informações do projeto anterior. Não apagar projetos locais ou outros vínculos durante a importação.

**Criação manual:** Projetos > Criar projeto manual > Nome/descrição > salvar. Inicia sem qualquer conexão Qase, Jira ou GitHub. Uma pasta de código pode ser escolhida manualmente, e depois pode ser associada a um repositório GitHub, se desejar.

**Importação Qase:** Conexões > Qase > token de API > carregar projetos > selecionar quais importar > confirmação nativa > credencial protegida e projetos Prumo com vínculo Qase. Não requer nome de conexão manual, não clona Git e não cria projetos no Qase; importa referências dos projetos já existentes. Escrita Qase segue desligada.

**Vínculos posteriores:** um projeto importado do Qase pode receber vínculos Jira/GitHub por escolha explícita. Um projeto manual pode ter Qase, Jira e GitHub adicionados depois, sem adivinhar correspondência por nomes.

## Um recurso, um projeto

O mesmo projeto Jira, projeto Qase, repositório GitHub ou pasta local não pode estar em mais de um projeto Prumo (`RESOURCE_ALREADY_LINKED` e `WORKSPACE_LOCAL_DUPLICATE`). A identidade do recurso é o serviço, a instância e o ID ou código, sem contar a conta usada para conectar. A regra vale ao criar projeto a partir de um recurso, ao vincular e na importação; remover o vínculo libera o recurso. Duplicidades gravadas antes da regra não são apagadas: aparecem como aviso no mapa de vínculos dos agentes (`duplicidades`).

## O que cada integração representa

| Serviço | O que o Prumo lê | O que o Prumo publica (catálogo fechado) |
| --- | --- | --- |
| Local Prumo | projetos manuais, casos e suítes locais, rascunhos de bug/melhoria, runs locais | nada sai do computador; é o destino padrão |
| Qase | projetos, suites, casos, tipos de caso (campos de sistema), planos, runs, resultados e **defeitos** (filtro open, in_progress, resolved, invalid) | caso, suite, plano, run, resultados, anexo, vínculo caso-ticket e **defeito** (`qase.criar_defeito`) |
| Jira Cloud | tickets do projeto vinculado, campos, issue types, transições, histórico, anexos e comentários | ticket (bug ou melhoria pelo issue type do projeto), edição, comentário, anexo, transição e link |
| GitHub | repositório, branches, commits, PRs, verificações, workflows/runs do Actions e **issues abertas** | branch `prumo/...`, arquivo de teste, PR em rascunho e **issue** (`github.criar_issue`) |

**GitHub Issues** é o destino de bug ou melhoria no GitHub. **GitHub Actions** é CI/CD: não é rastreador de defeitos, não aparece como destino e criar uma issue não dispara pipeline. Disparar workflow (`workflow_dispatch`) segue fora do catálogo de escrita.

Detalhes confirmados na documentação oficial (15/10/2026):
- **Qase** — `POST /v1/defect/{code}` exige `title`, `actual_result` e `severity` (inteiro, sem enumeração publicada); aceita ainda `milestone_id`, `attachments`, `tags` e `custom_field` (IDs internos do projeto; campos obrigatórios sem padrão precisam ir preenchidos). `GET /v1/defect/{code}` filtra por `status` e pagina com `limit` (até 100) e `offset`. Tipos de caso (functional, smoke, regression, security, usability, performance, acceptance...) vêm de campos de sistema e não equivalem a issue types do Jira.
- **Jira Cloud** — `POST /rest/api/3/issue` com projeto, issue type, resumo, descrição em ADF e rótulos. "Bug" e "Melhoria" são issue types do projeto, escolhidos pela pessoa ou sugeridos pelo nome.
- **GitHub** — `POST /repos/{owner}/{repo}/issues` com `title`, `body` e `labels`. Sem permissão de push, o GitHub **descarta rótulos em silêncio**: o Prumo registra rótulos pedidos e aplicados em vez de fingir sucesso. `GET /repos/{owner}/{repo}/issues` também devolve PRs (campo `pull_request`), que o Prumo retira da lista. Token fine-grained precisa de Issues: escrita no repositório.

## Publicação de bug e melhoria: escolher o destino

**Tickets › Novo ticket** cria direto na ferramenta integrada ao projeto: vínculo que não está desligado e com escrita habilitada. É ticket no Jira, defeito no Qase ou issue no GitHub, só com os campos daquela ferramenta e com a mesma confirmação abaixo. Com mais de uma integrada, a pessoa escolhe o destino; sem nenhuma, o ticket fica como **rascunho local**. Rascunhos locais também nascem de falhas de run e de sugestões da IA. No rascunho, **Destino da publicação** oferece só o que está vinculado ao projeto ativo:

| Destino | Quando aparece | O que acontece |
| --- | --- | --- |
| Manter rascunho local | sempre | nada é enviado |
| Jira | Jira vinculado | ticket com o issue type de bug ou melhoria |
| Defeitos Qase | Qase vinculado e classificação diferente de Melhoria | defeito com a severidade escolhida entre as opções do Qase e o resultado observado |
| GitHub Issues | repositório GitHub vinculado | issue com rótulo `bug` ou `enhancement` (mais `prumo-qa`) |

Em todos os destinos externos: escrita habilitada por projeto e serviço (Conexões), prévia, confirmação nativa do Windows, chave de idempotência, marcador no item criado e releitura para confirmar. Uma proposta pode ser marcada para um ou mais destinos na mesma ação; a confirmação nativa é única e cada destino é executado e registrado separadamente. Falha parcial não vira sucesso: sucessos permanecem registrados, destinos com falha podem ser tentados novamente e resposta perdida é conciliada pelo marcador antes de qualquer reenvio. O Prumo não espelha um defeito automaticamente em outro serviço sem a seleção explícita dos destinos.

A lista de Tickets mostra lado a lado tickets do Jira, defeitos do Qase, issues abertas do GitHub e rascunhos locais, cada um com sua origem e ID próprios; nada é mesclado por título.

## Estado de implementação

- Projeto manual: Projetos › **Criar projeto manual** (nome e descrição), sem Qase, Jira ou GitHub. Pasta local e repositório GitHub podem ser vinculados depois; o repositório local funciona sozinho.
- Importação Qase via token, consulta paginada, escolha, vinculação e proteção da credencial: homologada com a conta real (projetos AP e PQ).
- **Defeitos Qase** (`qase.criar_defeito`, `qase.status_defeito`): homologados com a conta real (defeito criado, severidade conferida, status alterado). Campos personalizados: ver a observação na seção do Qase.
- **GitHub Issues** (`github.criar_issue` e leitura `issues`): homologado com repositório real (issue criada e conferida); sem a permissão Issues: Read and write, o GitHub descarta os rótulos. Edição, comentário e fechamento de issue não têm contrato.
- A troca global de projeto usa os vínculos por UUID e a tela Projetos mostra a origem; testes E2E da janela continuam pendentes.

## Qase: mapa da API v1 e uso no Prumo

Referência: [Introduction to the Qase API](https://developers.qase.io/reference/introduction-to-the-qase-api) e índice [llms.txt](https://developers.qase.io/llms.txt), lidos em 15/10/2026. Só existe a API v1 (`https://api.qase.io/v1`).

**Regras gerais da API e como o Prumo trata cada uma**
- Autenticação pelo cabeçalho `Token`, só HTTPS; o token herda o papel (RBAC) da pessoa no Qase. No Prumo o token fica no cofre do Windows e nunca chega à janela.
- Falta de permissão do papel volta 403; o Prumo mostra "sem permissão" e não tenta de novo.
- Limite por workspace, compartilhado por todos os tokens (Free 150/min e 25 a cada 10 s; Startup 300; Teams/Business 600; Enterprise 1000). Excesso volta 429 com `Retry-After`; o Prumo trata como `SERVICE_RATE_LIMIT` e não repete em laço.
- Paginação por `limit` (até 100) e `offset`. Erros 400, 401, 404, 410, 413 (lote grande), 422 (validação) e 5xx aparecem como falha, nunca como sucesso.
- **Severidade de defeito:** o POST recebe o ID numérico; o GET devolve texto (ex.: "major"). O Prumo lê as opções do campo de sistema `severity` (`GET /v1/system_field`) para mostrar os nomes no rascunho e conferir o defeito criado.

| Grupo da API | O Prumo lê | O Prumo escreve (com confirmação) | Fora do Prumo por enquanto |
| --- | --- | --- | --- |
| projects | lista e detalhe (importar e vincular) | — | criar projeto, conceder ou revogar acesso, excluir |
| cases | lista (com `external_issues`) e detalhe | criar, editar, vincular ticket Jira (`external-issue/attach`) | criar em lote, desvincular ticket, excluir |
| suites | lista | criar | editar, excluir |
| defects | lista (filtro `status`) e detalhe | criar com severidade, milestone e campos obrigatórios (`qase.criar_defeito`); mudar status para in_progress, resolved ou invalid (`qase.status_defeito`) | editar título/resultado, excluir |
| plans | lista e detalhe | criar | editar, excluir |
| runs | lista e detalhe | criar (com milestone e ambiente opcionais), concluir | editar, issues externas da run, publicidade, excluir |
| results | lista por run | publicar (individual e em lote) | editar, excluir |
| attachments | — | enviar evidência | listar, excluir |
| system-fields | tipos, prioridades e severidades | — | — |
| milestones, environments | lista (milestones ativos e ambientes, para run e defeito) | — | criar, editar, excluir |
| custom-fields | campos de defeito, run e caso que valem para o projeto | valores dos obrigatórios no defeito | criar ou editar a definição; campos obrigatórios de caso e run ainda não são preenchidos pelo Prumo |
| configurations | — | — | — |
| shared-steps, shared-parameters, reviews, authors, users, search (QQL) | — | — | — |

Nenhuma rota de exclusão está no catálogo de escrita, por decisão de segurança. A mudança de status leva o `updated_at` lido: se o defeito mudou no Qase depois da leitura, o Prumo recusa (`SERVICE_SCOPE_CHANGED`) e a pessoa vê o estado novo antes de decidir. Os campos personalizados são enviados com a chave = ID do campo e conferidos em `custom_fields` na releitura; se o Qase usar outra chave, a publicação aparece como não confirmada, nunca como sucesso. **Homologação de 16/10/2026 (conta da autora, projeto PQ):** o Qase aceitou o defeito com HTTP 200, mas não gravou o campo personalizado em nenhum formato testado (chave = ID, lista {id, value}); `GET /v1/custom_field` não expõe o `internal_id` citado na documentação. O Prumo registrou o defeito como enviado e não confirmado. Até o Qase esclarecer, campos personalizados em defeitos ficam sem garantia nesta conta.

**Jornada do token (testada na janela real com Qase simulado):** Projetos › Importar do Qase › **três passos**: **1** Abrir o Qase e criar o token, **2** colar o token e **Ver meus projetos** (o token some da tela depois de verificado), **3** escolher quais projetos vêm e **Trazer projetos**. Cada projeto escolhido vira um projeto Prumo vinculado: casos e suites em Testes, defeitos em Tickets. Um projeto criado à mão é vinculado a um projeto Qase existente por Listar recursos disponíveis, na linha da conta. A tela Conexões tem uma linha por serviço com contas, escrita no projeto e ações; o formulário abre sob a linha.

## Documentação oficial consultada

Qase introdução (autenticação, limites, erros): https://developers.qase.io/reference/introduction-to-the-qase-api
Qase índice da API: https://developers.qase.io/llms.txt
Qase campos de sistema: https://developers.qase.io/reference/get-system-fields
Qase status de defeito: https://developers.qase.io/reference/update-defect-status
Qase projetos: https://developers.qase.io/reference/get-projects
Qase casos: https://developers.qase.io/reference/get-cases
Qase suites: https://developers.qase.io/reference/get-suites
Qase defeitos: https://developers.qase.io/reference/get-defects
Qase criar defeito: https://developers.qase.io/reference/create-defect
Qase runs: https://developers.qase.io/reference/get-runs
Jira issues: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/
Jira comentários: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/
GitHub Issues: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28
GitHub Actions: https://docs.github.com/en/rest/actions/workflows

## Limites de segurança

Nenhum teste automático pode tocar banco ou projeto externo conforme AGENTS.md. A regressão usa transporte Qase e GitHub sintético e projetos temporários no filesystem, sem chamadas remotas. O código de criação de defeito foi exercitado sem API externa. Tokens previamente compartilhados no chat devem ser rotacionados antes da homologação real. Não confundir testes simulados com confirmação de produção.
