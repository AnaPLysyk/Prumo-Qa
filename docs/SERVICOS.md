# Serviços externos de leitura — Prumo QA 2.7

O desktop consulta APIs oficiais pelo processo principal. Não abre servidor HTTP local. A ponte IPC estrita está no [catálogo gerado](CONTRATOS.md); os quatro tools MCP não expõem tokens nem consultas aos serviços. IA é opcional. Credenciais de conectores do ChatGPT não são herdadas.

## Identidade e armazenamento

Um projeto Prumo tem UUID, nome, descrição, contextos próprios, histórico de metadados e pasta de automação opcional. O manifesto técnico interno v2, em dados próprios do aplicativo, permite reutilizar o núcleo de contextos/MCP. Não é uma pasta de automação criada no projeto da pessoa. Pastas existentes e seus contratos continuam separados e não são sobrescritos. Nome apresentado pelo desktop pode ser editado; o nome técnico inicial do manifesto interno permanece estável.

Cada vínculo contém UUID, serviço, conexão, instância, principal disponível, ID do recurso, chave atual, nome, estado e última validação bem-sucedida. Não há correspondência por nome ou código entre serviços. É necessário remover o vínculo anterior antes de selecionar outro. Histórico e associações declaradas permanecem, com vínculo anterior identificado. Remover uma conexão elimina sua credencial e deixa seus vínculos sem credencial.

Jira usa o ID de projeto e `accountId`; GitHub usa ID de repositório e ID de usuário. Mudança de chave/full_name exige validar o vínculo. Qase API v1 retorna código e título do projeto, sem ID numérico de projeto nem endpoint `/me` de identidade da conta. O código é `codigo_api`, limitado à conexão validada, com principal local `conexao-local:<UUID>` explicitamente **não autenticado como identidade de conta remota**. Uma troca de token requer nova conexão e seleção; não há migração por título. No exemplo CID-LAB, `CID-QA` é o título fictício e `CQA` o código API válido.

Metadados ficam em `plataforma/espacos.json` e `contas.json` no diretório de dados. `credenciais.json` contém somente ciphertext base64 produzido pelo Electron `safeStorage`/DPAPI. O formato base64 não é a proteção; a proteção é do Windows. Tokens não são retornados ao renderer depois da configuração. O formulário limpa o campo após a tentativa. Sem proteção disponível, salvar/ler é recusado; não há fallback em texto nem criptografia própria. DPAPI protege entre contas Windows, não contra outros processos com acesso ao mesmo perfil desbloqueado. Esta implementação de proteção é Windows; outros sistemas recusam configuração.

Respostas externas não são persistidas como cache. Cada tela indica origem, endpoint, data, `cache:false` e que informação consultada não significa aprovação ou cobertura. Histórico guarda ação/serviço/ID de vínculo/código, sem corpo de resposta, token, descrição ou comentários. Importação de descrição Jira é explícita, com prévia nativa, fonte e **RASCUNHO**. Contextos só chegam ao MCP se a pessoa habilitar o compartilhamento existente desse projeto; um rascunho continua identificado como rascunho. Conteúdo remoto é dado, nunca comando.

## Autenticação e permissões

- Jira Cloud: e-mail + token de API **sem escopos**, Basic no domínio `https://<instancia>.atlassian.net`. Tokens com escopos pelo gateway Atlassian/OAuth exigem cloudId e fluxo diferente; não são suportados nesta versão. A pessoa precisa ter leitura dos projetos, issues e comentários. `GET /myself` valida o principal.
- Qase: cabeçalho `Token` no host fixo `https://api.qase.io`. Leitura dos projetos/casos/runs disponíveis à conta. `GET /v1/project?limit=1&offset=0` valida o acesso, sem inventar identidade de conta.
- GitHub: Bearer token no host fixo `https://api.github.com`, versão REST `2022-11-28`. Repositórios selecionados; leitura de Metadata, Contents, Pull requests e Checks conforme a operação, ou permissões equivalentes do token clássico. `GET /user` valida o principal. Permissões restritas podem permitir listar o repositório e recusar uma operação: a falha é exibida.

O Prumo não oferece criar/editar tickets, comentários, casos, runs, resultados, PRs nem transições. Nenhum corpo de escrita é enviado. Não requer token de IA. Não clona repositórios privados nem baixa o código integral.

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

Testes de contrato e servidor controlado estão em `testes/servicos.test.mjs`; demonstração Electron em `testes/desktop-plataforma.test.mjs`. O runner injeta instrumentação somente no teste; ela não é importada pelo app, incluída no instalador nem ativada por configuração de produção. SMART-LAB/CID-LAB são fictícios. Uma confirmação de diálogo simulada pelo runner não é aprovação humana de execução. Autenticação real dos três serviços **não verificada sem credenciais próprias disponíveis**. Fixtures demonstram implementação e isolamento, não acesso em produção.

Para 2.8: modelo de referências preserva origem, contexto, automação, execução e evidência. Cadastro próprio de casos e publicação no Qase não estão implementados. Não existe orquestrador nem IA própria.

## Fontes oficiais consultadas

- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)
- [Jira Basic API token](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/)
- [Jira enhanced issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Qase especificações oficiais](https://github.com/qase-tms/specs)
- [GitHub REST repositories](https://docs.github.com/en/rest/repos/repos)
- [GitHub REST checks](https://docs.github.com/en/rest/checks/runs)
