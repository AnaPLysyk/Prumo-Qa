# conexoes — backend

Conexões: contas de Jira, Qase e GitHub, leitura e escrita controlada nesses serviços e a conexão das IAs pelo MCP.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `conexaoAplicar.ts` | Canal conexao:aplicar: Adicionar o servidor MCP à configuração do Codex. |
| `conexaoTestar.ts` | Canal conexao:testar: Verificar handshake, quatro ferramentas e consulta de evidências pelo SDK real, separadamente do uso observado pelo cliente. |
| `escritaEstado.ts` | Canal escrita:estado: Ver em quais serviços a escrita está habilitada no projeto. |
| `escritaHabilitar.ts` | Canal escrita:habilitar: Habilitar ou desabilitar a escrita externa de um serviço no projeto. |
| `operacoesExecutar.ts` | Canal operacoes:executar: Executar uma operação externa do catálogo (criar ticket/caso/plano/run, anexar, editar, mudar status, vincular, branch, commit de teste, PR). |
| `operacoesListar.ts` | Canal operacoes:listar: Livro-razão das operações externas por projeto. |
| `operacoesPrevia.ts` | Canal operacoes:previa: Mostrar o resumo, o efeito e a chave de idempotência de uma operação externa antes de executá-la. |
| `projetoConexoes.ts` | Canal projeto:conexoes: Propor configuração e consultar diagnóstico de integração por cliente. |
| `servicosAceite.ts` | Canal servicos:aceite: Escolhe o campo do Jira que guarda os critérios de aceite. |
| `servicosAdicionar.ts` | Canal servicos:adicionar: Adiciona uma conta de serviço depois da confirmação nativa; a credencial fica protegida pelo Windows. |
| `servicosConferir.ts` | Canal servicos:conferir: Confere se o vínculo com o serviço continua válido. |
| `servicosConsultar.ts` | Canal servicos:consultar: Faz uma consulta de leitura no serviço vinculado (tickets, casos, runs, commits...) para as telas. |
| `servicosDesvincular.ts` | Canal servicos:desvincular: Remove o vínculo do projeto com um serviço depois da confirmação; nada é apagado no serviço. |
| `servicosListar.ts` | Canal servicos:listar: Lista as contas de Jira, Qase e GitHub configuradas (sem credenciais). |
| `servicosRecursos.ts` | Canal servicos:recursos: Lista os projetos/repositórios que a conta enxerga, para escolher qual vincular. |
| `servicosRemover.ts` | Canal servicos:remover: Remove uma conta e sua credencial depois da confirmação nativa. |
| `servicosValidar.ts` | Canal servicos:validar: Confere se a credencial de uma conta ainda funciona. |
| `servicosVincular.ts` | Canal servicos:vincular: Vincula um recurso do serviço (ex.: projeto Jira) a este projeto do Prumo, depois da confirmação. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `cofreCredenciais.ts` | Guarda, lê e apaga as credenciais do Jira, Qase e GitHub protegidas pelo Windows (DPAPI); nunca em texto aberto. |
| `exigirProtecaoDoWindows.ts` | Recusa guardar ou ler credenciais quando a proteção do Windows (DPAPI) não está disponível. |
| `gravarRegistroDaOperacao.ts` | Cria ou atualiza o registro de uma operação externa. |
| `gravarRegistroDeOperacoes.ts` | Grava o registro das operações externas, guardando as 1.500 últimas. |
| `lerArquivoDeCredenciais.ts` | Lê o arquivo credenciais.json (só valores cifrados); se ainda não existe, começa vazio. |
| `lerContasDeServico.ts` | Lê as contas de serviço configuradas (contas.json), sem as credenciais. |
| `lerCredencial.ts` | Decifra a credencial de uma conta com a proteção do Windows; se não existe ou não abre, avisa CREDENTIAL_UNAVAILABLE. |
| `lerPermissoesDeEscrita.ts` | Lê em quais serviços a escrita foi habilitada por projeto (permissoes-servicos.json). |
| `lerRegistroDeOperacoes.ts` | Lê o registro de todas as operações externas (operacoes-externas.json). |
| `listarContas.ts` | Lista as contas de serviço configuradas. |
| `listarOperacoes.ts` | Lista as operações externas de um projeto, da mais nova para a mais antiga. |
| `pastaDosTestesDeIntegracao.ts` | Pasta dos registros do teste de integração deste projeto. |
| `registrosIntegracao.ts` | Lê os registros dos testes de integração já feitos. |
| `removerCredencial.ts` | Apaga a credencial cifrada de uma conta de credenciais.json. |
| `salvarCredencial.ts` | Cifra a credencial com a proteção do Windows e a guarda em credenciais.json; recusa valor vazio, grande demais ou com caracteres de controle. |
| `validarIdDaCredencial.ts` | Confere se o identificador de uma credencial é um UUID válido. |

