# Contratos técnicos do Prumo QA

> Arquivo **gerado** por `npm run contratos` a partir de `src/contratos.ts`. Não edite à mão: um teste compara este texto com o catálogo real.

O Prumo não abre servidor HTTP local. Existem duas interfaces de entrada; as consultas REST externas de leitura estão documentadas separadamente em [SERVICOS.md](SERVICOS.md):

- **IPC** (55 operações): entre a janela Electron e o processo principal, com remetente conferido e argumentos validados por esquema estrito.
- **MCP** (4 ferramentas): para agentes de IA, por stdio, iniciado pelo próprio cliente.

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
| `prumo:servicos:consultar` | `espacoId`, `id`, `operacao`, `pagina`, `servico` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:aceite` | `campo`, `espacoId` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:importar` | `espacoId`, `ticket` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
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
| `prumo:preferencias:salvar` | `silenciar`, `som`, `verificarAoIniciar` | Grava preferencias.json. Não cria serviço, tarefa agendada nem consulta em segundo plano. |
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
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
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

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
- **Finalidade:** Alterar verificar ao iniciar, som e silenciar.
- **Origem:** Interface > Ajuda > Atualizações > Preferências
- **Destino:** main.ts > preferencias.alterarPreferencias
- **Entrada:** Campos booleanos opcionais
- **Saída:** preferencias
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava preferencias.json. Não cria serviço, tarefa agendada nem consulta em segundo plano.
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
