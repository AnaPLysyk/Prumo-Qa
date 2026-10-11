# Contratos técnicos do Prumo QA

> Arquivo **gerado** por `npm run contratos` a partir de `src/contratos.ts`. Não edite à mão: um teste compara este texto com o catálogo real.

O Prumo não abre servidor HTTP local. Existem duas interfaces de entrada; as consultas REST externas de leitura estão documentadas separadamente em [SERVICOS.md](SERVICOS.md):

- **IPC** (99 operações): entre a janela Electron e o processo principal, com remetente conferido e argumentos validados por esquema estrito.
- **MCP** (7 ferramentas): para agentes de IA, por stdio, iniciado pelo próprio cliente.

## IPC (janela)

| Operação | Argumentos | Efeito |
|---|---|---|
| `prumo:espacos:listar` | — | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:criar` | `descricao`, `nome` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:espacos:obter` | `id` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:editar` | `dados`, `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:espacos:pasta` | `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:espacos:automacoes` | `id` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:associar` | `dados`, `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:listar` | — | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:adicionar` | `instancia`, `nome`, `servico`, `token`, `usuario` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:validar` | `id` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:remover` | `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:recursos` | `id`, `pagina` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:vincular` | `conexaoId`, `espacoId`, `recurso` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:desvincular` | `espacoId`, `servico` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:conferir` | `espacoId`, `servico` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:consultar` | `espacoId`, `filtros`, `id`, `operacao`, `pagina`, `servico` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:aceite` | `campo`, `espacoId` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:importar` | `espacoId`, `ticket` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:operacoes:previa` | `espacoId`, `operacao`, `parametros` | Sem rede e sem gravação. |
| `prumo:operacoes:executar` | `anexo`, `espacoId`, `operacao`, `parametros` | Escreve no Jira, Qase ou GitHub vinculados somente depois de confirmação nativa; relê o serviço para confirmar; repetir não duplica. |
| `prumo:operacoes:listar` | `espacoId`, `limite` | Consulta local. |
| `prumo:escrita:estado` | `espacoId` | Consulta local. |
| `prumo:escrita:habilitar` | `espacoId`, `habilitada`, `servico` | Grava permissoes-servicos.json. Habilitar não executa nada; cada operação ainda pede confirmação. |
| `prumo:propostas:listar` | `espacoId` | Consulta local. |
| `prumo:propostas:criar` | `dados`, `espacoId`, `requisito`, `risco`, `tipo` | Grava propostas.json. Não envia nada ao Qase ou Jira. |
| `prumo:propostas:editar` | `dados`, `id`, `requisito`, `risco` | Grava propostas.json. |
| `prumo:propostas:revisar` | `cobertura`, `duplicidade`, `id`, `requisito`, `risco` | Grava propostas.json com quem revisou e quando. Proposta de IA exige revisão completa e requisito informado. |
| `prumo:propostas:descartar` | `id` | Grava propostas.json. |
| `prumo:propostas:publicar` | `id`, `tipoId` | Cria o caso ou o ticket depois da confirmação nativa e registra o vínculo como REGISTRADO_PELO_PRUMO. |
| `prumo:runs:listar` | `espacoId` | Consulta local. |
| `prumo:runs:preparar` | `ambiente`, `casos`, `espacoId`, `planoId`, `titulo` | Grava runs-qase.json. Não cria nada no Qase. |
| `prumo:runs:criar` | `id` | Cria a run no Qase após confirmação nativa. Criar a run não executa nada. |
| `prumo:runs:executar` | `id` | Executa processos locais; cada automação pede a autenticação nativa do Windows. Casos manuais ficam sem resultado. |
| `prumo:runs:resultado` | `casoId`, `comentario`, `id`, `status` | Grava runs-qase.json marcando MANUAL e quem declarou. Nunca sobrescreve resultado de execução. |
| `prumo:runs:publicar` | `anexarEvidencia`, `id` | Envia resultados (passed, failed, blocked) após confirmação nativa; NOT_RUN nunca é enviado; repetir não duplica. |
| `prumo:runs:bugs` | `id` | Grava propostas.json. Não cria tickets. |
| `prumo:runs:politica` | `dias`, `espacoId`, `maxUsos`, `runId` | Grava autorizacoes.json. Sem política, rotina agendada não escreve no Qase. |
| `prumo:runs:revogar` | `id` | Grava autorizacoes.json. |
| `prumo:vinculos:mapa` | `espacoId` | Consulta local; não prova cobertura. |
| `prumo:testes:catalogo` | `espacoId` | Leitura estática da pasta vinculada; nada é executado nem alterado. |
| `prumo:assistente:perguntar` | `espacoId`, `pergunta` | Consulta local; nada é gravado nem enviado. |
| `prumo:assistente:situacao` | `espacoId` | Consulta local. |
| `prumo:agentes:estado` | `espacoId` | Consulta local. |
| `prumo:agentes:salvar` | `espacoId`, `especializacoes`, `politicas` | Grava agentes.json. O bloqueio vale no servidor MCP a cada chamada. |
| `prumo:agenda:listar` | `espacoId` | Consulta local. |
| `prumo:agenda:salvar` | `dados`, `id` | Grava agenda.json. Editar reinicia a âncora; não autoriza nada. |
| `prumo:agenda:estado` | `acao`, `id` | Grava agenda.json. Retomar não executa horários que passaram durante a pausa. |
| `prumo:agenda:excluir` | `id` | Remove a rotina de agenda.json; execuções já registradas permanecem. |
| `prumo:agenda:executar` | `id` | Enfileira um trabalho manual. Testes e k6 pedem a autenticação nativa do Windows a cada execução; consultas apenas leem. |
| `prumo:agenda:autorizar` | `dias`, `id`, `maxUsos` | Grava autorizacoes.json somente depois da autenticação nativa do Windows para o escopo exato (hash de projeto, comando, ambiente e fontes). Qualquer mudança invalida. |
| `prumo:agenda:revogar` | `id` | Grava autorizacoes.json; execuções futuras daquele escopo ficam BLOCKED. |
| `prumo:agenda:permissoes` | `espacoId` | Consulta local. |
| `prumo:agenda:politica` | `dias`, `espacoId`, `maxPublicacoes`, `tickets`, `tipos` | Grava autorizacoes.json. Sem política, nenhuma rotina agendada comenta no Jira. |
| `prumo:agenda:revogarpolitica` | `id` | Grava autorizacoes.json; publicações agendadas deixam de ocorrer. |
| `prumo:execucoes:listar` | `filtro` | Consulta local; não altera nada. |
| `prumo:execucoes:metricas` | `espacoId` | Consulta local. Não calcula porcentagem de qualidade; consulta à interface não conta como execução. |
| `prumo:jira:previa` | `trabalhoId` | Sem rede e sem gravação. |
| `prumo:jira:publicar` | `trabalhoId` | Uma requisição POST ao Jira Cloud vinculado (comentário). Não altera status do ticket. Idempotente por execução e por marcador no comentário. |
| `prumo:worker:estado` | — | Consulta local. |
| `prumo:worker:pausa` | `pausado` | Grava a pausa global; trabalho em andamento termina sem ser corrompido. |
| `prumo:worker:eventos` | `desde` | Consulta a memória do processo principal; a janela consulta periodicamente (não há canal de eventos livre na ponte). |
| `prumo:app:info` | — | Consulta local; não altera o projeto. |
| `prumo:projetos:listar` | — | Consulta local; não altera o projeto. |
| `prumo:projetos:escolher` | — | Grava vinculos.json somente se o contrato for válido; nunca escreve na pasta do projeto. |
| `prumo:projetos:demo` | — | Copia a demonstração (sem .prumo) para %LOCALAPPDATA%\PrumoQA\demonstracao, sem sobrescrever; grava vinculos.json. |
| `prumo:projetos:desvincular` | `root` | Altera só vinculos.json. Histórico, evidências e arquivos do projeto permanecem. |
| `prumo:projeto:visao` | `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:logs` | `filter`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:historico` | `filter`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:evidencias` | `jobId`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:conexoes` | `root` | Só consulta; não altera configurações ou executa capabilities. |
| `prumo:conexao:aplicar` | `client`, `root` | Executa "codex mcp add" sem shell, sem sobrescrever configuração existente. |
| `prumo:conexao:testar` | `client`, `root` | Inicia o MCP do próprio produto e realiza somente consulta; não executa capabilities nem altera configuração. |
| `prumo:logs:exportar` | `root` | Grava um JSON no destino escolhido. Nenhum upload. |
| `prumo:ajuda:documentos` | — | Consulta local; não altera o projeto. |
| `prumo:ajuda:versoes` | — | Consulta local; não altera o projeto. |
| `prumo:ajuda:integracoes` | — | Consulta local; não altera o projeto. |
| `prumo:atualizacao:verificar` | — | Uma requisição HTTPS GET ao GitHub; não baixa nem instala nada. Grava só a versão disponível e as decisões de aviso em preferencias.json. |
| `prumo:atualizacao:abrir` | — | Abre o navegador padrão na página da release; não baixa nem executa instalador. |
| `prumo:site:abrir` | — | Abre o navegador padrão; nada é enviado pelo aplicativo. |
| `prumo:dados:resumo` | — | Consulta local; não altera o projeto. |
| `prumo:dados:excluir` | `escopo`, `root` | Apaga somente arquivos do escopo, validados por nome, tipo e caminho canônico. Nunca apaga código-fonte; não é exposto ao MCP. |
| `prumo:diagnostico:listar` | — | Consulta local; não altera o projeto. |
| `prumo:contextos:listar` | `filter`, `root` | Consulta local; não altera o projeto. |
| `prumo:contextos:obter` | `id`, `root` | Consulta local; não altera o projeto. |
| `prumo:contextos:salvar` | `dados`, `id`, `root`, `substituir` | Grava no armazenamento local de contextos. Editar sempre invalida a aprovação anterior. |
| `prumo:contextos:aprovar` | `id`, `root` | Registra a aprovação do conteúdo exato; recusa sem origem, com conflito ou desatualizado. |
| `prumo:contextos:desatualizar` | `id`, `root` | Registra o estado; contexto desatualizado não pode mais ser editado nem aprovado. |
| `prumo:contextos:conflito` | `id`, `outroId`, `root` | Registra a decisão da pessoa; o Prumo nunca escolhe um lado nem resolve conflito em silêncio. |
| `prumo:contextos:excluir` | `id`, `root` | Apaga o arquivo do contexto e o seu histórico; mantém só um registro mínimo (id, data e hash) de que existiu. Nunca toca no projeto. |
| `prumo:contextos:mcp` | `habilitar`, `root` | Quando habilitado, contexto_projeto e revisar_cobertura passam a ler os contextos deste projeto; o texto pode ser processado pelo provedor da IA conectada. |
| `prumo:preferencias:obter` | — | Consulta local; não altera o projeto. |
| `prumo:preferencias:salvar` | `idioma`, `iniciarComWindows`, `notificarAgenda`, `silenciar`, `som`, `tema`, `verificarAoIniciar` | Grava preferencias.json. Iniciar com o Windows só registra o item de inicialização do usuário se a pessoa ligar a opção; não cria serviço do Windows, tarefa agendada nem consulta de atualização em segundo plano. |
| `prumo:preferencias:visualizada` | `versao` | Grava preferencias.json. |
| `prumo:suporte:preparar` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Sem rede e sem gravação: só calcula o relato. |
| `prumo:suporte:abrir` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Abre o navegador no formulário; nada é publicado até a pessoa enviar lá. Issues em repositório público são públicas. |
| `prumo:suporte:exportar` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Grava um .md onde a pessoa escolher. Nenhum upload. |
| `prumo:suporte:consultar` | `numero` | GET público ao GitHub oficial; sem credenciais, upload ou sincronização. |
| `prumo:suporte:chamado` | `numero` | Abre somente o chamado no navegador; não publica comentário. |

## MCP (agentes de IA)

| Operação | Argumentos | Efeito |
|---|---|---|
| `contexto_projeto` | — | Somente leitura. |
| `revisar_cobertura` | `candidates`, `contextoId`, `contradictions`, `existingTests`, `requirement`, `source`, `sourcePath` | Somente leitura; não afirma que executou algo. |
| `executar_validacao` | `capability`, `solicitarAprovacao` | Pode executar processo local autorizado e gravar evidência. Sem aprovação retorna BLOCKED. |
| `consultar_evidencias` | `criterio`, `jobId` | Somente leitura. |
| `listar_politicas` | — | Somente leitura. |
| `propor_caso` | `automacao`, `descricao`, `passos`, `posCondicoes`, `preCondicoes`, `prioridade`, `requisito`, `risco`, `severidade`, `suiteId`, `tags`, `ticket`, `tipo`, `titulo` | Grava propostas.json. Não envia nada ao Qase; duplicata e excesso por hora são recusados. |
| `propor_bug` | `descricao`, `origem`, `resumo`, `risco`, `rotulos` | Grava propostas.json. Não cria ticket no Jira. |

## Detalhes

### `prumo:espacos:listar`

- **Tipo:** IPC
- **Finalidade:** espacos:listar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:criar`