## escrita/

Escrita externa: catálogo de operações, permissão por projeto, prévia, envio único e conferência.

| Arquivo | O que faz |
| --- | --- |
| `catalogoOperacoes.ts` | Lista todas as operações de escrita conhecidas (Jira, Qase e GitHub). |
| `chaveDaOperacao.ts` | Calcula a chave que impede repetir a mesma operação (projeto + operação + parâmetros). |
| `codigoDaFalhaDeOperacao.ts` | Extrai o código de erro de uma falha de operação externa. |
| `escritaHabilitada.ts` | Diz se a escrita num serviço está ligada para o projeto (nasce desligada). |
| `executarOperacao.ts` | Executa uma operação externa confirmada, uma de cada vez por chave, sem duplicar. |
| `executarOperacaoUmaVez.ts` | Faz o envio de fato: confere permissão e confirmação, reconcilia se já existe, envia, relê para confirmar e registra. |
| `habilitarEscrita.ts` | Liga ou desliga a escrita de um serviço no projeto, registrando quem fez. |
| `limparRespostaRemota.ts` | Guarda só os campos úteis do item criado no serviço (id, chave, endereço, detalhes). |
| `marcadorDaOperacao.ts` | Marcador "prumo-xxxxxxxxxx" posto no item criado, para reconhecê-lo depois e não duplicar. |
| `operacaoPodeRepetir.ts` | Diz se vale tentar a operação de novo (tempo, indisponível, limite, resposta inválida). |
| `operacaoPorId.ts` | Busca uma operação de escrita pelo id (ex.: jira.comentar). |
| `operacoesDeEscritaPorServico.ts` | Lista as rotas de escrita permitidas de um serviço, para a Ajuda. |
| `permissoesDoEspaco.ts` | Mostra, para Jira, Qase e GitHub, se a escrita está ligada no projeto. |
| `prepararOperacao.ts` | Mostra a prévia de uma operação externa: resumo, efeito e chave, sem enviar nada. |
| `rotaEscritaPermitida.ts` | Diz se um método e caminho de escrita está na lista fechada do serviço (sem DELETE, sem truques no caminho). |
| `textoCanonico.ts` | Escreve um objeto sempre na mesma ordem de campos, para gerar a mesma chave. |

## github/

Operações no GitHub: branch prumo/..., commit de teste e Pull Request rascunho.

| Arquivo | O que faz |
| --- | --- |
| `abrirPullRequestNoGithub.ts` | Operação "Abrir Pull Request no GitHub" (rascunho), sem merge nem aprovação. |
| `caminhoDeTesteValido.ts` | Diz se um arquivo pode ser gravado pelo Prumo: só arquivos de teste, fora de .github, sem ".." nem caminho absoluto. |
| `caminhoDoRepositorio.ts` | Monta o caminho da API do repositório GitHub vinculado. |
| `commitAtualDoBranch.ts` | Lê o commit atual de um branch (ou nada se não existe). |
| `criarBranchNoGithub.ts` | Operação "Criar branch de trabalho no GitHub" (prumo/...), nunca o branch padrão. |
| `dadosDoRepositorio.ts` | Lê os dados do repositório (branch padrão, nome). |
| `gravarTesteNoGithub.ts` | Operação "Gravar arquivo de teste em branch de trabalho" (commit só em prumo/...). |
| `operacoesGithub.ts` | Lista das operações de escrita no GitHub que o Prumo conhece. |
| `pullRequestDoBranch.ts` | Procura um Pull Request aberto do branch de trabalho. |

