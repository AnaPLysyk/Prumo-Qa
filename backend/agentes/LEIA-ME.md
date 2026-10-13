# agentes — backend

Agentes: chat com agentes, banco de conhecimento, políticas da IA e o servidor MCP.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `agentesEstado.ts` | Canal agentes:estado: Especializações, políticas e propostas de IA do projeto. |
| `agentesOrquestracoes.ts` | Canal agentes:orquestracoes: Listar as orquestrações recentes do projeto: agentes, ordem, etapas, tempos, fontes e falhas. |
| `agentesSalvar.ts` | Canal agentes:salvar: Habilitar especializações e bloquear capacidades da IA conectada neste projeto. |
| `assistenteAgentes.ts` | Canal assistente:agentes: Listar os agentes do chat, suas especializações, capacidades e a disponibilidade de Claude Code/Codex. |
| `assistenteAvaliar.ts` | Canal assistente:avaliar: Avaliar um atendimento (útil ou não). Ao indicar o agente certo, ensina a ele só os termos da pergunta. |
| `assistenteConversar.ts` | Canal assistente:conversar: Rotear a pergunta do chat para um agente local e responder com dados deste computador; opcionalmente delegar ao Claude Code/Codex já autorizado. |
| `conhecimentoApagar.ts` | Canal conhecimento:apagar: Apagar de vez um conhecimento ensinado (o inicial do Prumo só pode ser descartado). |
| `conhecimentoCriar.ts` | Canal conhecimento:criar: Ensinar um conhecimento a um agente (ou a todos), geral ou do projeto. |
| `conhecimentoDecidir.ts` | Canal conhecimento:decidir: Aprovar ou descartar um conhecimento (rascunho vindo do chat ou de IA, ou um item existente). |
| `conhecimentoEsquecer.ts` | Canal conhecimento:esquecer: Fazer um agente esquecer um termo aprendido. |
| `conhecimentoEstado.ts` | Canal conhecimento:estado: Resumo do banco de conhecimento: arquivo, tabelas, vistas por agente, contagens e perfil. |
| `conhecimentoListar.ts` | Canal conhecimento:listar: Listar conhecimentos gerais e do projeto, por agente e estado. |
| `conhecimentoMostrar.ts` | Canal conhecimento:mostrar: Mostrar o arquivo conhecimento.db no Explorer (para abrir no Beekeeper Studio ou outro gerenciador SQLite). |
| `conhecimentoVocabulario.ts` | Canal conhecimento:vocabulario: Listar os termos que um agente aprendeu com as correções da pessoa. |
| `conversasApagar.ts` | Canal conversas:apagar: Apagar as conversas gravadas deste projeto neste computador. |
| `conversasListar.ts` | Canal conversas:listar: Listar os atendimentos de um agente (sem texto, desde a 2.10) e as conversas gravadas até a 2.9, para o Cérebro e o Painel de atividades. |
| `iaDelegacao.ts` | Canal ia:delegacao: Autorizar ou revogar a delegação do chat ao Claude Code ou Codex. |
| `perfilObter.ts` | Canal perfil:obter: Ler como a pessoa quer ser chamada e o papel dela. |
| `perfilSalvar.ts` | Canal perfil:salvar: Salvar como a pessoa quer ser chamada e o papel dela (QA, dev, PO, analista ou outro). |
| `skillsCriar.ts` | Canal skills:criar: Acrescentar um trecho escrito pela equipe à Skill de uma especialização. |
| `skillsDecidir.ts` | Canal skills:decidir: Aprovar ou descartar um trecho de Skill (rascunho importado ou de IA, ou um trecho existente). |
| `skillsImportar.ts` | Canal skills:importar: Importar uma pasta de Skill aberta (com SKILL.md e licença) como rascunhos de uma especialização. |
| `skillsListar.ts` | Canal skills:listar: Listar os trechos do banco de Skills por especialização, estado e busca. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `abrirBancoDeConhecimento.ts` | Abre o banco de conhecimento (sem atalhos, um único arquivo). |
| `apagarConhecimento.ts` | Apaga um conhecimento ensinado (o inicial do Prumo só pode ser descartado). |
| `apagarConversas.ts` | Apaga as conversas antigas gravadas de um projeto. |
| `aprenderTermos.ts` | Ensina a um agente os termos de uma pergunta que deveria ter ido para ele. |
| `arquivoDeConversas.ts` | Arquivo de conversas de um projeto (ou geral). |
| `avaliarAtendimento.ts` | Guarda se a resposta foi útil ou não. |
| `caminhoConhecimento.ts` | Caminho do banco de conhecimento conhecimento.db na pasta de dados. |
| `comBancoDeConhecimento.ts` | Abre o banco, faz a operação e fecha sempre. |
| `comBancoDeSkills.ts` | Abre o banco de Skills (skills.db, separado do conhecimento), garante as tabelas e os trechos do Prumo, faz a operação e fecha sempre. |
| `conhecimentosRelevantes.ts` | Busca os conhecimentos aprovados que mais combinam com a pergunta. |
| `conversasDoAgente.ts` | Lista as conversas antigas de um agente, das mais novas para as mais antigas. |
| `criarEsquemaDoConhecimento.ts` | Cria as tabelas e vistas do banco de conhecimento e coloca o conhecimento inicial do Prumo. |
| `decidirConhecimento.ts` | Aprova ou descarta um conhecimento. |
| `decidirTrechoDeSkill.ts` | Aprova ou descarta um trecho de Skill. Aprovar é sempre ato da pessoa; descartar vale também para os trechos do Prumo. |
| `esquecerTermo.ts` | Faz um agente esquecer um termo. |
| `estadoConhecimento.ts` | Resume o banco de conhecimento: arquivo, tamanho, tabelas, vistas e contagens por agente. |
| `falharConhecimento.ts` | Interrompe com um código de erro do conhecimento (ex.: KNOWLEDGE_NOT_FOUND). |
| `importarPastaDeSkill.ts` | Importa uma pasta de Skill aberta (por exemplo um repositório já clonado) como rascunhos de uma especialização, com fonte e licença. Nada é baixado da internet. |
| `impressaoDoConhecimento.ts` | Impressão digital de um conhecimento para não guardar o mesmo duas vezes. |
| `lerConfiguracaoDosAgentes.ts` | Lê as configurações de agentes por projeto (agentes.json). |
| `lerConversas.ts` | Lê as conversas antigas gravadas de um projeto. |
| `lerPastaDeSkill.ts` | Lê uma pasta de Skill (SKILL.md e references/*.md) sem seguir atalhos, sem binários e com limite de tamanho por arquivo. |
| `lerPerfil.ts` | Lê como a pessoa quer ser chamada e o papel dela. |
| `linhaParaConhecimento.ts` | Converte uma linha do banco num conhecimento. |
| `listarAtendimentos.ts` | Lista os atendimentos de um projeto e agente. |
| `listarConhecimentos.ts` | Lista os conhecimentos por projeto, agente, estado e busca. |
| `listarOrquestracoes.ts` | Lista as orquestrações mais recentes de um projeto (ou as gerais), ignorando e contando linhas inválidas. |
| `listarTrechosDeSkill.ts` | Lista os trechos de Skill por especialização, estado e busca; rascunhos primeiro, depois na ordem de leitura. |
| `pastaDasConversas.ts` | Pasta das conversas antigas do chat. |
| `pesosAprendidos.ts` | Soma, por agente, o peso dos termos aprendidos que aparecem na frase. |
| `registrarAtendimento.ts` | Registra um atendimento do chat (agente, modo e fontes), sem a pergunta nem a resposta. |
| `registrarConhecimento.ts` | Registra um conhecimento: da pessoa já aprovado; da IA ou da conversa em rascunho (com limite por hora). |
| `registrarConversa.ts` | Grava uma conversa com segredos mascarados e limite de tamanho. |
| `registrarOrquestracao.ts` | Guarda o registro de uma orquestração (só metadados) em orquestracoes.jsonl na pasta de dados, mantendo os 500 mais recentes. |
| `registrarTrechosDeSkill.ts` | Acrescenta trechos a uma Skill: da equipe já aprovados; importados ou de IA em rascunho. Iguais não duplicam; vários numa única transação (se um falhar, nenhum é gravado). |
| `salvarPerfil.ts` | Salva como a pessoa quer ser chamada e o papel dela. |
| `sementeDasSkills.ts` | Trechos das Skills que acompanham o aplicativo (pasta skills/), já divididos e com identificador estável pelo conteúdo. |
| `validarAgenteDoConhecimento.ts` | Confere se o agente existe. |
| `validarProjetoDoConhecimento.ts` | Confere o id do projeto de um conhecimento. |
| `vistaDoAgente.ts` | Nome da vista do banco que mostra os conhecimentos de um agente (agente_<id>). |
| `vocabularioDoAgente.ts` | Lista os termos que um agente aprendeu. |

## chat/

O chat: escolhe o agente, responde com dados locais e, se autorizado, consulta Claude ou Codex.

| Arquivo | O que faz |
| --- | --- |
| `aberturaDoAgente.ts` | Escolhe a frase de abertura do agente com o nome da pessoa e do assistente. |
| `agentesDoChat.ts` | Lista os agentes do chat com especialização, capacidades e o que estão autorizados a fazer neste projeto. |
| `ambienteDaIa.ts` | Ambiente mínimo passado ao CLI do Claude/Codex. |
| `aplicarEstilo.ts` | Ajusta a resposta ao estilo escolhido (amigável, direto ou técnico). |
| `argumentosDoProvedorDeIa.ts` | Monta os argumentos do CLI do Claude ou do Codex com tudo bloqueado (sem ferramentas, sem edição, só leitura). |
| `classificarFalha.ts` | Classifica o texto de uma falha de teste: automação, ambiente, produto ou inconclusiva, com o motivo. |
| `consultarIaExterna.ts` | Usa Claude ou Codex somente após autorização; retorna ao chat local quando faltar permissão ou a IA falhar. |
| `conversar.ts` | Atende uma pergunta do chat: entende intenções, escolhe o agente, responde localmente e, se autorizado, consulta Claude ou Codex. |
| `escolherAgente.ts` | Escolhe o agente que responde: o escolhido pela pessoa, o da conversa anterior ou o de palavras mais parecidas. |
| `executarCliDeIa.ts` | Executa o CLI do Claude/Codex numa pasta temporária vazia, sem shell, com tempo limite, e apaga a pasta no fim. |
| `executavelDaIa.ts` | Caminho do .exe do Claude ou do Codex, se instalado (atalhos .cmd não são usados). |
| `intencaoDeAprender.ts` | Reconhece pedidos como "lembre que..." e registra um conhecimento. |
| `intencaoDePerfil.ts` | Reconhece quando a pessoa diz como quer ser chamada ou qual é o papel dela, e salva. |
| `intencaoDeSaber.ts` | Reconhece perguntas como "o que você sabe?" e lista os conhecimentos do agente. |
| `juntarConhecimentos.ts` | Junta conhecimentos aprovados à resposta local e registra suas fontes sem duplicar fatos. |
| `montarPrompt.ts` | Monta o texto enviado ao Claude/Codex: persona, agente, pergunta, fatos locais e regras de segurança. |
| `montarResposta.ts` | Monta a resposta de um agente com fontes, ações e segredos mascarados. |
| `numeroDoFato.ts` | Lê um número dos fatos coletados (ex.: falhas=3). |
| `numeroDoTexto.ts` | Gera um número fixo a partir de um texto, para variar a saudação sem sorteio. |
| `orquestrar.ts` | Orquestra uma pergunta entre especialistas: delega uma etapa a cada agente, registra tempo, fontes e falhas e junta as respostas. |
| `palavrasDaPergunta.ts` | Separa as palavras de uma pergunta já sem acentos. |
| `papelNoTexto.ts` | Reconhece no texto o papel da pessoa (QA, dev, PO, analista). |
| `personalidadeParaIa.ts` | Escreve o bloco de personalidade do agente enviado à IA (tom, foco, papel da pessoa). |
| `planejarOrquestracao.ts` | Decide se uma pergunta pede mais de um especialista: duas ou mais especializações com pontuação forte no roteamento. |
| `proximosPassosSugeridos.ts` | Sugere as próximas perguntas úteis conforme o agente, os fatos e o papel da pessoa. |
| `registrarSugestoesDaIa.ts` | Guarda aprendizados sugeridos pela IA apenas como rascunhos que exigem aprovação. |
| `responderComDadosLocais.ts` | Monta a resposta do agente com os dados locais do projeto (sem IA): prepara a pergunta, chama a parte do agente certo e devolve linhas, fontes e fatos usados. |
| `responderSobreTeste.ts` | Responde sobre um teste escolhido na tela Testes (tipo, arquivo, agente certo). |
| `saudacao.ts` | Abre a conversa: cumprimenta pelo nome, resume a situação e pergunta o que falta saber da pessoa. |
| `separarAprendizados.ts` | Separa da resposta da IA as linhas "APRENDIZADO:" (viram rascunho) do restante. |
| `skillDoAgente.ts` | Monta a Skill do agente para a IA externa: só os trechos aprovados do banco de Skills que combinam com a pergunta, dentro do limite de bytes. |
| `termoCasaComPergunta.ts` | Diz se um termo aparece na pergunta (frase exata, prefixo~ ou palavra). |

## mcp/

O servidor MCP que as IAs usam: ferramentas, roteiros e o registro de cada chamada.

| Arquivo | O que faz |
| --- | --- |
| `aprendizadosParaMcp.ts` | Junta os conhecimentos aprovados dos agentes para a IA, só se a pessoa permitiu enviar contextos. |
| `contextoCompleto.ts` | Monta a resposta da ferramenta MCP contexto_projeto: contexto autorizado, frameworks detectados, contextos e aprendizados permitidos. |
| `criarServidor.ts` | Cria o servidor MCP do Prumo ligado a um projeto: as oito ferramentas, os roteiros e a política conferida a cada chamada. |
| `projetoAindaVinculado.ts` | Reabre o contrato da pasta a cada chamada da IA e recusa (PROJECT_BINDING_CHANGED) se o projeto passou a ter outra identidade. |
| `registrarConsultarEvidencias.ts` | Ferramenta MCP consultar_evidencias: devolve à IA as evidências reais do projeto com integridade conferida; sem evidência, NOT_RUN. |
| `registrarContextoProjeto.ts` | Ferramenta MCP contexto_projeto: entrega à IA o contexto autorizado, os frameworks e, se permitido, os contextos e aprendizados; nada executa. |
| `registrarExecutarValidacao.ts` | Ferramenta MCP executar_validacao: executa uma capacidade do contrato só com aprovação humana nativa do Windows; sem ela, BLOCKED. |
| `registrarListarPoliticas.ts` | Ferramenta MCP listar_politicas: mostra à IA o que ela pode e não pode pedir neste projeto (especializações e capacidades, com o motivo). |
| `registrarProporAprendizado.ts` | Ferramenta MCP propor_aprendizado: a IA sugere um conhecimento para os agentes do projeto, que entra como RASCUNHO até a pessoa decidir. |
| `registrarProporBug.ts` | Ferramenta MCP propor_bug: a IA propõe um bug que fica como RASCUNHO local; não cria ticket no Jira. |
| `registrarProporCaso.ts` | Ferramenta MCP propor_caso: a IA propõe um caso de teste que fica como RASCUNHO local; não publica no Qase. |
| `registrarRevisarCobertura.ts` | Ferramenta MCP revisar_cobertura: revisão estrutural do plano de testes da IA (requisito, riscos, oráculos, repetições); sempre NOT_VERIFIED. |
| `registrarRoteirosMcp.ts` | Registra os roteiros (prompts MCP) do Prumo; eles só montam texto, não executam nada, e as políticas continuam valendo nas ferramentas. |
| `respostaDaFerramentaMcp.ts` | Executa uma ferramenta MCP e devolve o resultado em JSON; se der erro, devolve a mensagem com segredos mascarados. |
| `textoDoPrompt.ts` | Monta o texto de um roteiro MCP do Prumo com os valores informados. |
| `transporteObservado.ts` | Envolve a conversa MCP para registrar no diário o início e o término de cada chamada de ferramenta. |
| `valorOuPadrao.ts` | Usa o valor informado (limpo e curto) ou o padrão. |

## politicas/

O que a IA pode ou não pedir neste projeto, conferido a cada chamada.

| Arquivo | O que faz |
| --- | --- |
| `capacidadeEfetiva.ts` | Diz se a IA pode usar uma capacidade agora: permitido, bloqueado ou só a pessoa, com o motivo. |
| `configuracaoDoEspaco.ts` | Lê as especializações e políticas da IA neste projeto (ou o padrão). |
| `exigirCapacidade.ts` | Barra a chamada da IA quando a capacidade está bloqueada (POLICY_BLOCKED). Vale no servidor MCP a cada chamada. |
| `matrizDePoliticas.ts` | Lista todas as capacidades da IA com o estado e o motivo, para a tela Agentes. |
| `salvarConfiguracao.ts` | Salva as especializações habilitadas e as capacidades bloqueadas da IA neste projeto. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `autorizarDelegacaoDeIa.ts` | Autoriza ou revoga o chat de enviar perguntas ao Claude Code ou ao Codex. |
| `conhecimentoParaIA.ts` | Prepara o perfil e os conhecimentos aprovados para enviar à IA conectada. |
| `dividirSkillEmTrechos.ts` | Divide um arquivo SKILL.md em trechos curtos (descrição, seções e parágrafos), sem cortar blocos de código. |
| `escolherTrechosDaSkill.ts` | Escolhe os trechos aprovados de uma Skill que vão para o prompt: o essencial sempre, depois os que combinam com a pergunta, até o limite de bytes. |
| `licencaAberta.ts` | Reconhece a licença de uma Skill de terceiros e diz se ela permite reaproveitar o texto com crédito (MIT, Apache-2.0, BSD, ISC, CC-BY, CC0...). |
| `normalizarNome.ts` | Arruma o nome dito pela pessoa (iniciais maiúsculas), recusando textos que não parecem nome. |
| `raizDaPalavra.ts` | Encurta uma palavra para achar variações (ex.: testes → test). |
| `termosDaFrase.ts` | Separa os termos importantes de uma frase (mais de 3 letras, sem palavras comuns). |
| `validarEspecializacao.ts` | Confere que a especialização existe no Prumo antes de ler ou gravar Skill dela. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `chat.ts` | Formato da conversa do chat (turnos, estilos, provedores, resposta) e o guia de respostas do orquestrador. |
| `conhecimento.ts` | Formato de um conhecimento, perfil e atendimento, os limites e o conhecimento inicial do Prumo. |
| `ContextoDelegacao.ts` | Descreve os dados já verificados usados somente na delegação do chat para IA externa. |
| `conversas.ts` | Formato das conversas antigas do chat (até a 2.9) e seus limites. |
| `mcp.ts` | O que cada ferramenta do servidor MCP recebe (servidor, projeto, projeto do Prumo, respostas padronizadas) e as marcas de leitura e rascunho. |
| `orquestracao.ts` | Formato da orquestração observável: quais agentes participaram, em que ordem, quanto tempo cada etapa levou e o que consultou. |
| `persona.ts` | Os agentes do chat, os papéis da pessoa e a personalidade de cada agente. |
| `politicas.ts` | Capacidades da IA, especializações e o formato da configuração de agentes por projeto. |
| `roteiros.ts` | Os roteiros (prompts MCP) do Prumo e suas regras comuns. |
| `skills.ts` | Formato do banco de Skills: trechos de instrução por especialização, com origem, licença, estado e limites. |