- **Tipo:** IPC
- **Finalidade:** espacos:criar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:obter`

- **Tipo:** IPC
- **Finalidade:** espacos:obter: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:editar`

- **Tipo:** IPC
- **Finalidade:** espacos:editar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:pasta`

- **Tipo:** IPC
- **Finalidade:** espacos:pasta: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:automacoes`

- **Tipo:** IPC
- **Finalidade:** espacos:automacoes: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:associar`

- **Tipo:** IPC
- **Finalidade:** espacos:associar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > espacos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:listar`

- **Tipo:** IPC
- **Finalidade:** servicos:listar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:adicionar`

- **Tipo:** IPC
- **Finalidade:** servicos:adicionar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:validar`

- **Tipo:** IPC
- **Finalidade:** servicos:validar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:remover`

- **Tipo:** IPC
- **Finalidade:** servicos:remover: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:recursos`

- **Tipo:** IPC
- **Finalidade:** servicos:recursos: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:vincular`

- **Tipo:** IPC
- **Finalidade:** servicos:vincular: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:desvincular`

- **Tipo:** IPC
- **Finalidade:** servicos:desvincular: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:conferir`

- **Tipo:** IPC
- **Finalidade:** servicos:conferir: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:consultar`

- **Tipo:** IPC
- **Finalidade:** servicos:consultar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:aceite`

- **Tipo:** IPC
- **Finalidade:** servicos:aceite: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:importar`

- **Tipo:** IPC
- **Finalidade:** servicos:importar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** main.ts > servicos.ts > adaptadoresServicos.ts
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:operacoes:previa`

- **Tipo:** IPC
- **Finalidade:** Mostrar o resumo, o efeito e a chave de idempotência de uma operação externa antes de executá-la.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, operação do catálogo e parâmetros
- **Saída:** Resumo mascarado, efeito, chave e se a escrita está habilitada
- **Permissões:** Nenhuma
- **Efeito:** Sem rede e sem gravação.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:operacoes:executar`

