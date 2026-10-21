# Serviços externos — Prumo QA 2.9

O desktop consulta APIs oficiais pelo processo principal. Não abre servidor HTTP local. A ponte IPC estrita está no [catálogo gerado](CONTRATOS.md); as sete ferramentas MCP não expõem tokens nem consultas diretas aos serviços. IA é opcional. Credenciais de conectores do ChatGPT não são herdadas.

Em termos simples: Jira, Qase e GitHub só são consultados quando você conecta uma conta. As leituras não alteram esses serviços. Para enviar alterações, é preciso habilitar a escrita para o projeto e confirmar a operação. No Windows, tokens ficam protegidos no cofre do sistema e não são exibidos novamente; outros sistemas recusam a configuração nesta versão.

## Identidade e armazenamento

Um projeto Prumo tem UUID, nome, descrição, contextos próprios, histórico de metadados e pasta de automação opcional. O manifesto técnico interno v2, em dados próprios do aplicativo, permite reutilizar o núcleo de contextos/MCP. Não é uma pasta de automação criada no projeto da pessoa. Pastas existentes e seus contratos continuam separados e não são sobrescritos. Nome apresentado pelo desktop pode ser editado; o nome técnico inicial do manifesto interno permanece estável.

Cada vínculo contém UUID, serviço, conexão, instância, principal disponível, ID do recurso, chave atual, nome, estado e última validação bem-sucedida. Não há correspondência por nome ou código entre serviços. É necessário remover o vínculo anterior antes de selecionar outro. Histórico e associações declaradas permanecem, com vínculo anterior identificado. Remover uma conexão elimina sua credencial e deixa seus vínculos sem credencial.

Jira usa o ID de projeto e `accountId`; GitHub usa ID de repositório e ID de usuário. Mudança de chave/full_name exige validar o vínculo. Qase API v1 retorna código e título do projeto, sem ID numérico de projeto nem endpoint `/me` de identidade da conta. O código é `codigo_api`, limitado à conexão validada, com principal local `conexao-local:<UUID>` explicitamente **não autenticado como identidade de conta remota**. Uma troca de token requer nova conexão e seleção; não há migração por título. No exemplo CID-LAB, `CID-QA` é o título fictício e `CQA` o código API válido.

Metadados ficam em `plataforma/espacos.json` e `contas.json` no diretório de dados. `credenciais.json` contém somente ciphertext base64 produzido pelo Electron `safeStorage`/DPAPI. O formato base64 não é a proteção; a proteção é do Windows. Tokens não são retornados ao renderer depois da configuração. O formulário limpa o campo após a tentativa. Sem proteção disponível, salvar/ler é recusado; não há fallback em texto nem criptografia própria. DPAPI protege entre contas Windows, não contra outros processos com acesso ao mesmo perfil desbloqueado. Esta implementação de proteção é Windows; outros sistemas recusam configuração.

Respostas externas não são persistidas como cache. Cada tela indica origem, endpoint, data, `cache:false` e que informação consultada não significa aprovação ou cobertura. Histórico guarda ação/serviço/ID de vínculo/código, sem corpo de resposta, token, descrição ou comentários. Importação de descrição Jira é explícita, com prévia nativa, fonte e **RASCUNHO**. Contextos só chegam ao MCP se a pessoa habilitar o compartilhamento existente desse projeto; um rascunho continua identificado como rascunho. Conteúdo remoto é dado, nunca comando.

## Autenticação e permissões