## ia/

Conexão do Codex e do Claude com o Prumo pelo MCP: proposta, configuração e teste.

| Arquivo | O que faz |
| --- | --- |
| `aplicarConexao.ts` | Aplica a configuração no Codex com o configurador oficial, só depois da confirmação, sem sobrescrever nome existente. |
| `aspasDoPowershell.ts` | Coloca um texto entre aspas simples do PowerShell. |
| `assinaturaDaConfiguracao.ts` | Impressão digital da configuração proposta, para saber se o teste foi com a mesma configuração. |
| `caminhoNormalizado.ts` | Normaliza um caminho para comparação (minúsculas no Windows). |
| `comandoEhNodeDoPrumo.ts` | Diz se o comando configurado no cliente de IA é o node deste computador ou o próprio Prumo. |
| `conferirServidores.ts` | Conta quantos servidores MCP configurados no cliente apontam para este Prumo e este projeto. |
| `diagnosticarIntegracao.ts` | Junta configuração, teste de protocolo e uso observado num diagnóstico com níveis claros, sem afirmar mais do que foi visto. |
| `inspecionarIntegracao.ts` | Lê a configuração do Codex ou do Claude (sem segredos) e diz se o Prumo está configurado para este projeto. |
| `localizarClienteDeIa.ts` | Procura o CLI do Codex ou do Claude instalado neste computador. |
| `mesmoCaminho.ts` | Diz se dois caminhos absolutos apontam para o mesmo lugar. |
| `prepararConexao.ts` | Monta a proposta de configuração do servidor MCP do Prumo para o Codex ou o Claude (nome, destino e comando), sem alterar nada. |
| `situacaoDasConexoesDeIa.ts` | Mostra, para Codex e Claude, se o servidor MCP do Prumo está configurado e o comando proposto para configurar. |
| `testarIntegracao.ts` | Testa de verdade o servidor MCP do Prumo com o cliente escolhido e devolve o diagnóstico. |
| `testarProtocolo.ts` | Inicia o servidor MCP do Prumo e conversa com ele pelo SDK oficial (handshake, ferramentas e uma consulta), registrando o resultado. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `AdaptadorServico.ts` | Conversa com um serviço (Jira, Qase ou GitHub): valida a conta, lista recursos e faz cada consulta da tela com o endereço certo. |
| `autenticarNoServico.ts` | Confere quem é a conta no serviço (Jira e GitHub devolvem a identidade; o Qase v1 não devolve, então a conta é a desta conexão). |
| `cabecalhosDoServico.ts` | Monta o cabeçalho de autenticação do serviço: Basic no Jira, Bearer no GitHub e Token no Qase. |
| `conferirEscopoDaConsulta.ts` | Confere que o que voltou pertence ao recurso vinculado (tickets, caso, defeito, repositório) e valida o formato dos defeitos do Qase. |
| `consultarNoServico.ts` | Faz uma consulta de leitura da tela no recurso vinculado: monta o endereço do serviço, lê a resposta, confere o escopo e devolve só o seguro. |
| `contextoDoAdaptador.ts` | Dá às operações de escrita só o necessário (ler, enviar e limpar), sem nunca entregar a credencial; erros viram ErroServico. |
| `enderecoPublico.ts` | Diz se um IP é público (recusa rede interna, localhost e faixas especiais). |
| `enviarAoServico.ts` | Envia uma escrita (POST/PUT/PATCH) ao serviço, com corpo limitado a 12 MB. |
| `enviarComentarioAoJira.ts` | Envia só o comentário de resultado ao Jira (único caminho aceito). |
| `ErroServico.ts` | Erro de serviço externo com código fixo (sem permissão, limite de consultas, tempo esgotado...). |
| `idNumericoDaConsulta.ts` | Confere que o id pedido é um número (até 15 dígitos) e o prepara para ir no endereço; senão recusa. |
| `instanciaServico.ts` | Devolve o endereço oficial do serviço (Qase e GitHub fixos; Jira só *.atlassian.net). |
| `lerComCredencial.ts` | Faz uma leitura (GET) no serviço com a credencial da conta; sem credencial recusa, e qualquer falha que não seja do serviço vira SERVICE_UNAVAILABLE. |
| `lerDetalheDoServico.ts` | Faz as consultas de detalhe (metadados, transições, histórico, anexos, workflows, commits...) de Jira, Qase e GitHub. |
| `lerDoServico.ts` | Faz uma leitura (GET) num serviço externo. |
| `lerEnvelopeDaConsulta.ts` | Tira os dados de dentro da resposta do serviço conforme o formato dela e calcula onde começa a próxima página. |
| `limparRespostaDoServico.ts` | Limpa uma resposta do serviço antes de mostrar: mascara a credencial, tira campos de senha/token e limita textos, listas e objetos. |
| `listarRecursosDoServico.ts` | Lista, página por página, os projetos (Jira, Qase) ou repositórios (GitHub) que a conta enxerga. |
| `montarEnvioDeArquivo.ts` | Monta o corpo de envio de um arquivo anexo (multipart), com nome do arquivo limpo. |
| `obterRecursoDoServico.ts` | Lê de novo um projeto ou repositório pelo id, para conferir que o vínculo continua apontando para o mesmo recurso. |
| `planoDaConsultaGithub.ts` | Monta a consulta no GitHub (repositório, branches, commits, PRs, um PR e verificações de um commit) só no repositório vinculado. |
| `planoDaConsultaJira.ts` | Monta a consulta no Jira (tickets com filtros, campos, um ticket ou seus comentários); ticket de outro projeto é recusado. |
| `planoDaConsultaQase.ts` | Monta a consulta no Qase (defeitos, suites, casos, planos, runs e resultados) só no projeto vinculado. |
| `procurarComentarioNoTicket.ts` | Procura um marcador nos comentários do ticket (até 500), para não duplicar o comentário depois de uma falha de rede. |
| `publicarComentarioNoTicket.ts` | Publica um comentário num ticket do projeto Jira vinculado, depois de confirmar que o ticket é desse projeto. |
| `recursoDaResposta.ts` | Lê um projeto ou repositório devolvido pelo serviço e confere id e chave no formato esperado (e sem a credencial dentro). |
| `requisitarServico.ts` | Faz a chamada HTTPS ao serviço: IP público fixado, sem redirecionamento, com tempo e tamanho limitados. |
| `saidaDaConsulta.ts` | Monta o que a tela recebe de uma consulta: dados limpos, próxima página, origem, data, endpoint e o aviso de que é informação externa. |
| `textoEntreAspasJql.ts` | Coloca um texto entre aspas para uma busca JQL, escapando caracteres. |
| `textoRemoto.ts` | Extrai o texto puro de um campo vindo do Jira/Qase/GitHub (inclusive do formato ADF), com limite, sem interpretar HTML. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `adaptadorDaConta.ts` | Abre a conversa com o serviço de uma conta usando a credencial guardada no cofre do Windows (ela não sai do adaptador). |
| `adicionarConta.ts` | Adiciona uma conta de Jira, Qase ou GitHub: autentica no serviço, recusa duplicada e guarda a credencial protegida pelo Windows. |
| `codigoDoErroDeServico.ts` | Código do erro de um serviço externo (ou CREDENTIAL_UNAVAILABLE quando o erro não veio do serviço). |
| `comentarNoJira.ts` | Publica o comentário de resultado num ticket do Jira vinculado, depois de revalidar conta, vínculo e projeto. |
| `consultarServico.ts` | Faz uma consulta de leitura no serviço vinculado (tickets, casos, runs, commits...) e anota no histórico do projeto se deu certo. |
| `contaAtiva.ts` | Busca uma conta de serviço ativa pelo id; se não existe ou foi removida, avisa CREDENTIAL_UNAVAILABLE. |
| `escolherCampoAceite.ts` | Confere que o campo do Jira existe e é personalizado, e o grava como o campo de critérios de aceite do projeto. |
| `estadoDoVinculoPeloErro.ts` | Traduz um erro do serviço no estado do vínculo: sem permissão, sem credencial, desatualizado ou indisponível. |
| `executarComServico.ts` | Executa uma operação com o serviço já revalidado (conta, vínculo e projeto); a credencial não sai do adaptador. |
| `listarRecursosDaConta.ts` | Lista os projetos ou repositórios que uma conta enxerga no serviço, para escolher qual vincular. |
| `nucleoServicos.ts` | Reúne tudo o que a tela Conexões faz com Jira, Qase e GitHub: adicionar e validar conta, listar recursos, vincular, consultar e escrever com a credencial protegida. |
| `procurarComentarioNoJira.ts` | Procura no ticket do Jira um comentário que o Prumo já publicou (pelo marcador), para não publicar duas vezes. |
| `removerConta.ts` | Desativa uma conta, apaga sua credencial e marca os vínculos que a usavam como "sem credencial"; nada é apagado no serviço. |
| `servicosDoAplicativo.ts` | Núcleo de serviços (Jira, Qase, GitHub) do aplicativo, com as credenciais protegidas pelo Windows. |
| `validarConta.ts` | Confere se a credencial de uma conta ainda funciona e é da mesma identidade; anota a data da validação. |
| `validarVinculoDoServico.ts` | Confere de novo o vínculo do projeto com o serviço (aceitando mudança de chave do recurso) e devolve o projeto atualizado. |
| `verificarVinculoDoServico.ts` | Antes de qualquer consulta ou escrita, confere de novo a conta, a identidade e o recurso vinculado; anota no projeto se o vínculo continua válido. |
| `vincularRecursoAoEspaco.ts` | Vincula um recurso do serviço ao projeto do Prumo depois de reler o recurso e conferir que nada mudou. |
| `vinculoDoServico.ts` | Busca a ligação do projeto com um serviço (Jira, Qase ou GitHub); se não existe, avisa WORKSPACE_LINK_NOT_FOUND. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `adaptador.ts` | Consultas de leitura conhecidas por serviço e o formato da configuração de um serviço. |
| `contaDeServico.ts` | Formato de uma conta de Jira, Qase ou GitHub (sem a credencial) e dos dados para adicioná-la. |
| `credenciais.ts` | Formato do protetor de credenciais do Windows e do arquivo de credenciais cifradas. |
| `escritaGithub.ts` | Formatos aceitos nas operações no GitHub (branch prumo/..., commit de teste, PR) e quais arquivos são de teste. |
| `integracaoIa.ts` | Clientes de IA conhecidos (Codex, Claude), ferramentas MCP esperadas e formato dos registros de teste de integração. |
| `leituras.ts` | Consultas de detalhe extras e os filtros aceitos na busca de tickets. |
| `operacao.ts` | Formato de uma operação de escrita (prévia, envio, reconciliação) e dos dados auxiliares de anexos. |
| `operacoesExternas.ts` | Formato do registro das operações externas, das permissões de escrita por projeto e das opções de execução. |
| `rotasDeEscrita.ts` | Lista fechada de métodos e caminhos de escrita permitidos por serviço. |
| `transporte.ts` | Códigos de erro dos serviços, formato dos pedidos de leitura e escrita e da paginação. |