- **Tipo:** IPC
- **Finalidade:** Executar uma operação externa do catálogo (criar ticket/caso/plano/run, anexar, editar, mudar status, vincular, branch, commit de teste, PR).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, operação, parâmetros e, para anexos, evidência do projeto ou arquivo escolhido no diálogo nativo
- **Saída:** Registro da operação com estado (CONFIRMADA, ENVIADA, FALHA, BLOQUEADA) e identificador/link remoto
- **Permissões:** Escrita habilitada no projeto + confirmação nativa com o resumo exato
- **Efeito:** Escreve no Jira, Qase ou GitHub vinculados somente depois de confirmação nativa; relê o serviço para confirmar; repetir não duplica.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs; Caminho de arquivo nunca vem da página
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:operacoes:listar`

- **Tipo:** IPC
- **Finalidade:** Livro-razão das operações externas por projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto opcional e limite
- **Saída:** Operações com estado, resumo, identificador remoto e tentativas
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:escrita:estado`

- **Tipo:** IPC
- **Finalidade:** Ver em quais serviços a escrita está habilitada no projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Habilitação por serviço
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:escrita:habilitar`

- **Tipo:** IPC
- **Finalidade:** Habilitar ou desabilitar a escrita externa de um serviço no projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, serviço e habilitada
- **Saída:** Estado da habilitação
- **Permissões:** Confirmação nativa ao habilitar
- **Efeito:** Grava permissoes-servicos.json. Habilitar não executa nada; cada operação ainda pede confirmação.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:listar`

- **Tipo:** IPC
- **Finalidade:** Listar propostas de casos e bugs (da pessoa, do Prumo ou de uma IA).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Propostas com estado, origem, revisão e semelhantes
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:criar`

- **Tipo:** IPC
- **Finalidade:** Criar uma proposta de caso de teste ou de bug em rascunho.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, tipo e dados (esquema estrito)
- **Saída:** Proposta
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json. Não envia nada ao Qase ou Jira.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:editar`

- **Tipo:** IPC
- **Finalidade:** Editar uma proposta; invalida a revisão anterior.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id e dados
- **Saída:** Proposta
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:revisar`

- **Tipo:** IPC
- **Finalidade:** Registrar a revisão (duplicidade, requisito, risco e cobertura) de uma proposta.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id e as quatro confirmações
- **Saída:** Proposta REVISADA
- **Permissões:** Confirmação da pessoa
- **Efeito:** Grava propostas.json com quem revisou e quando. Proposta de IA exige revisão completa e requisito informado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:descartar`

- **Tipo:** IPC
- **Finalidade:** Descartar uma proposta.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da proposta
- **Saída:** Proposta DESCARTADA
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:publicar`

- **Tipo:** IPC
- **Finalidade:** Publicar uma proposta (caso no Qase ou bug no Jira).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id e, para bug, o tipo de ticket
- **Saída:** Registro da operação externa e proposta PUBLICADA
- **Permissões:** Escrita habilitada + revisão (IA) + confirmação nativa
- **Efeito:** Cria o caso ou o ticket depois da confirmação nativa e registra o vínculo como REGISTRADO_PELO_PRUMO.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:listar`

- **Tipo:** IPC
- **Finalidade:** Listar as runs locais do projeto (preparadas, criadas, executadas e publicadas).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Runs com casos, resultados e publicações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:preparar`

- **Tipo:** IPC
- **Finalidade:** Preparar uma run local com casos do Qase e identificar quais têm automação associada.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, título, ambiente e casos
- **Saída:** Run local PREPARADA
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava runs-qase.json. Não cria nada no Qase.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:criar`

- **Tipo:** IPC
- **Finalidade:** Criar a run no Qase com os casos escolhidos.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da run local
- **Saída:** Operação externa e id remoto da run
- **Permissões:** Escrita habilitada + confirmação nativa
- **Efeito:** Cria a run no Qase após confirmação nativa. Criar a run não executa nada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:executar`

- **Tipo:** IPC
- **Finalidade:** Executar as automações associadas aos casos da run (somente capabilities declaradas).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da run local
- **Saída:** Resultados por caso e evidências
- **Permissões:** Autenticação humana nativa por capability
- **Efeito:** Executa processos locais; cada automação pede a autenticação nativa do Windows. Casos manuais ficam sem resultado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs; Broker nativo do Windows
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:resultado`

- **Tipo:** IPC
- **Finalidade:** Declarar o resultado de um caso manual.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Run, caso, status e comentário
- **Saída:** Run atualizada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava runs-qase.json marcando MANUAL e quem declarou. Nunca sobrescreve resultado de execução.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:publicar`

- **Tipo:** IPC
- **Finalidade:** Publicar no Qase os resultados ainda não publicados e reler a run.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da run local e se anexa evidências
- **Saída:** Resultados enviados e confirmação
- **Permissões:** Escrita habilitada + confirmação nativa
- **Efeito:** Envia resultados (passed, failed, blocked) após confirmação nativa; NOT_RUN nunca é enviado; repetir não duplica.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:bugs`

- **Tipo:** IPC
- **Finalidade:** Preparar rascunhos de bug para as falhas da run.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da run local
- **Saída:** Propostas de bug
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json. Não cria tickets.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:politica`

- **Tipo:** IPC
- **Finalidade:** Aprovar uma política para publicar resultados de uma run em rotinas agendadas.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, run remota, validade e usos
- **Saída:** Política de escrita
- **Permissões:** Confirmação nativa
- **Efeito:** Grava autorizacoes.json. Sem política, rotina agendada não escreve no Qase.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:revogar`

- **Tipo:** IPC
- **Finalidade:** Revogar uma política de escrita agendada.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Id da política
- **Saída:** Política revogada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava autorizacoes.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:vinculos:mapa`

- **Tipo:** IPC
- **Finalidade:** Mapa de vínculos entre projeto, Jira, Qase, repositório, tickets, casos, runs, execuções e evidências, com lacunas de cadastro.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Nós, arestas com origem (declarado, registrado ou observado), lacunas e operações recentes
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não prova cobertura.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:testes:catalogo`

- **Tipo:** IPC
- **Finalidade:** Ler os arquivos de teste da pasta do projeto, agrupar por feature e classificar cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Features, cenários, passos, tipo, confiança e motivo
- **Permissões:** Nenhuma
- **Efeito:** Leitura estática da pasta vinculada; nada é executado nem alterado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:perguntar`

- **Tipo:** IPC
- **Finalidade:** Responder uma pergunta com os dados locais do projeto (contextos aprovados, propostas, execuções, agenda). Não usa modelo de IA nem rede.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto e pergunta
- **Saída:** Linhas de resposta e telas de origem
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; nada é gravado nem enviado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:situacao`

- **Tipo:** IPC
- **Finalidade:** Resumir o que está acontecendo agora no projeto para o painel inicial.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Até cinco linhas de situação
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agentes:estado`

- **Tipo:** IPC
- **Finalidade:** Especializações, políticas e propostas de IA do projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto
- **Saída:** Configuração, matriz de capacidades com motivo, contagem de propostas de IA
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agentes:salvar`

- **Tipo:** IPC
- **Finalidade:** Habilitar especializações e bloquear capacidades da IA conectada neste projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Projeto, especializações e políticas
- **Saída:** Configuração salva
- **Permissões:** Confirmação nativa
- **Efeito:** Grava agentes.json. O bloqueio vale no servidor MCP a cada chamada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agenda:listar`

- **Tipo:** IPC
- **Finalidade:** Listar as rotinas agendadas com próxima e última execução, permissões e autorizações.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Projeto opcional
- **Saída:** Rotinas com estado, próxima execução (calculada), última execução, permissões em linguagem simples e autorizações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:salvar`