- Jira Cloud: dois caminhos. **Autorização pelo navegador** (OAuth 2.0 3LO, caminho principal): Bearer em `https://api.atlassian.com/ex/jira/<cloudId>/rest/api/3/...`, com o site escolhido pela pessoa; o cadastro guarda o endereço do site e o `cloudId`. **Token de API** (configuração avançada): e-mail + token **sem escopos**, Basic no domínio `https://<instancia>.atlassian.net`. Ver [SEGURANCA.md](SEGURANCA.md#conexões-github-e-jira-pelo-navegador-aplicativos-oficiais-do-prumo). A pessoa precisa ter leitura dos projetos, issues e comentários. `GET /myself` valida o principal.
- Qase: cabeçalho `Token` no host fixo `https://api.qase.io`. Leitura dos projetos/casos/runs disponíveis à conta. `GET /v1/project?limit=1&offset=0` valida o acesso, sem inventar identidade de conta.
- GitHub: Bearer token no host fixo `https://api.github.com`, versão REST `2022-11-28`. Caminho principal: **GitHub App do Prumo** autorizado no navegador; o token de usuário expira e é renovado pelo serviço, e só enxerga os repositórios onde a pessoa instalou o aplicativo (lista por `/user/installations`). Alternativas: token pessoal (configuração avançada) ou, no Windows, o Git Credential Manager. Repositórios selecionados; leitura de Metadata, Contents, Pull requests e Checks conforme a operação, ou permissões equivalentes do token clássico. `GET /user` valida o principal. Permissões restritas podem permitir listar o repositório e recusar uma operação: a falha é exibida.

As operações de leitura não criam nem editam registros. Escritas da versão 2.9 usam o catálogo fechado descrito abaixo, habilitação por projeto/serviço e confirmação nativa ou política específica aprovada. O comentário agendado de resultado mantém seu fluxo restrito, sem alterar status do ticket; veja [AGENDAMENTOS.md](AGENDAMENTOS.md). Não requer token de IA. Não clona repositórios privados nem baixa o código integral.

## Catálogo REST implementado

Todos os endpoints abaixo usam **GET**. Parâmetros são construídos pelo adaptador, não recebidos como URL livre. IDs/códigos são escapados; ID de projeto Jira é numérico antes de entrar no JQL. Campo de aceite deve ser `customfield_<n>` descoberto pela API e selecionado pela pessoa.

| Serviço / operação | Endpoint | Paginação / parâmetros | Saída usada |
|---|---|---|---|
| Jira autenticação | `/rest/api/3/myself` | sem paginação | accountId, displayName |
| Jira recursos | `/rest/api/3/project/search` | startAt, maxResults; total | ID, key, name |
| Jira revalidar recurso | `/rest/api/3/project/{id}` | ID selecionado | mesma identidade |
| Jira tickets | `/rest/api/3/search/jql` | JQL fixo por ID, fields, maxResults, nextPageToken | issues, isLast, cursor |
| Jira detalhe | `/rest/api/3/issue/{key}` | fields, projeto conferido | resumo, descrição ADF, tipo, estado, prioridade, responsável, updated, issuelinks, aceite configurado |
| Jira comentários | `/rest/api/3/issue/{key}/comment` | startAt, maxResults; total; detalhe é conferido antes | comments |
| Jira campos | `/rest/api/3/field` | resposta completa limitada a 1000 campos e 2 MiB | customfields reais, sem adivinhar pelo nome |
| Qase recursos | `/v1/project` | offset, limit; total/filtered | code, title |
| Qase revalidar recurso | `/v1/project/{code}` | código da conexão | code, title |
| Qase suites | `/v1/suite/{code}` | offset, limit | suites |
| Qase casos | `/v1/case/{code}` | offset, limit, include=external_issues | cases, classificação, passos, external_issues |
| Qase detalhe de caso | `/v1/case/{code}/{id}` | ID numérico, include=external_issues | case |
| Qase planos | `/v1/plan/{code}` | offset, limit | plans |
| Qase runs | `/v1/run/{code}` | offset, limit | runs |
| Qase detalhe de run | `/v1/run/{code}/{id}` | ID numérico | run |
| Qase resultados | `/v1/result/{code}` | offset, limit, run opcional | hash, run/case IDs, status, tempos, anexos retornados |
| Qase defeitos (`defeitos`) | `/v1/defect/{code}` | offset, limit; status opcional open/resolved/in_progress/invalid | ID, título, resultado observado, severidade, status, datas, runs/results e anexos retornados |
| Qase detalhe de defeito (`defeito`) | `/v1/defect/{code}/{id}` | ID numérico, conferido na resposta | mesmos campos da listagem e detalhes disponíveis |
| GitHub recursos | `/user/repos` | per_page, page, sort=full_name | ID, full_name, name |
| GitHub revalidar ID | `/repositories/{id}` | ID numérico | identidade, full_name atual |
| GitHub repositório | `/repos/{owner}/{repo}` | namespace revalidado | dados do repositório |
| GitHub branches | `/repos/{owner}/{repo}/branches` | per_page, page | branches |
| GitHub commits | `/repos/{owner}/{repo}/commits` | per_page, page | commits |
| GitHub PRs | `/repos/{owner}/{repo}/pulls` | per_page, page, state=all | PRs |
| GitHub detalhe de PR | `/repos/{owner}/{repo}/pulls/{number}` | número validado | PR |
| GitHub verificações | `/repos/{owner}/{repo}/commits/{sha}/check-runs` | SHA 40 hexadecimal, per_page, page | check_runs, status/conclusion informados |

Paginação inicial: 50; limites 1–100 por página, offset até 100000, cursor até 2000 caracteres. GitHub usa uma página seguinte quando a página está cheia; a próxima pode ser vazia. Não há paginação automática infinita. Critérios de aceite/ADF viram texto, sem HTML executável. Qase usa `isManual`/`isToBeAutomated`, com fallback para `automation` quando fornecido; ausente é não informado. `external_issues` é mostrado como associação externa retornada, sem dedução de cobertura. Sem associação: “Vínculo ainda não definido.” Runs e resultados são distintos das evidências locais e não recebem PASS inventado. Check runs não incluem todos os sistemas legados de commit status; ausência de check não significa sucesso.

## Falhas e segurança do transporte

`401 → CREDENTIAL_INVALID_OR_EXPIRED` (a resposta não distingue vencimento de token inválido); `403 → SERVICE_PERMISSION` ou rate limit indicado; `404 → SERVICE_NOT_FOUND`; `429 → SERVICE_RATE_LIMIT`; `5xx → SERVICE_UNAVAILABLE`; timeout → `SERVICE_TIMEOUT`; JSON/formato inválido → `SERVICE_RESPONSE_INVALID`. Não há retentativa automática nem lista vazia substituindo erro. Credencial ausente é `CREDENTIAL_UNAVAILABLE`. Mudança de escopo é `SERVICE_SCOPE_CHANGED`.

HTTPS apenas, hosts fixos ou subdomínio Jira único permitido; sem usuário/senha/porta/path na instância. DNS IPv4 público resolvido uma vez e fixado no socket TLS, certificados verificados; IPv6 e faixas especiais recusados. Nenhum redirect é seguido, nenhuma credencial é reenviada para outro host. Resposta JSON máxima 2 MiB; DNS 3 s, requisição 10 s. Erros de corpo HTTP não são copiados para logs/interface. Arquivos próprios recusam symlinks/hardlinks, schema inválido e limite de tamanho, com gravação atômica. As proteções não substituem isolamento do perfil Windows.

## Evidência e limites

Testes de contrato e servidor controlado estão em `Prumo-QA-Lab/automacao/prumo-qa/testes/regressao/backend/conexoes/servicos.test.mjs`; demonstração Electron em `Prumo-QA-Lab/automacao/prumo-qa/testes/regressao/frontend/projetos/plataforma-dois-projetos.test.mjs`. O runner injeta instrumentação somente no teste; ela não é importada pelo app, incluída no instalador nem ativada por configuração de produção. SMART-LAB/CID-LAB são fictícios. Uma confirmação de diálogo simulada pelo runner não é aprovação humana de execução. Autenticação real dos três serviços **não verificada sem credenciais próprias disponíveis**. Fixtures demonstram implementação e isolamento, não acesso em produção.

O modelo de referências preserva origem, contexto, automação, execução e evidência. A versão 2.9 possui propostas locais de casos, publicação controlada no Qase e Orchestrator local; não contém modelo de IA próprio. Leitura de defeitos é implementada sem criação/edição/resolução de defeitos: nenhuma rota de escrita de defeito está autorizada. Relações runs/results são informações retornadas pelo Qase, sem associação deduzida com Jira. Comentários e histórico de defeitos não são inventados quando a API não os fornece.

## Fontes oficiais consultadas

- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)
- [Jira Basic API token](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/)
- [Jira enhanced issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Qase especificações oficiais](https://github.com/qase-tms/specs)
- [Qase listar defeitos](https://developers.qase.io/reference/get-defects) e [detalhar defeito](https://developers.qase.io/reference/get-defect); contrato [Defect.yaml](https://github.com/qase-tms/specs/blob/master/testops-api/v1/schemas/Defect.yaml), conferidos em 11/10/2026.
- [GitHub REST repositories](https://docs.github.com/en/rest/repos/repos)
- [GitHub REST checks](https://docs.github.com/en/rest/checks/runs)

## Escritas (2.9)

Jira (v3): criar ticket (tipo vindo do createmeta), comentar, anexar (`X-Atlassian-Token: no-check`), vincular, editar campos e transicionar. Qase (v1): criar suite, caso, plano e run; editar caso; concluir run; resultados em lote (até 200); anexos; associação a ticket. GitHub (REST): criar ref `prumo/...`, gravar arquivo, abrir Pull Request em rascunho. Cada rota está em `backend/conexoes/tipos/escritaGithub.ts` (conferida por `backend/conexoes/escrita/rotaEscritaPermitida.ts`); tudo fora da lista é recusado. Leitura avançada: filtros de tickets (JQL montado e escapado, sempre restrito ao projeto), histórico, anexos, transições, planos, resultados, execuções do Actions e arquivos.

A reutilização e a reconciliação de uma escrita revalidam conexão e vínculo. Se a mesma chave de operação pertence a vínculo/conexão anteriores, ou a um registro legado sem escopo conhecido, `OPERATION_SCOPE_CHANGED` bloqueia a repetição sem reenviar nem alterar o registro anterior. Novas tentativas gravam o escopo antes do envio, incluindo situações de resposta perdida. Não há migração automática do livro-razão.
