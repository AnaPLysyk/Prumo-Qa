# Contratos técnicos do Prumo QA

> Arquivo **gerado** por `npm run contratos` a partir de `src/contratos.ts`. Não edite à mão: um teste compara este texto com o catálogo real.

O Prumo não tem API HTTP. Existem duas interfaces:

- **IPC** (20 operações): entre a janela Electron e o processo principal, com remetente conferido e argumentos validados por esquema estrito.
- **MCP** (4 ferramentas): para agentes de IA, por stdio, iniciado pelo próprio cliente.

## IPC (janela)

| Operação | Argumentos | Efeito |
|---|---|---|
| `prumo:app:info` | — | Consulta local; não altera o projeto. |
| `prumo:projetos:listar` | — | Consulta local; não altera o projeto. |
| `prumo:projetos:escolher` | — | Grava vinculos.json somente se o contrato for válido; nunca escreve na pasta do projeto. |
| `prumo:projetos:demo` | — | Copia a demonstração (sem .prumo) para %LOCALAPPDATA%\PrumoQA\demonstracao, sem sobrescrever; grava vinculos.json. |
| `prumo:projetos:desvincular` | `root` | Altera só vinculos.json. Histórico, evidências e arquivos do projeto permanecem. |
| `prumo:projeto:visao` | `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:logs` | `filter`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:historico` | `filter`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:evidencias` | `jobId`, `root` | Consulta local; não altera o projeto. |
| `prumo:projeto:conexoes` | `root` | Nenhuma alteração: só propõe. |
| `prumo:conexao:aplicar` | `client`, `root` | Executa "codex mcp add" sem shell, sem sobrescrever configuração existente. |
| `prumo:logs:exportar` | `root` | Grava um JSON no destino escolhido. Nenhum upload. |
| `prumo:ajuda:documentos` | — | Consulta local; não altera o projeto. |
| `prumo:ajuda:versoes` | — | Consulta local; não altera o projeto. |
| `prumo:ajuda:integracoes` | — | Consulta local; não altera o projeto. |
| `prumo:atualizacao:verificar` | — | Uma requisição HTTPS GET ao GitHub; não baixa nem instala nada. |
| `prumo:atualizacao:abrir` | — | Abre o navegador padrão na página da release; não baixa nem executa instalador. |
| `prumo:dados:resumo` | — | Consulta local; não altera o projeto. |
| `prumo:dados:excluir` | `escopo`, `root` | Apaga somente arquivos do escopo, validados por nome, tipo e caminho canônico. Nunca apaga código-fonte; não é exposto ao MCP. |
| `prumo:diagnostico:listar` | — | Consulta local; não altera o projeto. |

## MCP (agentes de IA)

| Operação | Argumentos | Efeito |
|---|---|---|
| `contexto_projeto` | — | Somente leitura. |
| `revisar_cobertura` | `candidates`, `contradictions`, `existingTests`, `requirement`, `source`, `sourcePath` | Somente leitura; não afirma que executou algo. |
| `executar_validacao` | `capability`, `solicitarAprovacao` | Pode executar processo local autorizado e gravar evidência. Sem aprovação retorna BLOCKED. |
| `consultar_evidencias` | `criterio`, `jobId` | Somente leitura. |

## Detalhes

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
- **Finalidade:** Propor a configuração MCP para Codex e Claude Code.
- **Origem:** Interface > Conexões
- **Destino:** painel.ts > conexoes.prepararConexao
- **Entrada:** Projeto selecionado
- **Saída:** Comando, destino e configuração proposta por cliente
- **Permissões:** Projeto previamente vinculado (vinculos.json).
- **Efeito:** Nenhuma alteração: só propõe.
- **Arquivos consultados:** Procura codex/claude no PATH; não lê a configuração dos clientes
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, PROJECT_NOT_LINKED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados
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
- **Saída:** status, versão instalada, versão mais recente, notas e página oficial
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Uma requisição HTTPS GET ao GitHub; não baixa nem instala nada.
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
- **Entrada:** escopo (historico, evidencias ou diagnostico) + projeto quando aplicável
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