- **Tipo:** IPC
- **Finalidade:** Criar ou editar uma rotina (único, intervalo, diário ou semanal, com fuso).
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Projeto, tipo, capability declarada, ambiente, frequência, fuso, política de horários perdidos, ticket opcional
- **Saída:** Rotina salva
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava agenda.json. Editar reinicia a âncora; não autoriza nada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, INVALID_ARGUMENTS
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:estado`

- **Tipo:** IPC
- **Finalidade:** Pausar, retomar ou desativar uma rotina.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da rotina e ação
- **Saída:** Rotina atualizada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava agenda.json. Retomar não executa horários que passaram durante a pausa.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:excluir`

- **Tipo:** IPC
- **Finalidade:** Excluir uma rotina (histórico de execuções permanece).
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da rotina
- **Saída:** excluded
- **Permissões:** Confirmação nativa que a página não consegue simular
- **Efeito:** Remove a rotina de agenda.json; execuções já registradas permanecem.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP; Confirmação nativa
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:executar`

- **Tipo:** IPC
- **Finalidade:** Executar uma rotina agora (trabalho manual).
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da rotina
- **Saída:** Trabalho enfileirado
- **Permissões:** Autenticação humana nativa para executar testes
- **Efeito:** Enfileira um trabalho manual. Testes e k6 pedem a autenticação nativa do Windows a cada execução; consultas apenas leem.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, HUMAN_APPROVAL_REQUIRED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP; Broker nativo do Windows
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:autorizar`

- **Tipo:** IPC
- **Finalidade:** Autorizar previamente execuções agendadas de um escopo exato, com validade e limite de usos.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da rotina, dias (1-30) e máximo de usos
- **Saída:** Autorizações criadas (id, capability, validade, usos)
- **Permissões:** Confirmação nativa + autenticação humana do Windows (broker não alterado)
- **Efeito:** Grava autorizacoes.json somente depois da autenticação nativa do Windows para o escopo exato (hash de projeto, comando, ambiente e fontes). Qualquer mudança invalida.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, HUMAN_APPROVAL_REQUIRED, PROJECT_FOLDER_REQUIRED, RUNTIME_MISSING, NO_VERIFIED_LINK
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP; Broker nativo do Windows; Escopo por hash; Validade máxima de 30 dias; Revogável
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:revogar`

- **Tipo:** IPC
- **Finalidade:** Revogar uma autorização de execução.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da autorização
- **Saída:** Autorização revogada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava autorizacoes.json; execuções futuras daquele escopo ficam BLOCKED.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:permissoes`

- **Tipo:** IPC
- **Finalidade:** Listar autorizações de execução e políticas de publicação com seus estados.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Projeto opcional
- **Saída:** Autorizações e políticas (vigente, expirada, revogada, esgotada)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:politica`

- **Tipo:** IPC
- **Finalidade:** Aprovar uma política de publicação de comentários no Jira restrita a tickets, tipos, validade e limite.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Projeto, tickets explícitos, tipos de rotina, dias e máximo de publicações
- **Saída:** Política criada
- **Permissões:** Confirmação nativa que lista tickets, tipos e limites
- **Efeito:** Grava autorizacoes.json. Sem política, nenhuma rotina agendada comenta no Jira.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, AUTH_VALIDITY_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP; Confirmação nativa; Somente tickets listados
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:agenda:revogarpolitica`

- **Tipo:** IPC
- **Finalidade:** Revogar uma política de publicação.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** Id da política
- **Saída:** Política revogada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava autorizacoes.json; publicações agendadas deixam de ocorrer.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:execucoes:listar`

- **Tipo:** IPC
- **Finalidade:** Histórico centralizado de execuções por projeto, repositório, ticket, rotina, estado e período.
- **Origem:** Interface > Execuções
- **Destino:** main.ts > historicoCentral.ts
- **Entrada:** Filtros opcionais e limite
- **Saída:** Execuções com resultado, contagens, tentativas, evidência, comentário Jira e erros
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera nada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:execucoes:metricas`

- **Tipo:** IPC
- **Finalidade:** Indicadores reais das execuções registradas.
- **Origem:** Interface > Execuções e Métricas
- **Destino:** main.ts > historicoCentral.ts
- **Entrada:** Projeto opcional
- **Saída:** Totais PASS/FAIL/BLOCKED/NOT_RUN, última e próxima execução, rotinas ativas/pausadas, falhas de agendamento, comentários pendentes e publicados
- **Permissões:** Nenhuma
- **Efeito:** Consulta local. Não calcula porcentagem de qualidade; consulta à interface não conta como execução.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:jira:previa`

- **Tipo:** IPC
- **Finalidade:** Mostrar o comentário de resultado que seria publicado no Jira.
- **Origem:** Interface > Execuções > Comentário Jira
- **Destino:** main.ts > jiraComentario.prepararPublicacao
- **Entrada:** Id da execução
- **Saída:** Texto do comentário e estado de publicação
- **Permissões:** Nenhuma
- **Efeito:** Sem rede e sem gravação.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, JOB_NOT_FOUND, JIRA_COMMENT_NOT_APPLICABLE, JIRA_TICKET_REQUIRED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:jira:publicar`

- **Tipo:** IPC
- **Finalidade:** Publicar o comentário de resultado em um ticket do projeto vinculado (única escrita remota do produto).
- **Origem:** Interface > Execuções > Publicar no Jira
- **Destino:** main.ts (confirmação nativa) > jiraComentario.publicar > servicos.comentarJira
- **Entrada:** Id da execução
- **Saída:** Estado da publicação e id remoto do comentário
- **Permissões:** Confirmação nativa que mostra o texto exato; credencial protegida no Windows com permissão de comentar
- **Efeito:** Uma requisição POST ao Jira Cloud vinculado (comentário). Não altera status do ticket. Idempotente por execução e por marcador no comentário.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND, HUMAN_CONFIRMATION_REQUIRED, JOB_NOT_FOUND, SERVICE_PERMISSION, SERVICE_SCOPE_CHANGED, SERVICE_WRITE_BLOCKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP; Confirmação nativa; Host Atlassian fixo, caminho de comentário fixo; Projeto do ticket conferido; Sem duplicar
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:worker:estado`

- **Tipo:** IPC
- **Finalidade:** Estado real do worker de agendamentos.
- **Origem:** Interface > cabeçalho e bandeja
- **Destino:** main.ts > worker.ts
- **Entrada:** Nenhuma
- **Saída:** Em execução, pausado, batimento, pendentes, próxima execução, último erro
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:worker:pausa`

- **Tipo:** IPC
- **Finalidade:** Pausar ou retomar todos os agendamentos.
- **Origem:** Interface > Agendamentos ou menu da bandeja
- **Destino:** main.ts > agenda.ts / fila.ts / worker.ts
- **Entrada:** pausado (true/false)
- **Saída:** Estado do worker
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava a pausa global; trabalho em andamento termina sem ser corrompido.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:worker:eventos`

- **Tipo:** IPC
- **Finalidade:** Receber avisos do worker e pedidos de navegação da bandeja desde o último número visto.
- **Origem:** Interface > avisos e navegação pela bandeja
- **Destino:** main.ts > worker.ts
- **Entrada:** Último número de evento recebido
- **Saída:** Eventos (iniciado, concluído, falhou, bloqueado, publicação falhou, worker interrompido, navegar) e último número
- **Permissões:** Nenhuma
- **Efeito:** Consulta a memória do processo principal; a janela consulta periodicamente (não há canal de eventos livre na ponte).
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agenda.json, fila.json, autorizacoes.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SCHEDULE_NOT_FOUND, SCHEDULE_LIMIT, SCHEDULE_IN_THE_PAST, SCHEDULE_PROJECT_IMMUTABLE, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo; Sem comando livre: só capabilities declaradas; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e histórico de execuções por projeto

### `prumo:app:info`

- **Tipo:** IPC
- **Finalidade:** Informar versão, pasta de dados e se o app está empacotado.
- **Origem:** Interface > cabeçalho
- **Destino:** main.ts > atividades.diretorioDados
- **Entrada:** Nenhuma
- **Saída:** version, dataDir, platform, packaged
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:projetos:listar`

