# Contratos técnicos do Prumo QA

> Arquivo **gerado** por `npm run contratos` a partir de `backend/aplicativo/api/catalogoDeContratos.ts`. Não edite à mão: um teste compara este texto com o catálogo real.

O Prumo não abre servidor HTTP local. Existem duas interfaces de entrada; as consultas REST externas de leitura estão documentadas separadamente em [SERVICOS.md](SERVICOS.md):

- **IPC** (165 operações): entre a janela Electron e o processo principal, com remetente conferido e argumentos validados por esquema estrito.
- **MCP** (8 ferramentas): para agentes de IA, por stdio, iniciado pelo próprio cliente.

## IPC (janela)

| Operação | Argumentos | Efeito |
|---|---|---|
| `prumo:interface:exportar` | `texto`, `tipo` | Grava somente JSON ou CSV no arquivo escolhido; sem rede. |
| `prumo:espacos:listar` | — | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:criar` | `descricao`, `nome` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:espacos:obter` | `id` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:editar` | `dados`, `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:espacos:pasta` | `id` | Grava a pasta no projeto Prumo. Sem qa.project.json, detecta a stack pela raiz e propõe o contrato; só cria o arquivo após confirmação nativa (gravação exclusiva, nunca sobrescreve). Contrato inválido não é vinculado. |
| `prumo:espacos:trazer` | `id` | Pede confirmação nativa do Windows e usa o git instalado, só com o endereço do GitHub do repositório vinculado (por https), hooks e links simbólicos desligados e as credenciais do próprio git (o Prumo não entrega a dele). Clona na pasta de dados do Prumo (repositorios); atualizar é só avanço, sem sobrescrever o trabalho local. |
| `prumo:espacos:automacoes` | `id` | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:espacos:associar` | `dados`, `id` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:listar` | — | Consulta local ou leitura externa pelo adaptador; não altera sistemas externos. |
| `prumo:servicos:adicionar` | `instancia`, `nome`, `servico`, `token`, `usuario` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:qaseprevia` | `token` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:qasepreviaconta` | `conexaoId` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:qaseimportar` | `codigos`, `previaId` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
| `prumo:servicos:qasecancelar` | `previaId` | Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa. |
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
| `prumo:repositorio:listar` | `espacoId` | Leitura local, sem Qase. |
| `prumo:repositorio:caso` | `dados`, `espacoId`, `id`, `requisito`, `risco`, `suiteLocalId` | Grava repositorio-testes-local.json. Não envia ao Qase. |
| `prumo:repositorio:suite` | `descricao`, `espacoId`, `id`, `paiId`, `titulo` | Grava repositorio-testes-local.json. Não envia ao Qase. |
| `prumo:propostas:listar` | `espacoId` | Consulta local. |
| `prumo:propostas:criar` | `dados`, `espacoId`, `falhaDeOrigem`, `requisito`, `risco`, `tipo` | Grava propostas.json. Não envia nada ao Qase ou Jira. |
| `prumo:propostas:editar` | `dados`, `id`, `requisito`, `risco` | Grava propostas.json. |
| `prumo:propostas:revisar` | `cobertura`, `duplicidade`, `id`, `requisito`, `risco` | Grava propostas.json com quem revisou e quando. Proposta de IA exige revisão completa e requisito informado. |
| `prumo:propostas:descartar` | `id` | Grava propostas.json. |
| `prumo:propostas:vincular` | `chave`, `id` | Grava propostas.json e, se a proposta veio de uma falha, registra a relação ticket ↔ caso. Não consulta nem escreve no Jira. |
| `prumo:propostas:publicar` | `camposQase`, `destino`, `id`, `marcoQase`, `severidadeQase`, `tipoId` | Cria o caso, o ticket, o defeito ou a issue somente no destino escolhido, depois da confirmação nativa, e registra o vínculo como REGISTRADO_PELO_PRUMO quando há relação conhecida. |
| `prumo:runs:listar` | `espacoId` | Consulta local. |
| `prumo:runs:preparar` | `ambiente`, `ambienteQaseId`, `casos`, `espacoId`, `marcoId`, `planoId`, `titulo` | Grava runs-qase.json. Não cria nada no Qase. |
| `prumo:runs:criar` | `id` | Cria a run no Qase após confirmação nativa. Criar a run não executa nada. |
| `prumo:runs:executar` | `id` | Executa processos locais; cada automação pede a autenticação nativa do Windows. Casos manuais ficam sem resultado. |
| `prumo:runs:resultado` | `casoId`, `comentario`, `id`, `status` | Grava runs-qase.json marcando MANUAL e quem declarou. Nunca sobrescreve resultado de execução. |
| `prumo:runs:publicar` | `anexarEvidencia`, `id` | Envia resultados (passed, failed, blocked) após confirmação nativa; NOT_RUN nunca é enviado; repetir não duplica. |
| `prumo:runs:bugs` | `classificacao`, `id` | Grava propostas.json. Não cria tickets. |
| `prumo:runs:politica` | `dias`, `espacoId`, `maxUsos`, `runId` | Grava autorizacoes.json. Sem política, rotina agendada não escreve no Qase. |
| `prumo:runs:revogar` | `id` | Grava autorizacoes.json. |
| `prumo:vinculos:mapa` | `espacoId` | Consulta local; não prova cobertura. |
| `prumo:testes:catalogo` | `espacoId` | Leitura estática da pasta vinculada; nada é executado nem alterado. |
| `prumo:testes:arquivo` | `arquivo`, `espacoId` | Somente leitura dentro da pasta vinculada; recusa caminho fora dela, link simbólico, arquivo que não é de teste ou maior que 300 KB. |
| `prumo:testes:pipelines` | `espacoId` | Somente leitura dentro da pasta vinculada; ignora link simbólico, arquivo maior que 300 KB e mais de 50 pipelines. Nada é executado. |
| `prumo:testes:gravar` | `arquivo`, `conteudo`, `espacoId`, `hashBase` | Pede confirmação nativa do Windows; grava só dentro da pasta vinculada, só arquivo de teste (.spec/.test, .feature, test_*.py) ou pipeline (.github/workflows/*.yml), até 300 KB, sem link simbólico, por troca atômica; recusa se o arquivo mudou fora do Prumo ou já existe ao criar. Nada é executado nem enviado. |
| `prumo:assistente:perguntar` | `espacoId`, `pergunta` | Consulta local; nada é gravado nem enviado. |
| `prumo:assistente:situacao` | `espacoId` | Consulta local. |
| `prumo:assistente:conversar` | `agente`, `contexto`, `espacoId`, `historico`, `pergunta`, `primeira`, `provedor` | Não grava a conversa: registra só o atendimento (agente, modo e fontes) em conhecimento.db. A memória da sessão (até 6 turnos) e o contexto do teste aberto vêm da janela. Pedidos como "me chama de…" e "lembra que…" gravam o perfil ou um rascunho de conhecimento. Com provedor externo autorizado, executa o CLI local sem shell, com tempo limite; linhas APRENDIZADO da IA viram rascunho. |
| `prumo:assistente:agentes` | `espacoId` | Consulta local. |
| `prumo:conversas:listar` | `agente`, `espacoId` | Consulta local. |
| `prumo:conversas:apagar` | `espacoId` | Remove conversas/<projeto>.jsonl após confirmação nativa. |
| `prumo:assistente:abertura` | `espacoId` | Consulta local. |
| `prumo:assistente:avaliar` | `agenteCorreto`, `avaliacao`, `id`, `pergunta` | Grava a avaliação e o vocabulário em conhecimento.db; a pergunta não é gravada. |
| `prumo:conhecimento:estado` | `espacoId` | Consulta local (cria o banco e o conhecimento inicial se ainda não existirem). |
| `prumo:conhecimento:listar` | `agente`, `busca`, `espacoId`, `estados`, `somenteDoAgente` | Consulta local. |
| `prumo:conhecimento:criar` | `agente`, `espacoId`, `texto`, `tipo`, `titulo` | Grava em conhecimento.db com segredos mascarados e sem duplicar. |
| `prumo:conhecimento:decidir` | `estado`, `id` | Grava o estado e a data da decisão. |
| `prumo:conhecimento:apagar` | `id` | Remove a linha de conhecimento.db após confirmação nativa. |
| `prumo:conhecimento:vocabulario` | `agente` | Consulta local. |
| `prumo:conhecimento:esquecer` | `agente`, `termo` | Remove o termo do vocabulário. |
| `prumo:conhecimento:mostrar` | — | Abre o Explorer com o arquivo selecionado; nada é enviado. |
| `prumo:administracao:mapa` | — | Consulta local de um arquivo do próprio aplicativo, gerado no build; não lê projetos vinculados nem dados da pessoa. |
| `prumo:administracao:codigo` | `caminho` | Consulta local: lê dist/documentacao/codigo.json, gerado no build; nada do projeto da pessoa é lido. |
| `prumo:agentes:orquestracoes` | `espacoId` | Consulta local de orquestracoes.jsonl; o registro guarda só metadados, sem a pergunta e sem a resposta. |
| `prumo:agentes:rastrear` | `agente`, `espacoId`, `pergunta` | Consulta local: não chama IA e não grava conversa, atendimento nem aprendizado. |
| `prumo:skills:listar` | `busca`, `especializacao`, `estados` | Consulta local (cria o banco e sincroniza os trechos que acompanham o aplicativo). |
| `prumo:skills:criar` | `especializacao`, `texto`, `titulo` | Grava em skills.db com segredos mascarados e sem duplicar; passa a ir para o prompt quando combinar com a pergunta. |
| `prumo:skills:decidir` | `estado`, `id` | Grava o estado e a data da decisão. Só trechos APROVADOS vão para o prompt. |
| `prumo:skills:importar` | `especializacao`, `fonte` | Abre o seletor de pastas do sistema; recusa pasta sem licença aberta reconhecida (MIT, Apache-2.0, BSD, ISC, CC). Nada é baixado nem executado; scripts da pasta são ignorados. |
| `prumo:perfil:obter` | — | Consulta local. |
| `prumo:perfil:salvar` | `comoChamar`, `compartilharComIa`, `experiencia`, `foco`, `papel` | Grava a única linha da tabela perfil. |
| `prumo:ia:delegacao` | `provedor`, `valor` | Grava preferencias.json. Autorizar exige confirmação nativa; revogar não. |
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
| `prumo:projetos:escolher` | — | Grava vinculos.json somente se o contrato for válido. Sem qa.project.json, propõe o contrato detectado e só cria esse arquivo após confirmação nativa (2.10.2); nenhuma outra escrita na pasta do projeto. |
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
| `prumo:atualizacao:instalar` | — | Baixa o instalador oficial e o .sha256 da release no GitHub, confere o resumo, executa o instalador (/S --updated --force-run) e fecha o Prumo, que reabre na versão nova. Fora do pacote nunca executa instalador. |
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
| `prumo:preferencias:salvar` | `avisoAutomatico`, `ia`, `idioma`, `iniciarComWindows`, `notificarAgenda`, `silenciar`, `som`, `tema`, `verificarAoIniciar` | Grava preferencias.json. Iniciar com o Windows só registra o item de inicialização do usuário se a pessoa ligar a opção; não cria serviço do Windows, tarefa agendada nem consulta de atualização em segundo plano. |
| `prumo:preferencias:visualizada` | `versao` | Grava preferencias.json. |
| `prumo:suporte:preparar` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Sem rede e sem gravação: só calcula o relato. |
| `prumo:suporte:abrir` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Abre o navegador no formulário; nada é publicado até a pessoa enviar lá. Issues em repositório público são públicas. |
| `prumo:suporte:exportar` | `categoria`, `consentimento`, `descricao`, `esperado`, `incluirDiagnostico`, `incluirSistema`, `incluirVersao`, `passos`, `titulo` | Grava um .md onde a pessoa escolher. Nenhum upload. |
| `prumo:suporte:consultar` | `numero` | GET público ao GitHub oficial; sem credenciais, upload ou sincronização. |
| `prumo:suporte:chamado` | `numero` | Abre somente o chamado no navegador; não publica comentário. |
| `prumo:conta:sessao` | — | Consulta local; não renova a sessão. |
| `prumo:conta:entrar` | `login`, `senha` | Abre a sessão na memória; conta tentativas erradas e bloqueia a conta no limite configurado. |
| `prumo:conta:sair` | — | Esquece a sessão da memória. |
| `prumo:conta:cadastrar` | `login`, `nome`, `senha` | Grava a conta com o papel de cadastro; com aprovação ligada, ela só entra depois que a Administração aprovar. |
| `prumo:conta:recuperar` | `codigo`, `login`, `novaSenha` | Troca a senha e o código; tentativas erradas contam para o bloqueio. |
| `prumo:conta:githubiniciar` | `ativar` | Abre um endereço local temporário, só neste computador e por 5 minutos, que só aceita a volta do GitHub com o state e o PKCE desta tentativa; conta existente entra e ganha a conexão do GitHub, conta nova fica PENDENTE. |
| `prumo:conta:githubestado` | `cancelar` | Consulta a tentativa em andamento; cancelar fecha o endereço local. |
| `prumo:conta:googleiniciar` | `ativar` | Abre um endereço local temporário, só neste computador e por 5 minutos, que só aceita a volta do Google com o state e o PKCE desta tentativa; conta existente entra, conta nova fica PENDENTE. O Google serve só para entrar: nenhuma conexão é criada. |
| `prumo:conta:googleestado` | `cancelar` | Consulta a tentativa em andamento; cancelar fecha o endereço local. |
| `prumo:conta:senha` | `atual`, `nova` | Grava o resumo da senha nova. |
| `prumo:conta:perfil` | `nome` | Grava o nome na conta. |
| `prumo:usuarios:ativar` | `login`, `nome`, `senha` | Cria acessos.json; a partir daí a janela exige login e confere as permissões em cada canal. |
| `prumo:usuarios:listar` | — | Consulta local. |
| `prumo:usuarios:criar` | `admin`, `login`, `nome`, `papel` | Grava a conta; a pessoa troca a senha no primeiro acesso. |
| `prumo:usuarios:alterar` | `admin`, `estado`, `id`, `nome`, `papel` | Grava a conta; vale no próximo pedido daquela pessoa. |
| `prumo:usuarios:senha` | `id` | Troca a senha, exige troca no próximo acesso e desbloqueia a conta. |
| `prumo:usuarios:desbloquear` | `id` | Zera as tentativas erradas. |
| `prumo:usuarios:excluir` | `id` | Remove a conta de acessos.json. |
| `prumo:papeis:listar` | — | Consulta local. |
| `prumo:papeis:salvar` | `descricao`, `id`, `nome`, `telas` | Grava o papel; o Administrador é fixo. |
| `prumo:papeis:excluir` | `id` | Remove o papel. |
| `prumo:acesso:configuracao` | — | Consulta local. |
| `prumo:acesso:salvar` | `aprovarCadastros`, `cadastroAberto`, `minutosDeBloqueio`, `minutosDeInatividade`, `papelDoCadastro`, `tentativasAntesDoBloqueio` | Grava em acessos.json; novos cadastros nunca entram como administrador. |
| `prumo:acesso:google` | `clientId`, `clientSecret` | O Client ID vai para acessos.json; o segredo só para o cofre do sistema e nunca volta para a janela. |
| `prumo:acesso:github` | `clientId`, `clientSecret` | O Client ID vai para acessos.json; o segredo só para o cofre do sistema e nunca volta para a janela. |
| `prumo:plataforma:agentes` | — | Consulta local. |
| `prumo:plataforma:salvar` | `desligados`, `iaExterna`, `orquestracao` | Grava agentes-plataforma.json; vale para o chat e para o servidor MCP. |

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
| `propor_aprendizado` | `agente`, `texto`, `tipo`, `titulo` | Grava RASCUNHO em conhecimento.db; não aprova nem publica. |

## Detalhes

### `prumo:interface:exportar`

- **Tipo:** IPC
- **Finalidade:** Exportar uma prévia de agente, métricas ou evidências consultadas, sem executar o conteúdo.
- **Origem:** Interface > Agentes, Métricas ou Execuções > Exportar
- **Destino:** backend/compartilhado/api/interfaceExportar.ts
- **Entrada:** Tipo fechado e texto limitado a 2 MiB
- **Saída:** exported, path
- **Permissões:** Destino escolhido pela pessoa no diálogo nativo.
- **Efeito:** Grava somente JSON ou CSV no arquivo escolhido; sem rede.
- **Arquivos consultados:** Arquivo escolhido no diálogo; nunca caminho recebido do renderer
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, EXPORT_FORMAT_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Extensões fixas JSON/CSV; Não exposto ao MCP; Conteúdo nunca executado
- **Registro:** Diagnóstico IPC somente de metadados

### `prumo:espacos:listar`

- **Tipo:** IPC
- **Finalidade:** espacos:listar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosListar.ts > listarEspacos
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:criar`

- **Tipo:** IPC
- **Finalidade:** espacos:criar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosCriar.ts > criarEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:obter`

- **Tipo:** IPC
- **Finalidade:** espacos:obter: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosObter.ts > obterEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:editar`

- **Tipo:** IPC
- **Finalidade:** espacos:editar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosEditar.ts > editarEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:pasta`

- **Tipo:** IPC
- **Finalidade:** Vincular a pasta de um repositório de código ao projeto Prumo, de qualquer stack.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosPasta.ts > confirmarNoWindows, obterEspaco, vincularPastaDoDisco
- **Entrada:** Id do projeto; a pasta vem do diálogo nativo, nunca da página
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Grava a pasta no projeto Prumo. Sem qa.project.json, detecta a stack pela raiz e propõe o contrato; só cria o arquivo após confirmação nativa (gravação exclusiva, nunca sobrescreve). Contrato inválido não é vinculado.
- **Arquivos consultados:** qa.project.json da pasta escolhida (criado só com aprovação); dados locais plataforma
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE, WORKSPACE_LOCAL_CONTRACT_INVALID, WORKSPACE_LOCAL_FOLDER_MISSING, WORKSPACE_LOCAL_DUPLICATE, CONTRACT_EXISTS
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:trazer`

- **Tipo:** IPC
- **Finalidade:** Trazer o repositório do GitHub vinculado ao projeto para uma pasta deste computador (ou atualizá-lo), para a IDE de Testes poder editá-lo.
- **Origem:** Interface > Testes > IDE
- **Destino:** backend/projetos/api/espacosTrazer.ts > confirmarNoWindows, diretorioDados, obterEspaco, clonarOuAtualizarRepositorio, repositorioValido, vincularPastaDoDisco
- **Entrada:** Id do projeto
- **Saída:** Ação (clonado ou atualizado), pasta, ramo e se a pasta foi vinculada ao projeto
- **Permissões:** Projetos: USAR
- **Efeito:** Pede confirmação nativa do Windows e usa o git instalado, só com o endereço do GitHub do repositório vinculado (por https), hooks e links simbólicos desligados e as credenciais do próprio git (o Prumo não entrega a dele). Clona na pasta de dados do Prumo (repositorios); atualizar é só avanço, sem sobrescrever o trabalho local.
- **Arquivos consultados:** Pasta de dados do Prumo, repositorios/<projeto>/<repositório>
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE, GIT_UNAVAILABLE, GIT_AUTH, GIT_FAILED, GIT_TIMEOUT, GIT_URL_INVALID, GITHUB_NOT_LINKED, CLONE_DESTINATION_BUSY, CLONE_REMOTE_MISMATCH, CLONE_CANNOT_FAST_FORWARD, CLONE_NOT_FROM_PRUMO
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:automacoes`

- **Tipo:** IPC
- **Finalidade:** espacos:automacoes: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosAutomacoes.ts > localizarK6, contextoCompleto, carregarProjeto, obterEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:espacos:associar`

- **Tipo:** IPC
- **Finalidade:** espacos:associar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/projetos/api/espacosAssociar.ts > associarEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:listar`

- **Tipo:** IPC
- **Finalidade:** servicos:listar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosListar.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:adicionar`

- **Tipo:** IPC
- **Finalidade:** servicos:adicionar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosAdicionar.ts > confirmarNoWindows, servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:qaseprevia`

- **Tipo:** IPC
- **Finalidade:** servicos:qaseprevia: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosQaseprevia.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:qasepreviaconta`

- **Tipo:** IPC
- **Finalidade:** servicos:qasepreviaconta: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosQasepreviaconta.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:qaseimportar`

- **Tipo:** IPC
- **Finalidade:** servicos:qaseimportar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosQaseimportar.ts > confirmarNoWindows, servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:qasecancelar`

- **Tipo:** IPC
- **Finalidade:** servicos:qasecancelar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosQasecancelar.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:validar`

- **Tipo:** IPC
- **Finalidade:** servicos:validar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosValidar.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:remover`

- **Tipo:** IPC
- **Finalidade:** servicos:remover: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosRemover.ts > confirmarNoWindows, servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:recursos`

- **Tipo:** IPC
- **Finalidade:** servicos:recursos: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosRecursos.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:vincular`

- **Tipo:** IPC
- **Finalidade:** servicos:vincular: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosVincular.ts > confirmarNoWindows, servicosDoAplicativo, obterEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:desvincular`

- **Tipo:** IPC
- **Finalidade:** servicos:desvincular: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosDesvincular.ts > confirmarNoWindows, obterEspaco, removerVinculoServico
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:conferir`

- **Tipo:** IPC
- **Finalidade:** servicos:conferir: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosConferir.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:consultar`

- **Tipo:** IPC
- **Finalidade:** servicos:consultar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosConsultar.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Metadados ou dados da consulta com origem, data e cache:false
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Consulta local ou leitura externa pelo adaptador; não altera sistemas externos.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:aceite`

- **Tipo:** IPC
- **Finalidade:** servicos:aceite: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/conexoes/api/servicosAceite.ts > servicosDoAplicativo
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:servicos:importar`

- **Tipo:** IPC
- **Finalidade:** servicos:importar: gestão explícita do projeto Prumo e integrações de leitura.
- **Origem:** Interface > Projetos, Tickets, Testes ou Conexões
- **Destino:** backend/agentes/api/servicosImportar.ts > confirmarNoWindows, usuarioDoWindows, textoRemoto, servicosDoAplicativo, salvarContextoDaPasta, obterEspaco
- **Entrada:** Argumentos definidos pelo esquema estrito; nunca método ou endereço de consulta arbitrário
- **Saída:** Registro local ou confirmação de cancelamento
- **Permissões:** Ação explícita da pessoa; conta e projeto selecionados. Escrita externa e execução não autorizadas.
- **Efeito:** Altera somente dados próprios do aplicativo; ações sensíveis exigem confirmação nativa.
- **Arquivos consultados:** Dados locais plataforma; credenciais exclusivamente protegidas pelo sistema operacional
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WORKSPACE_NOT_FOUND, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por identificador de projeto, conexão e instância; Sem conteúdo remoto ou token nos logs; Não exposto ao MCP
- **Registro:** Diagnóstico IPC e metadados por projeto; conteúdo remoto não persistido

### `prumo:operacoes:previa`

- **Tipo:** IPC
- **Finalidade:** Mostrar o resumo, o efeito e a chave de idempotência de uma operação externa antes de executá-la.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/conexoes/api/operacoesPrevia.ts > prepararOperacao
- **Entrada:** Projeto, operação do catálogo e parâmetros
- **Saída:** Resumo mascarado, efeito, chave e se a escrita está habilitada
- **Permissões:** Nenhuma
- **Efeito:** Sem rede e sem gravação.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:operacoes:executar`

- **Tipo:** IPC
- **Finalidade:** Executar uma operação externa do catálogo (criar ticket/caso/plano/run, anexar, editar, mudar status, vincular, branch, commit de teste, PR).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/conexoes/api/operacoesExecutar.ts > textoNoIdioma, confirmarNoWindows, nomeServico, executarOperacao, prepararOperacao, servicosDoAplicativo, idiomaAtual, obterEspaco, resolverAnexo
- **Entrada:** Projeto, operação, parâmetros e, para anexos, evidência do projeto ou arquivo escolhido no diálogo nativo
- **Saída:** Registro da operação com estado (CONFIRMADA, ENVIADA, FALHA, BLOQUEADA) e identificador/link remoto
- **Permissões:** Escrita habilitada no projeto + confirmação nativa com o resumo exato
- **Efeito:** Escreve no Jira, Qase ou GitHub vinculados somente depois de confirmação nativa; relê o serviço para confirmar; repetir não duplica.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs; Caminho de arquivo nunca vem da página
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:operacoes:listar`

- **Tipo:** IPC
- **Finalidade:** Livro-razão das operações externas por projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/conexoes/api/operacoesListar.ts > listarOperacoes
- **Entrada:** Projeto opcional e limite
- **Saída:** Operações com estado, resumo, identificador remoto e tentativas
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:escrita:estado`

- **Tipo:** IPC
- **Finalidade:** Ver em quais serviços a escrita está habilitada no projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/conexoes/api/escritaEstado.ts > catalogoOperacoes, permissoesDoEspaco
- **Entrada:** Projeto
- **Saída:** Habilitação por serviço
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:escrita:habilitar`

- **Tipo:** IPC
- **Finalidade:** Habilitar ou desabilitar a escrita externa de um serviço no projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/conexoes/api/escritaHabilitar.ts > textoNoIdioma, confirmarNoWindows, usuarioDoWindows, nomeServico, habilitarEscrita, idiomaAtual
- **Entrada:** Projeto, serviço e habilitada
- **Saída:** Estado da habilitação
- **Permissões:** Confirmação nativa ao habilitar
- **Efeito:** Grava permissoes-servicos.json. Habilitar não executa nada; cada operação ainda pede confirmação.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:repositorio:listar`

- **Tipo:** IPC
- **Finalidade:** Consultar casos e suítes locais, incluindo casos antigos sem criar duplicatas.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/repositorioListar.ts > listarRepositorioLocal
- **Entrada:** Projeto selecionado
- **Saída:** Casos e suítes locais
- **Permissões:** Testes: VER
- **Efeito:** Leitura local, sem Qase.
- **Arquivos consultados:** repositorio-testes-local.json e propostas.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:repositorio:caso`

- **Tipo:** IPC
- **Finalidade:** Criar ou editar caso local independente, com migração segura do legado.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/repositorioCaso.ts > salvarCasoLocal
- **Entrada:** Projeto, dados de caso e suite opcional
- **Saída:** Caso local com ID estável
- **Permissões:** Testes: USAR
- **Efeito:** Grava repositorio-testes-local.json. Não envia ao Qase.
- **Arquivos consultados:** repositorio-testes-local.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:repositorio:suite`

- **Tipo:** IPC
- **Finalidade:** Criar ou editar suíte local do projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/repositorioSuite.ts > salvarSuiteLocal
- **Entrada:** Projeto, título, descrição e pai opcional
- **Saída:** Suíte local persistida
- **Permissões:** Testes: USAR
- **Efeito:** Grava repositorio-testes-local.json. Não envia ao Qase.
- **Arquivos consultados:** repositorio-testes-local.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:listar`

- **Tipo:** IPC
- **Finalidade:** Listar propostas de casos e bugs (da pessoa, do Prumo ou de uma IA).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasListar.ts > listarPropostas
- **Entrada:** Projeto
- **Saída:** Propostas com estado, origem, revisão e semelhantes
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:criar`

- **Tipo:** IPC
- **Finalidade:** Criar uma proposta de caso de teste ou de bug em rascunho.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasCriar.ts > criarProposta
- **Entrada:** Projeto, tipo e dados (esquema estrito)
- **Saída:** Proposta
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json. Não envia nada ao Qase ou Jira.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:editar`

- **Tipo:** IPC
- **Finalidade:** Editar uma proposta; invalida a revisão anterior.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasEditar.ts > editarProposta
- **Entrada:** Id e dados
- **Saída:** Proposta
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:revisar`

- **Tipo:** IPC
- **Finalidade:** Registrar a revisão (duplicidade, requisito, risco e cobertura) de uma proposta.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasRevisar.ts > textoNoIdioma, confirmarNoWindows, usuarioDoWindows, idiomaAtual, revisarProposta
- **Entrada:** Id e as quatro confirmações
- **Saída:** Proposta REVISADA
- **Permissões:** Confirmação da pessoa
- **Efeito:** Grava propostas.json com quem revisou e quando. Proposta de IA exige revisão completa e requisito informado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:descartar`

- **Tipo:** IPC
- **Finalidade:** Descartar uma proposta.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasDescartar.ts > descartarProposta
- **Entrada:** Id da proposta
- **Saída:** Proposta DESCARTADA
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:vincular`

- **Tipo:** IPC
- **Finalidade:** Vincular uma proposta de bug a um ticket que já existe no Jira.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasVincular.ts > vincularPropostaATicket
- **Entrada:** Id da proposta e chave do ticket
- **Saída:** Proposta VINCULADA
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json e, se a proposta veio de uma falha, registra a relação ticket ↔ caso. Não consulta nem escreve no Jira.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:propostas:publicar`

- **Tipo:** IPC
- **Finalidade:** Publicar uma proposta (caso no Qase; bug ou melhoria no Jira, em Defeitos Qase ou em GitHub Issues).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/tickets/api/propostasPublicar.ts > textoNoIdioma, confirmarNoWindows, nomeServico, prepararOperacao, servicosDoAplicativo, idiomaAtual, obterEspaco, obterProposta, podePublicar, parametrosDaIssueGithub, parametrosDoDefeitoQase, publicarProposta
- **Entrada:** Id, destino (jira, qase ou github), tipo do ticket Jira e severidade Qase quando aplicáveis
- **Saída:** Registro da operação externa e proposta PUBLICADA
- **Permissões:** Escrita habilitada + revisão (IA) + confirmação nativa
- **Efeito:** Cria o caso, o ticket, o defeito ou a issue somente no destino escolhido, depois da confirmação nativa, e registra o vínculo como REGISTRADO_PELO_PRUMO quando há relação conhecida.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:listar`

- **Tipo:** IPC
- **Finalidade:** Listar as runs locais do projeto (preparadas, criadas, executadas e publicadas).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsListar.ts > listarRunsLocais
- **Entrada:** Projeto
- **Saída:** Runs com casos, resultados e publicações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:preparar`

- **Tipo:** IPC
- **Finalidade:** Preparar uma run local com casos do Qase e identificar quais têm automação associada.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsPreparar.ts > prepararRunLocal
- **Entrada:** Projeto, título, ambiente e casos
- **Saída:** Run local PREPARADA
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava runs-qase.json. Não cria nada no Qase.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:criar`

- **Tipo:** IPC
- **Finalidade:** Criar a run no Qase com os casos escolhidos.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsCriar.ts > textoNoIdioma, confirmarNoWindows, prepararOperacao, servicosDoAplicativo, idiomaAtual, obterEspaco, obterRunLocal, criarRunNoQase, parametrosDaRunQase
- **Entrada:** Id da run local
- **Saída:** Operação externa e id remoto da run
- **Permissões:** Escrita habilitada + confirmação nativa
- **Efeito:** Cria a run no Qase após confirmação nativa. Criar a run não executa nada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:executar`

- **Tipo:** IPC
- **Finalidade:** Executar as automações associadas aos casos da run (somente capabilities declaradas).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsExecutar.ts > textoNoIdioma, confirmarNoWindows, servicosDoAplicativo, idiomaAtual, executarValidacao, obterRunLocal, executarRunLocal
- **Entrada:** Id da run local
- **Saída:** Resultados por caso e evidências
- **Permissões:** Autenticação humana nativa por capability
- **Efeito:** Executa processos locais; cada automação pede a autenticação nativa do Windows. Casos manuais ficam sem resultado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs; Broker nativo do Windows
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:resultado`

- **Tipo:** IPC
- **Finalidade:** Declarar o resultado de um caso manual.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsResultado.ts > textoNoIdioma, confirmarNoWindows, usuarioDoWindows, idiomaAtual, declararResultadoManual
- **Entrada:** Run, caso, status e comentário
- **Saída:** Run atualizada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava runs-qase.json marcando MANUAL e quem declarou. Nunca sobrescreve resultado de execução.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:publicar`

- **Tipo:** IPC
- **Finalidade:** Publicar no Qase os resultados ainda não publicados e reler a run.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsPublicar.ts > textoNoIdioma, confirmarNoWindows, servicosDoAplicativo, idiomaAtual, obterRunLocal, publicarRunLocal
- **Entrada:** Id da run local e se anexa evidências
- **Saída:** Resultados enviados e confirmação
- **Permissões:** Escrita habilitada + confirmação nativa
- **Efeito:** Envia resultados (passed, failed, blocked) após confirmação nativa; NOT_RUN nunca é enviado; repetir não duplica.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:bugs`

- **Tipo:** IPC
- **Finalidade:** Preparar rascunhos de bug para as falhas da run.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsBugs.ts > propostasDeBugs
- **Entrada:** Id da run local e, se quiser, a classificação das falhas (bug de produto, outro bug ou melhoria)
- **Saída:** Propostas de bug
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava propostas.json. Não cria tickets.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:politica`

- **Tipo:** IPC
- **Finalidade:** Aprovar uma política para publicar resultados de uma run em rotinas agendadas.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsPolitica.ts > criarPoliticaEscrita, textoNoIdioma, confirmarNoWindows, usuarioDoWindows, idiomaAtual, obterEspaco
- **Entrada:** Projeto, run remota, validade e usos
- **Saída:** Política de escrita
- **Permissões:** Confirmação nativa
- **Efeito:** Grava autorizacoes.json. Sem política, rotina agendada não escreve no Qase.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:runs:revogar`

- **Tipo:** IPC
- **Finalidade:** Revogar uma política de escrita agendada.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/runsRevogar.ts > revogarPoliticaEscrita
- **Entrada:** Id da política
- **Saída:** Política revogada
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava autorizacoes.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:vinculos:mapa`

- **Tipo:** IPC
- **Finalidade:** Mapa de vínculos entre projeto, Jira, Qase, repositório, tickets, casos, runs, execuções e evidências, com lacunas de cadastro.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/vinculosMapa.ts > mapaDeVinculos
- **Entrada:** Projeto
- **Saída:** Nós, arestas com origem (declarado, registrado ou observado), lacunas e operações recentes
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não prova cobertura.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:testes:catalogo`

- **Tipo:** IPC
- **Finalidade:** Ler os arquivos de teste da pasta do projeto, agrupar por feature e classificar cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade).
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/testesCatalogo.ts > obterEspaco, catalogoDeTestes
- **Entrada:** Projeto
- **Saída:** Features, cenários, passos, tipo, confiança e motivo
- **Permissões:** Nenhuma
- **Efeito:** Leitura estática da pasta vinculada; nada é executado nem alterado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:testes:arquivo`

- **Tipo:** IPC
- **Finalidade:** Ler o conteúdo de um arquivo de teste listado pelo catálogo, para a visão de código.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/testesArquivo.ts > hash, mascarar, obterEspaco, arquivoDeTeste
- **Entrada:** Projeto e caminho relativo do arquivo de teste
- **Saída:** Caminho, número de linhas e conteúdo com segredos mascarados
- **Permissões:** Nenhuma
- **Efeito:** Somente leitura dentro da pasta vinculada; recusa caminho fora dela, link simbólico, arquivo que não é de teste ou maior que 300 KB.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:testes:pipelines`

- **Tipo:** IPC
- **Finalidade:** Listar os pipelines do GitHub Actions (.github/workflows) da pasta vinculada ao projeto, para a IDE de Testes.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/testesPipelines.ts > obterEspaco, listarPipelines
- **Entrada:** Projeto
- **Saída:** Se há pasta vinculada e, para cada pipeline, caminho, nome, eventos, jobs e número de linhas
- **Permissões:** Testes: VER
- **Efeito:** Somente leitura dentro da pasta vinculada; ignora link simbólico, arquivo maior que 300 KB e mais de 50 pipelines. Nada é executado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:testes:gravar`

- **Tipo:** IPC
- **Finalidade:** Gravar ou criar um arquivo de teste na pasta vinculada, pela IDE de Testes.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/testes/api/testesGravar.ts > confirmarNoWindows, obterEspaco, escreverArquivoDeTeste, pareceArquivoDePipeline
- **Entrada:** Projeto, caminho relativo, conteúdo e SHA-256 do conteúdo lido (nulo para arquivo novo)
- **Saída:** Caminho, número de linhas, novo SHA-256 e se o arquivo foi criado
- **Permissões:** Testes: USAR
- **Efeito:** Pede confirmação nativa do Windows; grava só dentro da pasta vinculada, só arquivo de teste (.spec/.test, .feature, test_*.py) ou pipeline (.github/workflows/*.yml), até 300 KB, sem link simbólico, por troca atômica; recusa se o arquivo mudou fora do Prumo ou já existe ao criar. Nada é executado nem enviado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:perguntar`

- **Tipo:** IPC
- **Finalidade:** Responder uma pergunta com os dados locais do projeto (contextos aprovados, propostas, execuções, agenda). Não usa modelo de IA nem rede.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/inicio/api/assistentePerguntar.ts > perguntarAoAssistenteLocal
- **Entrada:** Projeto e pergunta
- **Saída:** Linhas de resposta e telas de origem
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; nada é gravado nem enviado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:situacao`

- **Tipo:** IPC
- **Finalidade:** Resumir o que está acontecendo agora no projeto para o painel inicial.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/inicio/api/assistenteSituacao.ts > situacaoDoProjeto
- **Entrada:** Projeto
- **Saída:** Até cinco linhas de situação
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:conversar`

- **Tipo:** IPC
- **Finalidade:** Rotear a pergunta do chat para um agente local e responder com dados deste computador; opcionalmente delegar ao Claude Code/Codex já autorizado.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/assistenteConversar.ts > registrarAtendimento, conversar, executarCliDeIa, executavelDaIa, lerPreferencias
- **Entrada:** Projeto, pergunta, agente opcional e provedor
- **Saída:** Agente, linhas, fontes, modo (LOCAL/CLAUDE/CODEX), estilo, rota, próximos passos, ações (aprovar/descartar aprendizado), pendência de perfil e atendimentoId
- **Permissões:** Delegação externa exige autorização prévia com confirmação nativa
- **Efeito:** Não grava a conversa: registra só o atendimento (agente, modo e fontes) em conhecimento.db. A memória da sessão (até 6 turnos) e o contexto do teste aberto vêm da janela. Pedidos como "me chama de…" e "lembra que…" gravam o perfil ou um rascunho de conhecimento. Com provedor externo autorizado, executa o CLI local sem shell, com tempo limite; linhas APRENDIZADO da IA viram rascunho.
- **Arquivos consultados:** conhecimento.db; backend/agentes/skills/<especialização>/SKILL.md
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:agentes`

- **Tipo:** IPC
- **Finalidade:** Listar os agentes do chat, suas especializações, capacidades e a disponibilidade de Claude Code/Codex.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/assistenteAgentes.ts > agentesDoChat, executavelDaIa, localizarClienteDeIa, lerPreferencias, regrasDosAgentes
- **Entrada:** Projeto
- **Saída:** Agentes e provedores (encontrado, autorizado)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:conversas:listar`

- **Tipo:** IPC
- **Finalidade:** Listar os atendimentos de um agente (sem texto, desde a 2.10) e as conversas gravadas até a 2.9, para o Cérebro e o Painel de atividades.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/conversasListar.ts > conversasDoAgente, listarAtendimentos
- **Entrada:** Projeto e agente
- **Saída:** Até 40 itens (data, modo, fontes; pergunta e resposta só nos registros antigos)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:conversas:apagar`

- **Tipo:** IPC
- **Finalidade:** Apagar as conversas gravadas deste projeto neste computador.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/conversasApagar.ts > apagarConversas
- **Entrada:** Projeto
- **Saída:** apagado
- **Permissões:** Confirmação nativa da pessoa
- **Efeito:** Remove conversas/<projeto>.jsonl após confirmação nativa.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:assistente:abertura`

- **Tipo:** IPC
- **Finalidade:** Abrir a conversa: cumprimentar pelo nome, resumir a situação do projeto e, se ainda não souber, perguntar como chamar a pessoa e o papel dela.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/inicio/api/assistenteAbertura.ts > saudacao, lerPreferencias
- **Entrada:** Projeto
- **Saída:** Linhas, pendência (nome/papel), próximos passos e nome da pessoa
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:assistente:avaliar`

- **Tipo:** IPC
- **Finalidade:** Avaliar um atendimento (útil ou não). Ao indicar o agente certo, ensina a ele só os termos da pergunta.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/assistenteAvaliar.ts > aprenderTermos, avaliarAtendimento
- **Entrada:** Id do atendimento, avaliação, agente certo e pergunta (opcionais)
- **Saída:** avaliado e termos aprendidos
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava a avaliação e o vocabulário em conhecimento.db; a pergunta não é gravada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:estado`

- **Tipo:** IPC
- **Finalidade:** Resumo do banco de conhecimento: arquivo, tabelas, vistas por agente, contagens e perfil.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoEstado.ts > estadoConhecimento
- **Entrada:** Projeto
- **Saída:** Arquivo, tamanho, tabelas, vistas, contagens por agente e perfil
- **Permissões:** Nenhuma
- **Efeito:** Consulta local (cria o banco e o conhecimento inicial se ainda não existirem).
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:listar`

- **Tipo:** IPC
- **Finalidade:** Listar conhecimentos gerais e do projeto, por agente e estado.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoListar.ts > listarConhecimentos
- **Entrada:** Projeto, agente, estados, busca
- **Saída:** Conhecimentos (até 200)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:criar`

- **Tipo:** IPC
- **Finalidade:** Ensinar um conhecimento a um agente (ou a todos), geral ou do projeto.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoCriar.ts > registrarConhecimento
- **Entrada:** Projeto ou geral, agente, tipo, título e texto
- **Saída:** Conhecimento APROVADO (ou o igual já existente)
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava em conhecimento.db com segredos mascarados e sem duplicar.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:decidir`

- **Tipo:** IPC
- **Finalidade:** Aprovar ou descartar um conhecimento (rascunho vindo do chat ou de IA, ou um item existente).
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoDecidir.ts > decidirConhecimento
- **Entrada:** Identificador e estado
- **Saída:** Conhecimento atualizado
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava o estado e a data da decisão.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:apagar`

- **Tipo:** IPC
- **Finalidade:** Apagar de vez um conhecimento ensinado (o inicial do Prumo só pode ser descartado).
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoApagar.ts > apagarConhecimento
- **Entrada:** Identificador do conhecimento
- **Saída:** Confirmação de exclusão
- **Permissões:** Confirmação nativa da pessoa
- **Efeito:** Remove a linha de conhecimento.db após confirmação nativa.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:vocabulario`

- **Tipo:** IPC
- **Finalidade:** Listar os termos que um agente aprendeu com as correções da pessoa.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoVocabulario.ts > vocabularioDoAgente
- **Entrada:** Agente
- **Saída:** Termos, peso e data
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:esquecer`

- **Tipo:** IPC
- **Finalidade:** Fazer um agente esquecer um termo aprendido.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoEsquecer.ts > esquecerTermo
- **Entrada:** Agente e termo
- **Saída:** apagado
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Remove o termo do vocabulário.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:conhecimento:mostrar`

- **Tipo:** IPC
- **Finalidade:** Mostrar o arquivo conhecimento.db no Explorer (para abrir no Beekeeper Studio ou outro gerenciador SQLite).
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/conhecimentoMostrar.ts > caminhoConhecimento, lerPerfil
- **Entrada:** Nenhuma
- **Saída:** Caminho do arquivo
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Abre o Explorer com o arquivo selecionado; nada é enviado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:administracao:mapa`

- **Tipo:** IPC
- **Finalidade:** Mostrar a documentação viva desta versão: para cada tela, os arquivos da interface, os canais da janela, o backend (api, regras, banco, integrações, tipos) e os testes.
- **Origem:** Interface > Administração
- **Destino:** backend/administracao/api/administracaoMapa.ts > lerMapaDoAplicativo
- **Entrada:** Nenhuma
- **Saída:** Mapa por tela com caminhos, descrições, funções e ligações (sem código-fonte)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local de um arquivo do próprio aplicativo, gerado no build; não lê projetos vinculados nem dados da pessoa.
- **Arquivos consultados:** dist/documentacao/mapa.json (gerado no build)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, ARCHITECTURE_MAP_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Nenhum

### `prumo:administracao:codigo`

- **Tipo:** IPC
- **Finalidade:** Mostrar o código de um arquivo do aplicativo na Documentação viva, ao lado da explicação do que ele faz.
- **Origem:** Interface > Administração (Documentação viva)
- **Destino:** backend/administracao/api/administracaoCodigo.ts > lerCodigoDoAplicativo
- **Entrada:** Caminho do arquivo (frontend/, backend/ ou testes/) que consta do mapa desta versão
- **Saída:** Texto do arquivo, linhas, bytes e se foi encurtado (até 200 KB)
- **Permissões:** Nenhuma
- **Efeito:** Consulta local: lê dist/documentacao/codigo.json, gerado no build; nada do projeto da pessoa é lido.
- **Arquivos consultados:** dist/documentacao/codigo.json (do próprio aplicativo)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agentes:orquestracoes`

- **Tipo:** IPC
- **Finalidade:** Listar as orquestrações recentes do projeto: agentes participantes, ordem de delegação, etapas com início, fim, duração, fontes consultadas, falhas e resultado.
- **Origem:** Interface > Agentes > Painel de atividades
- **Destino:** backend/agentes/api/agentesOrquestracoes.ts > listarOrquestracoes
- **Entrada:** Projeto (ou geral)
- **Saída:** Até 50 orquestrações, da mais recente para a mais antiga, e quantas linhas inválidas foram ignoradas
- **Permissões:** Nenhuma
- **Efeito:** Consulta local de orquestracoes.jsonl; o registro guarda só metadados, sem a pergunta e sem a resposta.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\orquestracoes.jsonl
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, ORCHESTRATION_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Metadados das orquestrações do chat

### `prumo:agentes:rastrear`

- **Tipo:** IPC
- **Finalidade:** Simular o caminho de uma pergunta no chat: palavras reconhecidas, pontuação de cada agente, quem responderia, se haveria orquestração e quais conhecimentos e trechos de Skill o agente em foco usaria.
- **Origem:** Interface > Agentes (Cérebro)
- **Destino:** backend/agentes/api/agentesRastrear.ts > rastrearPergunta
- **Entrada:** Projeto (ou geral), pergunta e agente em foco
- **Saída:** Rastro com palavras, termos, rota pontuada, agente escolhido, orquestração e o que o agente em foco usaria
- **Permissões:** Nenhuma
- **Efeito:** Consulta local: não chama IA e não grava conversa, atendimento nem aprendizado.
- **Arquivos consultados:** conhecimento.db e skills.db na pasta de dados (somente leitura)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:skills:listar`

- **Tipo:** IPC
- **Finalidade:** Listar os trechos das Skills dos agentes (do Prumo, da equipe, importados ou sugeridos por IA), por especialização, estado e busca.
- **Origem:** Interface > Agentes (Skills)
- **Destino:** backend/agentes/api/skillsListar.ts > listarTrechosDeSkill
- **Entrada:** Especialização, estados e busca (opcionais)
- **Saída:** Trechos (até 500) com origem, fonte, licença e estado
- **Permissões:** Nenhuma
- **Efeito:** Consulta local (cria o banco e sincroniza os trechos que acompanham o aplicativo).
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\skills.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SKILL_*, SKILLS_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de Skills local (SQLite), separado do conhecimento

### `prumo:skills:criar`

- **Tipo:** IPC
- **Finalidade:** Acrescentar à Skill de uma especialização um trecho escrito pela equipe.
- **Origem:** Interface > Agentes (Skills)
- **Destino:** backend/agentes/api/skillsCriar.ts > registrarTrechosDeSkill
- **Entrada:** Especialização, título e texto
- **Saída:** Trecho APROVADO (ou o igual já existente)
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava em skills.db com segredos mascarados e sem duplicar; passa a ir para o prompt quando combinar com a pergunta.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\skills.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SKILL_*, SKILLS_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de Skills local (SQLite), separado do conhecimento

### `prumo:skills:decidir`

- **Tipo:** IPC
- **Finalidade:** Aprovar ou descartar um trecho de Skill (rascunho importado ou de IA, ou um trecho existente, inclusive do Prumo).
- **Origem:** Interface > Agentes (Skills)
- **Destino:** backend/agentes/api/skillsDecidir.ts > decidirTrechoDeSkill
- **Entrada:** Identificador e estado
- **Saída:** Trecho atualizado
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava o estado e a data da decisão. Só trechos APROVADOS vão para o prompt.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\skills.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SKILL_*, SKILLS_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de Skills local (SQLite), separado do conhecimento

### `prumo:skills:importar`

- **Tipo:** IPC
- **Finalidade:** Importar uma pasta de Skill aberta (SKILL.md e references/) já presente no computador, como rascunhos de uma especialização.
- **Origem:** Interface > Agentes (Skills)
- **Destino:** backend/agentes/api/skillsImportar.ts > importarPastaDeSkill, validarEspecializacao
- **Entrada:** Especialização e fonte (endereço do repositório, opcional)
- **Saída:** Licença reconhecida, quantidade importada e duplicada (estado RASCUNHO)
- **Permissões:** Ação explícita da pessoa; aprovação de cada trecho antes de ir para o prompt
- **Efeito:** Abre o seletor de pastas do sistema; recusa pasta sem licença aberta reconhecida (MIT, Apache-2.0, BSD, ISC, CC). Nada é baixado nem executado; scripts da pasta são ignorados.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\skills.db; pasta escolhida pela pessoa (somente leitura)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SKILL_*, SKILLS_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de Skills local (SQLite), separado do conhecimento

### `prumo:perfil:obter`

- **Tipo:** IPC
- **Finalidade:** Ler como a pessoa quer ser chamada e o papel dela.
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/perfilObter.ts > lerPerfil
- **Entrada:** Nenhuma
- **Saída:** comoChamar, papel e data
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:perfil:salvar`

- **Tipo:** IPC
- **Finalidade:** Salvar como a pessoa quer ser chamada e o papel dela (QA, dev, PO, analista ou outro).
- **Origem:** Interface > Início, chat flutuante, Agentes (Cérebro) ou Ajustes
- **Destino:** backend/agentes/api/perfilSalvar.ts > salvarPerfil
- **Entrada:** comoChamar e/ou papel (null limpa)
- **Saída:** Perfil
- **Permissões:** Ação explícita da pessoa
- **Efeito:** Grava a única linha da tabela perfil.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\conhecimento.db
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, KNOWLEDGE_*, PROFILE_*
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Banco de conhecimento local (SQLite)

### `prumo:ia:delegacao`

- **Tipo:** IPC
- **Finalidade:** Autorizar ou revogar a delegação do chat ao Claude Code ou Codex.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/iaDelegacao.ts > autorizarDelegacaoDeIa, lerPreferencias, regrasDosAgentes
- **Entrada:** Provedor e valor
- **Saída:** Preferências atualizadas
- **Permissões:** Confirmação nativa para autorizar
- **Efeito:** Grava preferencias.json. Autorizar exige confirmação nativa; revogar não.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agentes:estado`

- **Tipo:** IPC
- **Finalidade:** Especializações, políticas e propostas de IA do projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/agentesEstado.ts > configuracaoDoEspaco, matrizDePoliticas, especializacoes, listarPropostas
- **Entrada:** Projeto
- **Saída:** Configuração, matriz de capacidades com motivo, contagem de propostas de IA
- **Permissões:** Nenhuma
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agentes:salvar`

- **Tipo:** IPC
- **Finalidade:** Habilitar especializações e bloquear capacidades da IA conectada neste projeto.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/agentes/api/agentesSalvar.ts > salvarConfiguracao, textoNoIdioma, confirmarNoWindows, usuarioDoWindows, idiomaAtual
- **Entrada:** Projeto, especializações e políticas
- **Saída:** Configuração salva
- **Permissões:** Confirmação nativa
- **Efeito:** Grava agentes.json. O bloqueio vale no servidor MCP a cada chamada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:agenda:listar`

- **Tipo:** IPC
- **Finalidade:** Listar as rotinas agendadas com próxima e última execução, permissões e autorizações.
- **Origem:** Interface > Agendamentos / Execuções, ou menu da bandeja
- **Destino:** backend/agendamentos/api/agendaListar.ts > listarAgenda
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
- **Destino:** backend/agendamentos/api/agendaSalvar.ts > criarRotina, editarRotina, validarRotina
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
- **Destino:** backend/agendamentos/api/agendaEstado.ts > desativarRotina, pausarRotina, retomarRotina
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
- **Destino:** backend/agendamentos/api/agendaExcluir.ts > obterRotina, excluirRotina, textoNoIdioma, confirmarNoWindows, idiomaAtual
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
- **Destino:** backend/agendamentos/api/agendaExecutar.ts > workerDoAplicativo
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
- **Destino:** backend/agendamentos/api/agendaAutorizar.ts > autorizarRotina, obterRotina, permissoesDaRotina, textoNoIdioma, confirmarNoWindows, idiomaAtual, solicitarAprovacao
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
- **Destino:** backend/agendamentos/api/agendaRevogar.ts > revogarExecucao
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
- **Destino:** backend/agendamentos/api/agendaPermissoes.ts > listarPermissoes
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
- **Destino:** backend/agendamentos/api/agendaPolitica.ts > criarPoliticaPublicacao, textoNoIdioma, confirmarNoWindows, usuarioDoWindows, idiomaAtual, obterEspaco
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
- **Destino:** backend/agendamentos/api/agendaRevogarPolitica.ts > revogarPublicacao
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
- **Destino:** backend/testes/api/execucoesListar.ts > listarExecucoes
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
- **Destino:** backend/metricas/api/execucoesMetricas.ts > metricasDasExecucoes
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
- **Destino:** backend/testes/api/jiraPrevia.ts > prepararPublicacao
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
- **Finalidade:** Publicar o comentário de resultado em um ticket do projeto vinculado (escrita remota, sempre com prévia e confirmação ou política).
- **Origem:** Interface > Execuções > Publicar no Jira
- **Destino:** backend/testes/api/jiraPublicar.ts > textoNoIdioma, confirmarNoWindows, servicosDoAplicativo, idiomaAtual, publicarComentarioDeResultado, prepararPublicacao
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
- **Destino:** backend/agendamentos/api/workerEstado.ts > workerDoAplicativo, estadoDoAplicativo
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
- **Destino:** backend/agendamentos/api/workerPausa.ts > definirPausaGlobal, workerDoAplicativo, atualizarBandeja
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
- **Destino:** backend/agendamentos/api/workerEventos.ts > avisosDaJanela, estadoDoAplicativo
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
- **Destino:** backend/aplicativo/api/appInfo.ts > versao, diretorioDados
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
- **Destino:** backend/projetos/api/projetosListar.ts > listarPastasVinculadas
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
- **Destino:** backend/projetos/api/projetosEscolher.ts > confirmarNoWindows, adicionarVinculo, gravarContratoProposto, proporContrato, resumirContratoProposto, situacaoProjeto
- **Entrada:** Nenhuma: a pasta vem do diálogo nativo, nunca da página
- **Saída:** canceled, linked, situation
- **Permissões:** Escolha explícita da pessoa no diálogo
- **Efeito:** Grava vinculos.json somente se o contrato for válido. Sem qa.project.json, propõe o contrato detectado e só cria esse arquivo após confirmação nativa (2.10.2); nenhuma outra escrita na pasta do projeto.
- **Arquivos consultados:** qa.project.json do projeto escolhido (criado só com aprovação); vinculos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; A página não informa caminhos
- **Registro:** Diagnóstico IPC

### `prumo:projetos:demo`

- **Tipo:** IPC
- **Finalidade:** Copiar o projeto de demonstração para uma pasta gravável e vinculá-lo.
- **Origem:** Interface > Projetos > Adicionar projeto de demonstração
- **Destino:** backend/projetos/api/projetosDemo.ts > raizDoAplicativo, adicionarVinculo, copiarDemonstracao
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
- **Destino:** backend/projetos/api/projetosDesvincular.ts > desvincularPasta
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
- **Destino:** backend/projetos/api/projetoVisao.ts > visaoGeralDoProjeto
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
- **Destino:** backend/logs/api/projetoLogs.ts > listarLogsDoProjeto
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
- **Destino:** backend/logs/api/projetoHistorico.ts > listarHistoricoDoProjeto
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
- **Destino:** backend/testes/api/projetoEvidencias.ts > listarEvidenciasDoProjeto
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
- **Destino:** backend/conexoes/api/projetoConexoes.ts > situacaoDasConexoesDeIa
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
- **Destino:** backend/conexoes/api/conexaoAplicar.ts > aplicarConexao, prepararConexao, projetoVinculado
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
- **Destino:** backend/conexoes/api/conexaoTestar.ts > testarIntegracao
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
- **Destino:** backend/logs/api/logsExportar.ts > exportarLogs
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
- **Destino:** backend/ajuda/api/ajudaDocumentos.ts > lerDocumentosDaAjuda, versao, raizDoAplicativo
- **Entrada:** Nenhuma
- **Saída:** Documentos em texto
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** docs/ajuda/*.md (empacotados)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Lista fixa de arquivos
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:ajuda:versoes`

- **Tipo:** IPC
- **Finalidade:** Histórico de versões e versão instalada.
- **Origem:** Interface > Ajuda > Versões
- **Destino:** backend/ajuda/api/ajudaVersoes.ts > apresentarVersoes, carregarVersoes, conferirInstalada, arquivoVersoes, versao
- **Entrada:** Nenhuma
- **Saída:** Versões com funcionalidades, correções, segurança e limitações
- **Permissões:** Nenhuma
- **Efeito:** Consulta local; não altera o projeto.
- **Arquivos consultados:** docs/catalogo/versoes.json (empacotado)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Fonte validada por esquema
- **Registro:** Diagnóstico IPC (somente erros)

### `prumo:ajuda:integracoes`

- **Tipo:** IPC
- **Finalidade:** Catálogo técnico das operações IPC e das ferramentas MCP.
- **Origem:** Interface > Ajuda > Integrações técnicas
- **Destino:** backend/ajuda/api/ajudaIntegracoes.ts > catalogo
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
- **Destino:** backend/atualizacoes/api/atualizacaoVerificar.ts > consultarAtualizacao
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
- **Destino:** backend/atualizacoes/api/atualizacaoAbrir.ts > repositorio, estadoDoAplicativo
- **Entrada:** Nenhuma: a URL é a validada pelo processo principal
- **Saída:** opened
- **Permissões:** Confirmação nativa
- **Efeito:** Abre o navegador padrão na página da release; não baixa nem executa instalador.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, NO_VERIFIED_RELEASE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; URL reconstruída a partir de tag validada; Somente github.com/AnaPLysyk/Prumo-Qa
- **Registro:** Diagnóstico IPC

### `prumo:atualizacao:instalar`

- **Tipo:** IPC
- **Finalidade:** Atualizar com um clique para a versão encontrada pela consulta (2.10.2).
- **Origem:** Interface > Ajuda > Atualizações > Atualizar agora
- **Destino:** backend/atualizacoes/api/atualizacaoInstalar.ts > workerDoAplicativo, estadoDoAplicativo, baixarAtualizacao, entregarInstalador, instrucaoDeInstalacao, plataformaDoInstalador, argumentosInstalador
- **Entrada:** Nenhuma: versão e URLs vêm da consulta validada no processo principal
- **Saída:** canceled, verificado, instalando, versao, sha256
- **Permissões:** Confirmação nativa; recusa com execução em andamento
- **Efeito:** Baixa o instalador oficial e o .sha256 da release no GitHub, confere o resumo, executa o instalador (/S --updated --force-run) e fecha o Prumo, que reabre na versão nova. Fora do pacote nunca executa instalador.
- **Arquivos consultados:** Instalador temporário na pasta TEMP do usuário (prumo-atualizacao-*)
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, NO_VERIFIED_RELEASE, UPDATE_BUSY, UPDATE_DOWNLOAD_FAILED, UPDATE_HASH_MISSING, UPDATE_HASH_MISMATCH, UPDATE_DESTINATION_FORBIDDEN, UPDATE_DEV_MODE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; URL montada da versão validada; Redirecionamentos só para hosts de download do GitHub, HTTPS; SHA-256 publicado na release conferido antes de executar; Gravação exclusiva e limite de tamanho
- **Registro:** Diagnóstico IPC

### `prumo:site:abrir`

- **Tipo:** IPC
- **Finalidade:** Abrir o site institucional oficial no navegador, depois de confirmar.
- **Origem:** Interface > Tickets, Testes, Runs, Vínculos, Agentes ou Conexões
- **Destino:** backend/ajuda/api/siteAbrir.ts
- **Entrada:** Nenhuma: a URL é fixa
- **Saída:** Se abriu ou não
- **Permissões:** Confirmação nativa
- **Efeito:** Abre o navegador padrão; nada é enviado pelo aplicativo.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\operacoes-externas.json, propostas.json, runs-qase.json, permissoes-servicos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, CREDENTIAL_UNAVAILABLE, CREDENTIAL_INVALID_OR_EXPIRED, SERVICE_PERMISSION, SERVICE_NOT_FOUND, SERVICE_RATE_LIMIT, SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_RESPONSE_INVALID, SERVICE_REDIRECT_BLOCKED, SERVICE_RESPONSE_LIMIT, SERVICE_DESTINATION_BLOCKED, SERVICE_WRITE_BLOCKED, SERVICE_SCOPE_CHANGED, SERVICE_DUPLICATE, SERVICE_PLAN_LIMIT, WRITE_NOT_ENABLED, HUMAN_CONFIRMATION_REQUIRED, WRITE_POLICY_MISSING, OPERATION_UNKNOWN, OPERATION_RETRY_LIMIT, WORKSPACE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Isolamento por projeto Prumo, conexão e instância; Rotas de escrita em lista fechada (conexoes/escrita/rotaEscritaPermitida.ts); Escrita desligada por padrão por projeto e serviço; Confirmação nativa que a página não consegue simular; Idempotência e reconciliação; sem token nos logs
- **Registro:** Livro-razão local de operações externas e histórico do projeto

### `prumo:dados:resumo`

- **Tipo:** IPC
- **Finalidade:** Mostrar onde ficam os dados locais e quanto espaço ocupam.
- **Origem:** Interface > Ajuda > Privacidade e dados
- **Destino:** backend/ajuda/api/dadosResumo.ts > resumirDados
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
- **Destino:** backend/ajuda/api/dadosExcluir.ts > textoExclusao, excluirTodosContextos, excluirEvidencias, excluirAtividades, excluirDiagnostico, projetoVinculado
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
- **Destino:** backend/logs/api/diagnosticoListar.ts > lerDiagnostico
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
- **Destino:** backend/agentes/api/contextosListar.ts > listarContextosDaPasta
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
- **Destino:** backend/agentes/api/contextosObter.ts > obterContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosSalvar.ts > usuarioDoWindows, salvarContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosAprovar.ts > confirmarNoWindows, usuarioDoWindows, aprovarContextoDaPasta, obterContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosDesatualizar.ts > confirmarNoWindows, usuarioDoWindows, desatualizarContextoDaPasta, obterContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosConflito.ts > usuarioDoWindows, conflitoDeContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosExcluir.ts > confirmarNoWindows, excluirContextoDaPasta, obterContextoDaPasta
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
- **Destino:** backend/agentes/api/contextosMcp.ts > confirmarNoWindows, permitirContextosNoMcp
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
- **Destino:** backend/configuracoes/api/preferenciasObter.ts > versao, avisoDeVersaoPendente, lerPreferencias
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
- **Destino:** backend/configuracoes/api/preferenciasSalvar.ts > alterarPreferencias, iniciarComOSistema
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
- **Destino:** backend/atualizacoes/api/preferenciasVisualizada.ts > versao, avisoDeVersaoPendente, marcarVersaoVista
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
- **Destino:** backend/suporte/api/suportePreparar.ts > prepararRelatoDaJanela
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
- **Destino:** backend/suporte/api/suporteAbrir.ts > repositorio, enderecoOficialDoRelato, prepararRelatoDaJanela
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
- **Destino:** backend/suporte/api/suporteExportar.ts > prepararRelatoDaJanela
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
- **Destino:** backend/suporte/api/suporteConsultar.ts > consultarChamado
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
- **Destino:** backend/suporte/api/suporteChamado.ts > repositorio
- **Entrada:** Número inteiro de issue
- **Saída:** opened
- **Permissões:** Confirmação nativa
- **Efeito:** Abre somente o chamado no navegador; não publica comentário.
- **Arquivos consultados:** Nenhum
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; URL reconstruída de número validado; Confirmação nativa
- **Registro:** Diagnóstico IPC

### `prumo:conta:sessao`

- **Tipo:** IPC
- **Finalidade:** Saber se o login está ligado, quem está na sessão e o nível de cada tela para o papel dessa pessoa.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaSessao.ts > sessaoParaJanela
- **Entrada:** Nenhuma
- **Saída:** loginAtivo, conta visível (sem resumos), telas e regras de cadastro
- **Permissões:** Nenhuma (atende antes do login)
- **Efeito:** Consulta local; não renova a sessão.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:entrar`

- **Tipo:** IPC
- **Finalidade:** Entrar com login e senha.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaEntrar.ts > entrarNaConta
- **Entrada:** Login e senha
- **Saída:** Sessão (conta e telas)
- **Permissões:** Nenhuma (atende antes do login)
- **Efeito:** Abre a sessão na memória; conta tentativas erradas e bloqueia a conta no limite configurado.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, LOGIN_INVALID, ACCOUNT_LOCKED, ACCOUNT_PENDING, ACCOUNT_DISABLED, LOGIN_RATE_LIMIT
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:sair`

- **Tipo:** IPC
- **Finalidade:** Encerrar a sessão.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaSair.ts > sairDaConta
- **Entrada:** Nenhuma
- **Saída:** Sessão vazia
- **Permissões:** Sessão aberta
- **Efeito:** Esquece a sessão da memória.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:cadastrar`

- **Tipo:** IPC
- **Finalidade:** Criar a própria conta pela tela de entrada.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaCadastrar.ts > cadastrarConta
- **Entrada:** Login, nome e senha
- **Saída:** Estado (PENDENTE ou ATIVO) e código de recuperação mostrado uma vez
- **Permissões:** Login ligado e cadastro aberto na Administração
- **Efeito:** Grava a conta com o papel de cadastro; com aprovação ligada, ela só entra depois que a Administração aprovar.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, SIGNUP_CLOSED, LOGIN_TAKEN, PASSWORD_WEAK, LOGIN_INVALID_FORMAT
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:recuperar`

- **Tipo:** IPC
- **Finalidade:** Definir senha nova com o código de recuperação.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaRecuperar.ts > recuperarConta
- **Entrada:** Login, código de recuperação e senha nova
- **Saída:** Código de recuperação novo (o anterior deixa de valer)
- **Permissões:** Código de recuperação da própria conta
- **Efeito:** Troca a senha e o código; tentativas erradas contam para o bloqueio.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, RECOVERY_INVALID, ACCOUNT_LOCKED, PASSWORD_WEAK
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:githubiniciar`

- **Tipo:** IPC
- **Finalidade:** Entrar ou se cadastrar pelo GitHub: abre o navegador na autorização e a pessoa volta já com o acesso. Com ativar, e sem nenhuma conta, a primeira conta (administradora) nasce da autorização.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaGithubiniciar.ts > dependenciasDoGithub, iniciarEntradaGithub
- **Entrada:** Opcional: ativar
- **Saída:** iniciado
- **Permissões:** Nenhuma (atende antes do login); exige login ligado e o OAuth App configurado
- **Efeito:** Abre um endereço local temporário, só neste computador e por 5 minutos, que só aceita a volta do GitHub com o state e o PKCE desta tentativa; conta existente entra e ganha a conexão do GitHub, conta nova fica PENDENTE.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, GITHUB_LOGIN_NOT_CONFIGURED, GITHUB_LOGIN_FAILED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:githubestado`

- **Tipo:** IPC
- **Finalidade:** Ver como está a entrada pelo GitHub (aguardando, concluída, pendente de aprovação ou com erro) ou desistir dela.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaGithubestado.ts > estadoDaEntradaGithub
- **Entrada:** Opcional: cancelar
- **Saída:** estado, mensagem e, quando concluída, a sessão
- **Permissões:** Nenhuma (atende antes do login)
- **Efeito:** Consulta a tentativa em andamento; cancelar fecha o endereço local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:googleiniciar`

- **Tipo:** IPC
- **Finalidade:** Entrar ou se cadastrar pelo Google: abre o navegador na autorização e a pessoa volta já com o acesso. Com ativar, e sem nenhuma conta, a primeira conta (administradora) nasce da autorização.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaGoogleiniciar.ts > dependenciasDoGoogle, iniciarEntrada
- **Entrada:** Opcional: ativar
- **Saída:** iniciado
- **Permissões:** Nenhuma (atende antes do login); exige login ligado e o aplicativo do Google configurado
- **Efeito:** Abre um endereço local temporário, só neste computador e por 5 minutos, que só aceita a volta do Google com o state e o PKCE desta tentativa; conta existente entra, conta nova fica PENDENTE. O Google serve só para entrar: nenhuma conexão é criada.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, GOOGLE_LOGIN_NOT_CONFIGURED, GOOGLE_LOGIN_FAILED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:googleestado`

- **Tipo:** IPC
- **Finalidade:** Ver como está a entrada pelo Google (aguardando, concluída, pendente de aprovação ou com erro) ou desistir dela.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaGoogleestado.ts > estadoDaEntrada
- **Entrada:** Opcional: cancelar
- **Saída:** estado, mensagem e, quando concluída, a sessão
- **Permissões:** Nenhuma (atende antes do login)
- **Efeito:** Consulta a tentativa em andamento; cancelar fecha o endereço local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:senha`

- **Tipo:** IPC
- **Finalidade:** Trocar a própria senha, inclusive a temporária dada pela Administração.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaSenha.ts > trocarMinhaSenha
- **Entrada:** Senha atual e senha nova
- **Saída:** Sessão e, quando a senha era temporária, código de recuperação novo
- **Permissões:** Sessão aberta e senha atual
- **Efeito:** Grava o resumo da senha nova.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, PASSWORD_INVALID, PASSWORD_WEAK
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:conta:perfil`

- **Tipo:** IPC
- **Finalidade:** Trocar o próprio nome de exibição.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/login/api/contaPerfil.ts > alterarMeuNome
- **Entrada:** Nome
- **Saída:** Sessão atualizada
- **Permissões:** Sessão aberta
- **Efeito:** Grava o nome na conta.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:ativar`

- **Tipo:** IPC
- **Finalidade:** Ligar o login criando a primeira conta, de administrador.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosAtivar.ts > ativarLogin
- **Entrada:** Login, nome e senha
- **Saída:** Conta criada e código de recuperação mostrado uma vez
- **Permissões:** Só enquanto não existe nenhuma conta
- **Efeito:** Cria acessos.json; a partir daí a janela exige login e confere as permissões em cada canal.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, LOGIN_ALREADY_ACTIVE, PASSWORD_WEAK
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:listar`

- **Tipo:** IPC
- **Finalidade:** Listar as contas com papel, estado, bloqueio e último acesso.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosListar.ts > listarContasDeAcesso
- **Entrada:** Nenhuma
- **Saída:** Contas visíveis (sem resumos) e qual é a sua
- **Permissões:** Administração: VER
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:criar`

- **Tipo:** IPC
- **Finalidade:** Criar conta para outra pessoa.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosCriar.ts > criarContaPelaAdministracao
- **Entrada:** Login, nome e papel
- **Saída:** Conta e senha temporária mostrada uma vez
- **Permissões:** Administração: USAR
- **Efeito:** Grava a conta; a pessoa troca a senha no primeiro acesso.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, LOGIN_TAKEN, ROLE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:alterar`

- **Tipo:** IPC
- **Finalidade:** Aprovar cadastro, trocar papel ou nome, desativar ou reativar uma conta.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosAlterar.ts > alterarContaPelaAdministracao
- **Entrada:** Id e campos alterados
- **Saída:** Conta atualizada
- **Permissões:** Administração: USAR
- **Efeito:** Grava a conta; vale no próximo pedido daquela pessoa.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, LAST_ADMIN, SELF_DISABLE, SELF_DEMOTE, ROLE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:senha`

- **Tipo:** IPC
- **Finalidade:** Redefinir a senha de outra pessoa.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosSenha.ts > redefinirSenhaPelaAdministracao
- **Entrada:** Id da conta
- **Saída:** Senha temporária mostrada uma vez
- **Permissões:** Administração: USAR
- **Efeito:** Troca a senha, exige troca no próximo acesso e desbloqueia a conta.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, USE_MY_ACCOUNT, ACCOUNT_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:desbloquear`

- **Tipo:** IPC
- **Finalidade:** Desbloquear uma conta travada por tentativas erradas.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosDesbloquear.ts > desbloquearConta
- **Entrada:** Id da conta
- **Saída:** Conta atualizada
- **Permissões:** Administração: USAR
- **Efeito:** Zera as tentativas erradas.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:usuarios:excluir`

- **Tipo:** IPC
- **Finalidade:** Excluir uma conta pendente ou desativada.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/usuariosExcluir.ts > excluirConta
- **Entrada:** Id da conta
- **Saída:** Id excluído
- **Permissões:** Administração: USAR
- **Efeito:** Remove a conta de acessos.json.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, ACCOUNT_ACTIVE, SELF_DELETE, LAST_ADMIN
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:papeis:listar`

- **Tipo:** IPC
- **Finalidade:** Listar os papéis e a matriz de permissões por tela.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/papeisListar.ts > listarPapeis
- **Entrada:** Nenhuma
- **Saída:** Papéis, telas, níveis e contas por papel
- **Permissões:** Administração: VER
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:papeis:salvar`

- **Tipo:** IPC
- **Finalidade:** Criar ou alterar um papel e o nível de cada tela (NENHUM, VER, USAR).
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/papeisSalvar.ts > salvarPapel
- **Entrada:** Id opcional, nome, descrição e telas
- **Saída:** Papéis atualizados
- **Permissões:** Administração: USAR
- **Efeito:** Grava o papel; o Administrador é fixo.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, ROLE_FIXED, ROLE_NAME_TAKEN, ROLE_NAME_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:papeis:excluir`

- **Tipo:** IPC
- **Finalidade:** Excluir um papel que ninguém usa.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/papeisExcluir.ts > excluirPapel
- **Entrada:** Id do papel
- **Saída:** Papéis atualizados
- **Permissões:** Administração: USAR
- **Efeito:** Remove o papel.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, ROLE_IN_USE, ROLE_FIXED
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:acesso:configuracao`

- **Tipo:** IPC
- **Finalidade:** Ler as configurações gerais de acesso.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/acessoConfiguracao.ts > configuracaoDeAcesso
- **Entrada:** Nenhuma
- **Saída:** Cadastro, aprovação, papel de cadastro, inatividade e bloqueio
- **Permissões:** Administração: VER
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:acesso:salvar`

- **Tipo:** IPC
- **Finalidade:** Salvar as configurações gerais de acesso.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/acessoSalvar.ts > salvarConfiguracaoDeAcesso
- **Entrada:** Cadastro aberto, aprovação, papel de cadastro, minutos de inatividade, tentativas e minutos de bloqueio
- **Saída:** Configuração salva
- **Permissões:** Administração: USAR
- **Efeito:** Grava em acessos.json; novos cadastros nunca entram como administrador.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, SIGNUP_ROLE_FORBIDDEN, ROLE_NOT_FOUND
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:acesso:google`

- **Tipo:** IPC
- **Finalidade:** Guardar o Client ID e o Client Secret do aplicativo do Google usado no login.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/acessoGoogle.ts > salvarEntradaDoProvedor
- **Entrada:** Client ID e Client Secret (vazio no Client ID remove)
- **Saída:** configurado e Client ID
- **Permissões:** Administração: USAR
- **Efeito:** O Client ID vai para acessos.json; o segredo só para o cofre do sistema e nunca volta para a janela.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, GOOGLE_CLIENT_INVALID, GOOGLE_SECRET_REQUIRED, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:acesso:github`

- **Tipo:** IPC
- **Finalidade:** Guardar o Client ID e o Client Secret do OAuth App do GitHub usado no login.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/acessoGithub.ts > salvarEntradaDoProvedor
- **Entrada:** Client ID e Client Secret (vazio no Client ID remove)
- **Saída:** configurado e Client ID
- **Permissões:** Administração: USAR
- **Efeito:** O Client ID vai para acessos.json; o segredo só para o cofre do sistema e nunca volta para a janela.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\acessos.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, GITHUB_CLIENT_INVALID, GITHUB_SECRET_REQUIRED, CREDENTIAL_PROTECTION_UNAVAILABLE
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:plataforma:agentes`

- **Tipo:** IPC
- **Finalidade:** Ler a configuração geral dos agentes da plataforma.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/plataformaAgentes.ts > agentesDaPlataformaParaJanela
- **Entrada:** Nenhuma
- **Saída:** Agentes com estado ligado, IA externa e orquestração
- **Permissões:** Administração: VER
- **Efeito:** Consulta local.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agentes-plataforma.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `prumo:plataforma:salvar`

- **Tipo:** IPC
- **Finalidade:** Ligar ou desligar agentes, o uso de Claude Code/Codex e a orquestração em todos os projetos.
- **Origem:** Interface > Entrada do Prumo, Minha conta ou Administração
- **Destino:** backend/administracao/api/plataformaSalvar.ts > salvarAgentesDaPlataforma
- **Entrada:** Agentes desligados, iaExterna e orquestracao
- **Saída:** Configuração salva
- **Permissões:** Administração: USAR
- **Efeito:** Grava agentes-plataforma.json; vale para o chat e para o servidor MCP.
- **Arquivos consultados:** %LOCALAPPDATA%\PrumoQA\plataforma\agentes-plataforma.json
- **Erros possíveis:** INVALID_ARGUMENTS, IPC_SENDER_REJECTED, SESSION_REQUIRED, SESSION_EXPIRED, PERMISSION_DENIED, LOGIN_NOT_ACTIVE, LOGIN_SETUP_REQUIRED, LOCAL_DATA_INVALID, AGENT_UNKNOWN
- **Proteções:** Remetente deve ser a página do aplicativo; Argumentos validados por esquema estrito; Resposta {ok,data|error} sem stack trace; Erros mascarados; Senha e código de recuperação só como resumo scrypt com sal próprio; Sessão só na memória do processo principal, com expiração por inatividade; Permissão por tela conferida no backend a cada canal (login/tipos/acessoDosCanais.ts)
- **Registro:** Diagnóstico da interface (só canal, estado e duração; nunca login nem senha)

### `contexto_projeto`

- **Tipo:** MCP
- **Finalidade:** Identificar tipo, tecnologias, testes, comandos e o que falta no contexto autorizado.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** backend/agentes/mcp/criarServidor.ts > contextoCompleto
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > revisarCobertura
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > executarValidacao > solicitarAprovacao
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > consultarEvidencias
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > matrizDePoliticas
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > criarProposta
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
- **Destino:** backend/agentes/mcp/criarServidor.ts > criarProposta
- **Entrada:** Resumo, descrição, ticket de origem e rótulos
- **Saída:** Id, estado RASCUNHO, semelhantes e aviso
- **Permissões:** Capacidade propor_bugs permitida pela política do projeto
- **Efeito:** Grava propostas.json. Não cria ticket no Jira.
- **Arquivos consultados:** plataforma/propostas.json
- **Erros possíveis:** POLICY_BLOCKED, NO_WORKSPACE, DUPLICATE_PROPOSAL, PROPOSAL_RATE_LIMIT
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Só rascunho; a pessoa abre o bug
- **Registro:** Histórico de atividades (origem MCP)

### `propor_aprendizado`

- **Tipo:** MCP
- **Finalidade:** Sugerir conhecimento para os agentes deste projeto como rascunho local.
- **Origem:** Agente de IA por MCP (stdio)
- **Destino:** backend/agentes/mcp/criarServidor.ts > registrarConhecimento
- **Entrada:** Tipo (fato, glossario, preferencia, procedimento ou risco), título de 2 a 120 caracteres, texto de 2 a 2000 caracteres e agente opcional
- **Saída:** Identificador, estado, duplicado e aviso de aprovação pendente
- **Permissões:** Projeto Prumo vinculado à raiz do servidor MCP
- **Efeito:** Grava RASCUNHO em conhecimento.db; não aprova nem publica.
- **Arquivos consultados:** conhecimento.db
- **Erros possíveis:** NO_WORKSPACE, KNOWLEDGE_AGENT_UNKNOWN, KNOWLEDGE_RATE_LIMIT, KNOWLEDGE_LIMIT
- **Proteções:** Projeto fixado na configuração do servidor, nunca pela ferramenta; Leitura limitada à raiz autorizada; Registro de início e término; Isolamento por projeto; Limite de 20 sugestões de IA por hora; Só a pessoa aprova
- **Registro:** Banco de conhecimento local e histórico de atividades MCP