- **Tipo:** IPC
- **Finalidade:** Listar projetos vinculados com a situação do contrato.
- **Origem:** Interface > Projetos
- **Destino:** painel.ts > vinculos.ts > projeto.ts
- **Entrada:** Nenhuma
- **Saída:** Lista de situações (INTEGRADO, SEM_MANIFESTO, MANIFESTO_INVALIDO, PASTA_AUSENTE)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** vinculos.json; qa.project.json de cada projeto vinculado
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, LINKS_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Contrato validado pelo mesmo carregarProjeto do MCP/CLI
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:projetos:escolher`

- **Tipo:** IPC
- **Finalidade:** Abrir o seletor nativo de pasta e vincular o projeto se o contrato for válido.
- **Origem:** Interface > Projetos > Vincular pasta
- **Destino:** main.ts (diálogo nativo) > vinculos.ts
- **Entrada:** Nenhuma: a pasta vem do diálogo nativo, nunca da página
- **Saída:** canceled, linked, situation
- **Permissões:** Escolha explícita da pessoa no diálogo
- **Efeito:** Grava vinculos.json somente se o contrato for válido; nunca escreve na pasta do projeto.
- **Arquivos consultados:** qa.project.json do projeto escolhido; vinculos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; A página não informa caminhos
- **Registro:** Diagnóstico IPC

### `prumo:projetos:demo`

- **Tipo:** IPC
- **Finalidade:** Copiar o projeto de demonstração para uma pasta gravável e vinculá-lo.
- **Origem:** Interface > Projetos > Adicionar projeto de demonstração
- **Destino:** main.ts > vinculos.copiarDemonstracao
- **Entrada:** Nenhuma
- **Saída:** linked, situation
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Copia a demonstração (sem .prumo) para %LOCALAPPDATA%\PrumoQA\demonstracao, sem sobrescrever; grava vinculos.json.
- **Arquivos consultados:** resources/demo; vinculos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC

### `prumo:projetos:desvincular`

- **Tipo:** IPC
- **Finalidade:** Remover o vínculo de um projeto da lista.
- **Origem:** Interface > Projetos > Desvincular
- **Destino:** painel.ts > vinculos.removerVinculo
- **Entrada:** Raiz do projeto
- **Saída:** removed
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Altera só vinculos.json. Histórico, evidências e arquivos do projeto permanecem.
- **Arquivos consultados:** vinculos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC

### `prumo:projeto:visao`

- **Tipo:** IPC
- **Finalidade:** Métricas do projeto calculadas do histórico real.
- **Origem:** Interface > Métricas e cabeçalho
- **Destino:** painel.ts > atividades.consultarAtividades/calcularMetricas
- **Entrada:** Projeto selecionado
- **Saída:** project, metrics, directory, lastMcpClient
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** qa.project.json; arquivos .jsonl do histórico do projeto
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Só raízes vinculadas; Não registra evento de qualidade
- **Registro:** Diagnóstico IPC (somente erros; consulta frequente)

### `prumo:projeto:logs`

- **Tipo:** IPC
- **Finalidade:** Eventos de início e término das operações, com filtros.
- **Origem:** Interface > Logs
- **Destino:** painel.ts > atividades.ts
- **Entrada:** Projeto selecionado + filtros (ferramenta, estado, período, limite)
- **Saída:** Eventos de atividade, problemas e indicador de histórico completo
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** Arquivos .jsonl do histórico do projeto
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Registros inválidos são excluídos e sinalizados; Não gera evento de qualidade (sem recursão)
- **Registro:** Diagnóstico IPC (somente erros; consulta frequente)

### `prumo:projeto:historico`

- **Tipo:** IPC
- **Finalidade:** Operações consolidadas com achados e recomendações padronizadas.
- **Origem:** Interface > Histórico
- **Destino:** painel.ts > atividades.ts
- **Entrada:** Projeto selecionado + filtros
- **Saída:** Operações com estado final, achados e referência de evidência
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** Arquivos .jsonl do histórico do projeto
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Recomendação não é alteração aplicada
- **Registro:** Diagnóstico IPC (somente erros; consulta frequente)

### `prumo:projeto:evidencias`

- **Tipo:** IPC
- **Finalidade:** Resultados e logs de execuções reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.
- **Origem:** Interface > Evidências
- **Destino:** painel.ts > evidencias.consultarEvidencias
- **Entrada:** Projeto selecionado + jobId opcional (UUID)
- **Saída:** Evidências com cenários, saída mascarada e caminho
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** <projeto>/.prumo/evidencias/*.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED, EVIDENCE_TAMPERED, PROJECT_MISMATCH
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Integridade por hash; Saída mascarada e limitada
- **Registro:** Diagnóstico IPC

### `prumo:projeto:conexoes`

- **Tipo:** IPC
- **Finalidade:** Propor configuração e consultar diagnóstico de integração por cliente.
- **Origem:** Interface > Conexões
- **Destino:** painel.ts > conexoes.prepararConexao > integracoes.diagnosticarIntegracao
- **Entrada:** Projeto selecionado
- **Saída:** Comando proposto, estado, inspeção, último protocolo e uso observado
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Só consulta; não altera configurações ou executa capabilities.
- **Arquivos consultados:** Configuração Codex pela CLI e Claude local; metadados de integração e histórico deste projeto
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Configurações projetadas sem segredos; Registros antigos não comprovam UTILIZADO
- **Registro:** Diagnóstico IPC

### `prumo:conexao:aplicar`

- **Tipo:** IPC
- **Finalidade:** Adicionar o servidor MCP à configuração do Codex.
- **Origem:** Interface > Conexões > Adicionar ao Codex
- **Destino:** main.ts (confirmação nativa) > conexoes.aplicarConexao
- **Entrada:** Projeto selecionado + cliente (somente codex)
- **Saída:** configured, reason
- **Permissões:** Projeto previamente vinculado (vinculos.json). Confirmação nativa que a página não consegue simular.
- **Efeito:** Executa "codex mcp add" sem shell, sem sobrescrever configuração existente.
- **Arquivos consultados:** Configuração do Codex (via CLI do próprio cliente)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONNECTION_INSPECTION_FAILED, CONNECTION_WRITE_FAILED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Diálogo nativo com destino e comando; Não sobrescreve
- **Registro:** Diagnóstico IPC

### `prumo:conexao:testar`

- **Tipo:** IPC
- **Finalidade:** Verificar handshake, quatro ferramentas e consulta de evidências pelo SDK real, separadamente do uso observado pelo cliente.
- **Origem:** Interface > Conexões > Testar integração
- **Destino:** painel.ts > integracoes.testarProtocolo/diagnosticarIntegracao
- **Entrada:** Projeto vinculado e cliente codex ou claude
- **Saída:** Estado, inspeção, último protocolo, última chamada observada e referências de contexto
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Inicia o MCP do próprio produto e realiza somente consulta; não executa capabilities nem altera configuração.
- **Arquivos consultados:** Configuração do cliente (projeção segura); histórico e integracoes do projeto no diretório de dados
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED, INTEGRATION_LIMIT
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Nunca executa comandos vindos da configuração; SDK de teste não conta como uso Codex/Claude; Não persiste texto privado
- **Registro:** Evidência SDK separada e diagnóstico IPC

### `prumo:logs:exportar`

- **Tipo:** IPC
- **Finalidade:** Exportar o histórico bruto do projeto para um arquivo escolhido pela pessoa.
- **Origem:** Interface > Logs > Exportar
- **Destino:** main.ts (diálogos nativos) > painel.exportarLogs
- **Entrada:** Projeto selecionado
- **Saída:** exported, path
- **Permissões:** Projeto previamente vinculado (vinculos.json). Destino escolhido no diálogo.
- **Efeito:** Grava um JSON no destino escolhido. Nenhum upload.
- **Arquivos consultados:** Histórico do projeto; arquivo de destino
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Aviso sobre metadados antes de gravar; Somente campos do esquema
- **Registro:** Diagnóstico IPC

### `prumo:ajuda:documentos`

- **Tipo:** IPC
- **Finalidade:** Documentos da Central de ajuda.
- **Origem:** Interface > Ajuda
- **Destino:** painel.ajuda
- **Entrada:** Nenhuma
- **Saída:** Documentos em texto
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** app/ajuda/*.md (empacotados)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Lista fixa de arquivos
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:ajuda:versoes`

- **Tipo:** IPC
- **Finalidade:** Histórico de versões e versão instalada.
- **Origem:** Interface > Ajuda > Versões
- **Destino:** main.ts > versoes.ts
- **Entrada:** Nenhuma
- **Saída:** Versões com funcionalidades, correções, segurança e limitações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** app/versoes.json (empacotado)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Fonte validada por esquema
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:ajuda:integracoes`

- **Tipo:** IPC
- **Finalidade:** Catálogo técnico das operações IPC e das ferramentas MCP.
- **Origem:** Interface > Ajuda > Integrações técnicas
- **Destino:** main.ts > contratos.catalogo
- **Entrada:** Nenhuma
- **Saída:** Lista de operações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:atualizacao:verificar`

- **Tipo:** IPC
- **Finalidade:** Consultar a release oficial mais recente (somente quando a pessoa clica).
- **Origem:** Interface > Ajuda > Atualizações
- **Destino:** main.ts > atualizacao.verificarAtualizacao
- **Entrada:** Nenhuma: nada do usuário é enviado
- **Saída:** status, versão instalada, versão mais recente, notas, página oficial e notificacao (indicador, som)
- **Permissões:** Ação explícita da pessoa ou preferência "verificar ao iniciar" (desligada por padrão)
- **Efeito:** Uma requisição HTTPS GET ao GitHub; não baixa nem instala nada. Grava só a versão disponível e as decisões de aviso em preferencias.json.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, INDISPONIVEL, RESPOSTA_INVALIDA
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Destino fixo (api.github.com); Timeout; Sem corpo, sem cookies, sem redirecionamento; Resposta validada
- **Registro:** Diagnóstico IPC

### `prumo:atualizacao:abrir`

- **Tipo:** IPC
- **Finalidade:** Abrir no navegador a página oficial da release encontrada.
- **Origem:** Interface > Ajuda > Atualizações > Abrir página oficial
- **Destino:** main.ts > shell.openExternal
- **Entrada:** Nenhuma: a URL é a validada pelo processo principal
- **Saída:** opened
- **Permissões:** Confirmação nativa
- **Efeito:** Abre o navegador padrão na página da release; não baixa nem executa instalador.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, NO_VERIFIED_RELEASE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; URL reconstruída a partir de tag validada; Somente github.com/AnaPLysyk/Prumo-Qa
- **Registro:** Diagnóstico IPC

### `prumo:site:abrir`

- **Tipo:** IPC
- **Finalidade:** Abrir o site institucional oficial no navegador, depois de confirmar.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** main.ts > operacoesExternas.ts / fluxoQase.ts / propostas.ts
- **Entrada:** Nenhuma: a URL é fixa
- **Saída:** Se abriu ou não
- **Permissões:** Confirmação nativa
- **Efeito:** Abre o navegador padrão; nada é enviado pelo aplicativo.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (rotasEscrita.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:dados:resumo`

- **Tipo:** IPC
- **Finalidade:** Mostrar onde ficam os dados locais e quanto espaço ocupam.
- **Origem:** Interface > Ajuda > Privacidade e dados
- **Destino:** main.ts > dados.resumirDados
- **Entrada:** Nenhuma
- **Saída:** Pasta, projetos vinculados, bytes por categoria, política de retenção
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA (somente tamanhos)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Não segue links simbólicos
- **Registro:** Diagnóstico IPC

### `prumo:dados:excluir`

- **Tipo:** IPC
- **Finalidade:** Excluir histórico operacional, evidências de um projeto ou diagnósticos do aplicativo.
- **Origem:** Interface > Ajuda > Privacidade e dados
- **Destino:** main.ts (confirmação nativa) > atividades/evidencias/diagnostico
- **Entrada:** escopo (historico, evidencias, contextos ou diagnostico) + projeto quando aplicável
- **Saída:** deleted, failed
- **Permissões:** Projeto previamente vinculado (vinculos.json). Confirmação nativa destrutiva.
- **Efeito:** Apaga somente arquivos do escopo, validados por nome, tipo e caminho canônico. Nunca apaga código-fonte; não é exposto ao MCP.
- **Arquivos consultados:** Histórico do projeto; <projeto>/.prumo/evidencias; diagnóstico do app
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED, HISTORY_SYMLINK
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Confirmação nativa; Recusa links e arquivos fora do padrão; Falhas parciais informadas, nunca ocultadas
- **Registro:** Diagnóstico IPC

### `prumo:diagnostico:listar`

- **Tipo:** IPC
- **Finalidade:** Listar o diagnóstico técnico das chamadas da interface.
- **Origem:** Interface > Logs > Diagnóstico da interface
- **Destino:** main.ts > diagnostico.lerDiagnostico
- **Entrada:** Nenhuma
- **Saída:** Eventos (canal, estado, duração, código)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\diagnostico
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Somente metadados, sem argumentos
- **Registro:** Não se registra (evita recursão)

### `prumo:contextos:listar`

- **Tipo:** IPC
- **Finalidade:** Listar e pesquisar os contextos do projeto (requisitos, regras, critérios, restrições, decisões).
- **Origem:** Interface > Contextos
- **Destino:** painel.ts > contextos.listarContextos
- **Entrada:** Projeto selecionado + filtros (tipo, estado, busca, chave)
- **Saída:** Resumos com estado efetivo, versão, origem, hash e conflitos
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED, CONTEXT_LIMIT
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:contextos:obter`

- **Tipo:** IPC
- **Finalidade:** Ver um contexto com seu histórico completo de alterações.
- **Origem:** Interface > Contextos > detalhe
- **Destino:** painel.ts > contextos.obterContexto
- **Entrada:** Projeto selecionado + id do contexto
- **Saída:** Contexto, texto, estado efetivo e histórico (quem, quando, hash)
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:contextos:salvar`

- **Tipo:** IPC
- **Finalidade:** Criar um contexto, editá-lo (nova versão em rascunho) ou substituí-lo por uma versão posterior.
- **Origem:** Interface > Contextos > formulário
- **Destino:** painel.ts > contextos.criar/editar/substituirContexto
- **Entrada:** Projeto, dados do contexto e, para editar ou substituir, o id
- **Saída:** Contexto salvo com nova versão
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Grava no armazenamento local de contextos. Editar sempre invalida a aprovação anterior.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_NO_CHANGE, CONTEXT_OUTDATED, CONTEXT_TAMPERED, CONTEXT_LIMIT
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash
- **Registro:** Diagnóstico IPC

### `prumo:contextos:aprovar`

- **Tipo:** IPC
- **Finalidade:** Aprovar explicitamente o conteúdo atual de um contexto.
- **Origem:** Interface > Contextos > Aprovar
- **Destino:** main.ts (confirmação nativa) > contextos.aprovarContexto
- **Entrada:** Projeto selecionado + id do contexto
- **Saída:** Contexto APROVADO com quem aprovou e quando
- **Permissões:** Projeto previamente vinculado (vinculos.json). Confirmação nativa que a página não consegue simular; o aprovador é o usuário do Windows lido pelo processo principal. Não existe como ferramenta MCP.
- **Efeito:** Registra a aprovação do conteúdo exato; recusa sem origem, com conflito ou desatualizado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_SOURCE_REQUIRED, CONTEXT_CONFLICT, CONTEXT_OUTDATED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash; Confirmação nativa
- **Registro:** Diagnóstico IPC

### `prumo:contextos:desatualizar`

- **Tipo:** IPC
- **Finalidade:** Marcar um contexto como desatualizado (sem validade atual).
- **Origem:** Interface > Contextos > Marcar desatualizado
- **Destino:** main.ts (confirmação nativa) > contextos.desatualizarContexto
- **Entrada:** Projeto selecionado + id do contexto
- **Saída:** Contexto DESATUALIZADO
- **Permissões:** Projeto previamente vinculado (vinculos.json). Confirmação nativa.
- **Efeito:** Registra o estado; contexto desatualizado não pode mais ser editado nem aprovado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_NO_CHANGE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash; Confirmação nativa
- **Registro:** Diagnóstico IPC

### `prumo:contextos:conflito`

- **Tipo:** IPC
- **Finalidade:** Marcar ou resolver explicitamente um conflito entre contextos.
- **Origem:** Interface > Contextos > Conflito
- **Destino:** painel.ts > contextos.marcarConflito/resolverConflito
- **Entrada:** Projeto, id e (para marcar) o id do outro contexto
- **Saída:** Contexto com o conflito registrado ou resolvido
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Registra a decisão da pessoa; o Prumo nunca escolhe um lado nem resolve conflito em silêncio.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_CONFLICT, CONTEXT_OUTDATED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash
- **Registro:** Diagnóstico IPC

### `prumo:contextos:excluir`

- **Tipo:** IPC
- **Finalidade:** Excluir definitivamente um contexto.
- **Origem:** Interface > Contextos > Excluir
- **Destino:** main.ts (confirmação nativa) > contextos.excluirContexto
- **Entrada:** Projeto selecionado + id do contexto
- **Saída:** deleted
- **Permissões:** Projeto previamente vinculado (vinculos.json). Confirmação nativa destrutiva. Não existe como ferramenta MCP.
- **Efeito:** Apaga o arquivo do contexto e o seu histórico; mantém só um registro mínimo (id, data e hash) de que existiu. Nunca toca no projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CONTEXT_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash; Confirmação nativa
- **Registro:** Diagnóstico IPC

### `prumo:contextos:mcp`

- **Tipo:** IPC
- **Finalidade:** Escolher se os contextos do projeto são disponibilizados ao agente de IA conectado por MCP.
- **Origem:** Interface > Contextos > Disponibilizar ao agente
- **Destino:** main.ts (confirmação nativa ao habilitar) > contextos.gravarConfig
- **Entrada:** Projeto selecionado + habilitar (true/false)
- **Saída:** disponibilizarAoMcp
- **Permissões:** Projeto previamente vinculado (vinculos.json). Habilitar exige confirmação nativa. Padrão: desabilitado.
- **Efeito:** Quando habilitado, contexto_projeto e revisar_cobertura passam a ler os contextos deste projeto; o texto pode ser processado pelo provedor da IA conectada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\contextos\<projeto> (somente este projeto)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolado por projeto; Texto limitado e tratado como dado, nunca como instrução; Histórico encadeado por hash; Padrão seguro: desabilitado; Confirmação nativa ao habilitar
- **Registro:** Diagnóstico IPC

### `prumo:preferencias:obter`

- **Tipo:** IPC
- **Finalidade:** Ler as preferências de notificação e o aviso de atualização pendente.
- **Origem:** Interface > cabeçalho (sino) e Ajuda > Atualizações
- **Destino:** main.ts > preferencias.ts
- **Entrada:** Nenhuma
- **Saída:** preferencias (verificar ao iniciar, som, silenciar), aviso pendente (indicador, versão, notas)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\preferencias.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:preferencias:salvar`

- **Tipo:** IPC
- **Finalidade:** Alterar verificar ao iniciar, som, silenciar, tema, idioma, iniciar com o Windows e avisos de agenda.
- **Origem:** Interface > Ajuda > Atualizações > Preferências
- **Destino:** main.ts > preferencias.alterarPreferencias
- **Entrada:** Campos booleanos opcionais
- **Saída:** preferencias
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava preferencias.json. Iniciar com o Windows só registra o item de inicialização do usuário se a pessoa ligar a opção; não cria serviço do Windows, tarefa agendada nem consulta de atualização em segundo plano.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\preferencias.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Somente campos booleanos conhecidos
- **Registro:** Diagnóstico IPC

### `prumo:preferencias:visualizada`

- **Tipo:** IPC
- **Finalidade:** Marcar a versão disponível como vista (o indicador some até haver versão mais nova).
- **Origem:** Interface > sino
- **Destino:** main.ts > preferencias.marcarVisualizada
- **Entrada:** Número da versão
- **Saída:** preferencias
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava preferencias.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\preferencias.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, INVALID_VERSION
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
- **Registro:** Diagnóstico IPC

### `prumo:suporte:preparar`

- **Tipo:** IPC
- **Finalidade:** Montar localmente o relato (bug, melhoria ou sugestão) e revisar a privacidade antes de qualquer envio.
- **Origem:** Interface > Suporte > Revisar
- **Destino:** main.ts > suporte.prepararSolicitacao
- **Entrada:** Categoria, título, descrição, passos, o que incluir (versão, sistema, diagnóstico) e consentimento
- **Saída:** Texto final, bloqueios (segredos), avisos (dados pessoais), endereço oficial e aviso de issue pública
- **Permissões:** Ação explícita da pessoa; nada é anexado sem marcação
- **Efeito:** Sem rede e sem gravação: só calcula o relato.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Segredos bloqueiam o envio; Logs nunca são anexados automaticamente
- **Registro:** Diagnóstico IPC

### `prumo:suporte:abrir`

- **Tipo:** IPC
- **Finalidade:** Abrir o formulário oficial de GitHub Issues já preenchido, depois de revisado e confirmado.
- **Origem:** Interface > Suporte > Abrir no GitHub
- **Destino:** main.ts (confirmação nativa) > shell.openExternal
- **Entrada:** O mesmo relato revisado
- **Saída:** opened
- **Permissões:** Confirmação nativa que a página não consegue simular
- **Efeito:** Abre o navegador no formulário; nada é publicado até a pessoa enviar lá. Issues em repositório público são públicas.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SUPPORT_BLOCKED_SECRET
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Endereço reconstruído no processo principal; Somente github.com/AnaPLysyk/Prumo-Qa/issues/new; Segredos detectados bloqueiam
- **Registro:** Diagnóstico IPC

### `prumo:suporte:exportar`

- **Tipo:** IPC
- **Finalidade:** Salvar o relato em um arquivo local (Markdown), sem usar o GitHub.
- **Origem:** Interface > Suporte > Exportar
- **Destino:** main.ts (diálogo nativo) > fs
- **Entrada:** O mesmo relato revisado
- **Saída:** exported, path
- **Permissões:** Destino escolhido no diálogo
- **Efeito:** Grava um .md onde a pessoa escolher. Nenhum upload.
- **Arquivos consultados:** Arquivo de destino
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SUPPORT_BLOCKED_SECRET
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Segredos detectados bloqueiam
- **Registro:** Diagnóstico IPC

### `prumo:suporte:consultar`

- **Tipo:** IPC
- **Finalidade:** Consultar estado e histórico público de um chamado oficial por ação explícita.
- **Origem:** Interface > Suporte > Consultar chamado
- **Destino:** main.ts > chamados.consultarChamado
- **Entrada:** Número inteiro de issue
- **Saída:** Rótulo real, responsáveis, datas e histórico limitado ou indisponibilidade
- **Permissões:** Ação explícita da pessoa
- **Efeito:** GET público ao GitHub oficial; sem credenciais, upload ou sincronização.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SUPPORT_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Destino fixo; Sem redirecionamento; Limite e timeout; Texto remoto tratado como dado
- **Registro:** Diagnóstico IPC

### `prumo:suporte:chamado`

- **Tipo:** IPC
- **Finalidade:** Abrir a página oficial de um chamado para ler ou responder pelo GitHub.
- **Origem:** Interface > Suporte > Abrir chamado
- **Destino:** main.ts > shell.openExternal
- **Entrada:** Número inteiro de issue
- **Saída:** opened
- **Permissões:** Confirmação nativa
- **Efeito:** Abre somente o chamado no navegador; não publica comentário.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; URL reconstruída de número validado; Confirmação nativa
- **Registro:** Diagnóstico IPC

### `contexto_projeto`

- **Tipo:** MCP
- **Finalidade:** Identificar tipo, tecnologias, testes, comandos e o que falta no contexto autorizado.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > projeto.contextoProjeto
- **Entrada:** Nenhuma
- **Saída:** Contexto NOT_VERIFIED com fontes, hashes e informações ausentes
- **Permissões:** Servidor iniciado pelo cliente para um projeto
- **Efeito:** Somente leitura.
- **Arquivos consultados:** Arquivos listados no contexto do qa.project.json
- **Erros possíveis:** ROOT_REQUIRED, INVALID_MANIFEST, PATH_FORBIDDEN, SECRET_FORBIDDEN, CONTEXT_LIMIT
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Arquivos tratados como dados, não instruções; Segredos mascarados
- **Registro:** Histórico de atividades (origem MCP)

### `revisar_cobertura`

- **Tipo:** MCP
- **Finalidade:** Análise estrutural de rastreabilidade, oráculos, lacunas e redundâncias candidatas.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > qualidade.revisarCobertura
- **Entrada:** Requisito, origem, testes existentes, cenários candidatos, contradições
- **Saída:** Revisão sempre NOT_VERIFIED com fatos, hipóteses, lacunas e achados
- **Permissões:** Servidor iniciado pelo cliente para um projeto
- **Efeito:** Somente leitura; não afirma que executou algo.
- **Arquivos consultados:** Documentação e testes autorizados citados na entrada
- **Erros possíveis:** INVALID_ARGUMENTS
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Esquema estrito; Texto livre não vai ao histórico
- **Registro:** Histórico de atividades (origem MCP)

### `executar_validacao`

- **Tipo:** MCP
- **Finalidade:** Executar uma capacidade declarada no contrato, após autenticação humana.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > execucao.executarValidacao > aprovacao.ts
- **Entrada:** Nome da capacidade e pedido de autenticação
- **Saída:** Resultado PASS, FAIL, BLOCKED ou NOT_RUN com evidência
- **Permissões:** Capacidade do contrato + autenticação humana nativa do Windows
- **Efeito:** Pode executar processo local autorizado e gravar evidência. Sem aprovação retorna BLOCKED.
- **Arquivos consultados:** Comando declarado; <projeto>/.prumo/evidencias
- **Erros possíveis:** CAPABILITY_NOT_ALLOWED, HUMAN_APPROVAL_REQUIRED, POLICY_BLOCKED, PRECONDITION_MISSING, TIMEOUT, OUTPUT_LIMIT, RUNTIME_MISSING
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Sem shell nem comandos vindos do prompt; Ambiente por lista de permissão; Timeout e limite de saída; approved:true da IA não existe
- **Registro:** Histórico de atividades (origem MCP) e evidência

### `consultar_evidencias`

- **Tipo:** MCP
- **Finalidade:** Consultar resultados, logs e artefatos reais preservando o estado de cada um.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > evidencias.consultarEvidencias
- **Entrada:** jobId e critério opcionais
- **Saída:** Evidências ou NOT_RUN
- **Permissões:** Servidor iniciado pelo cliente para um projeto
- **Efeito:** Somente leitura.
- **Arquivos consultados:** <projeto>/.prumo/evidencias/*.json
- **Erros possíveis:** INVALID_JOB, EVIDENCE_TAMPERED, PROJECT_MISMATCH
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Integridade por hash; Isolamento por projeto
- **Registro:** Histórico de atividades (origem MCP)

### `listar_politicas`

- **Tipo:** MCP
- **Finalidade:** Informar à IA o que ela pode e não pode pedir neste projeto (especializações e capacidades).
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > politicasAgentes.ts
- **Entrada:** Nenhuma
- **Saída:** Especializações habilitadas e capacidades com estado e motivo
- **Permissões:** Servidor iniciado pelo cliente para um projeto
- **Efeito:** Somente leitura.
- **Arquivos consultados:** plataforma/agentes.json
- **Erros possíveis:** POLICY_BLOCKED
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Política conferida no backend a cada chamada
- **Registro:** Histórico de atividades (origem MCP)

### `propor_caso`

- **Tipo:** MCP
- **Finalidade:** Propor um caso de teste como rascunho local.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > propostas.criarProposta
- **Entrada:** Caso (título, passos, suite, prioridade...), requisito e risco
- **Saída:** Id, estado RASCUNHO, semelhantes e aviso
- **Permissões:** Capacidade propor_casos permitida pela política do projeto
- **Efeito:** Grava propostas.json. Não envia nada ao Qase; duplicata e excesso por hora são recusados.
- **Arquivos consultados:** plataforma/propostas.json
- **Erros possíveis:** POLICY_BLOCKED, NO_WORKSPACE, DUPLICATE_PROPOSAL, PROPOSAL_RATE_LIMIT, PROPOSAL_LIMIT
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Só rascunho; a pessoa revisa e publica
- **Registro:** Histórico de atividades (origem MCP)

### `propor_bug`

- **Tipo:** MCP
- **Finalidade:** Propor um bug como rascunho local.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** mcp.ts > propostas.criarProposta
- **Entrada:** Resumo, descrição, ticket de origem e rótulos
- **Saída:** Id, estado RASCUNHO, semelhantes e aviso
- **Permissões:** Capacidade propor_bugs permitida pela política do projeto
- **Efeito:** Grava propostas.json. Não cria ticket no Jira.
- **Arquivos consultados:** plataforma/propostas.json
- **Erros possíveis:** POLICY_BLOCKED, NO_WORKSPACE, DUPLICATE_PROPOSAL, PROPOSAL_RATE_LIMIT
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Só rascunho; a pessoa abre o bug
- **Registro:** Histórico de atividades (origem MCP)
