# Plataforma manual, Jira, Qase e GitHub

Crie o projeto no Prumo antes de conectar serviços. Você escolhe depois quais serviços quer usar.

## Criar o projeto

Em **Projetos**:

- **Criar projeto manual**: informe o nome e a descrição. Vincular uma pasta, conectar serviços e usar IA são opções.
- **Importar projetos do Qase**: informe o token e escolha os projetos que quer importar. Eles já ficam vinculados no Prumo.

Depois, no projeto, **Vincular repositório local…** liga uma pasta de código e **Escolher repositório do GitHub…** liga um repositório. Dá para ficar só no local.

## Conectar um serviço

Em **Conexões**, cada serviço tem uma linha com **Conectar**. O formulário diz o que o token precisa:

- **Jira**: endereço Cloud (*.atlassian.net), e-mail e token de API sem escopos.
- **Qase**: token da API v1.
- **GitHub**: token fine-grained com Issues Read and write; Contents, Pull requests e Actions Read-only; Metadata, que o GitHub marca sozinho.

O token fica protegido no cofre do sistema. Se esse cofre não estiver disponível, o Prumo não salva o token.

Para conectar um projeto que já existe no serviço, use **Listar recursos disponíveis** na conta. Confira a chave, o ID e a conta e escolha **Vincular**. A lista vem diretamente do serviço; o Prumo não escolhe projetos por nomes parecidos. Para trocar o projeto, remova o vínculo em **Projetos** e crie outro. Para trocar o token, remova e refaça a conexão.

## Consultar

- **Tickets**: tickets do Jira, defeitos do Qase, issues do GitHub e rascunhos locais na mesma lista.
- **Testes**: suites, casos, planos e runs do Qase, testes do repositório e pipelines.

Cada resposta mostra de onde vieram os dados e quando foram consultados. Se houver erro, o Prumo mostra o erro em vez de exibir uma lista vazia. Para ver critérios de aceite do Jira, escolha o campo em **Descobrir campos**; o Prumo não tenta adivinhá-lo. O resultado de uma execução externa não é tratado como evidência local.

Em **Testes › Repositório**, você declara um vínculo entre ticket e caso com justificativa. O Prumo confere os dois no serviço antes de registrar, mas um vínculo declarado não comprova cobertura.

## Escrever nos serviços

Por padrão, o Prumo não altera dados nos serviços. Para permitir alterações, habilite a escrita para cada projeto e serviço em **Habilitar escrita…**:

- **Jira**: criar, comentar, editar, anexar, mudar status e vincular tickets.
- **Qase**: criar casos, suites, planos, runs e defeitos, publicar resultados e mudar o status de um defeito.
- **GitHub**: criar issues, branches prumo/…, gravar arquivos de teste e abrir Pull Request em rascunho.

Antes de enviar, o Prumo mostra uma prévia e pede confirmação do sistema. Depois, confere o resultado no serviço e evita criar itens duplicados. O Prumo não apaga dados dos serviços.

## Onde consultar a implementação

A documentação de uso fica em **Ajuda**, dentro do aplicativo, e no **site oficial**. Para quem desenvolve o Prumo, a tela **Administração → Documentação Viva** apresenta a arquitetura atualizada a partir do código: telas, arquivos, funções, dependências e canais IPC.

A organização do código segue o nome da tela: `frontend/login/` contém sua interface e `backend/login/` contém as regras, dados e integrações. O mesmo padrão vale para Projetos, Testes, Tickets e as outras telas. As rotas HTTP remotas ficam em `backend/<tela>/servidor/`; a entrada comum fica em `backend/aplicativo/servidor/`. A página web de recuperação fica em `frontend/login/web/`, separada das telas Electron.

Para atualizar o catálogo de canais usado pela Documentação Viva execute `npm run documentacao:viva`. O build também o atualiza automaticamente. Não são gerados arquivos `LEIA-ME` por pasta. O login do MVP usa somente o módulo remoto Better Auth/PostgreSQL; o fluxo local anterior continua disponível apenas para compatibilidade. Os arquivos históricos `v36`/`v40` no `dist/` são derivados do manifesto `frontend/construcao/telas-modulares.json` e não devem ser editados.

## Manutenção da tela Projetos

Abra **Administração → Documentação Viva → Projetos** antes de editar. Todas as fontes visuais estão em `frontend/projetos/`, com responsabilidades separadas:

- `mostrarProjetos.js`: abre a tela e consulta os projetos, delegando cada seção a um arquivo próprio.
- `mostrarPastasLocais.js`: lista as pastas com contrato `qa.project.json`, permite selecionar, vincular e desvincular.
- `componentes/montarDiagnosticoPasta.js`: explica os problemas encontrados ao vincular uma pasta.
- `componentes/montarSecaoProjeto.js`: apresenta nome, descrição e ações de um projeto.
- `componentes/montarVinculosProjeto.js`: exibe vínculos com serviços e a pasta local, com ações de validar e remover.
- `selecionarProjeto.js`: guarda o projeto ativo e abre a área solicitada, sem copiar o código de Testes.
- `modais/criarEditarProjeto/abrirFormularioProjeto.js`: formulário manual de cadastro e edição.
- `modais/escolherRepositorioGithub/abrirRepositoriosGithub.js`: seleção de conexão, paginação e vínculo de repositório.

A lista de pastas e seu diagnóstico não ficam mais no arquivo compartilhado `frontend/compartilhado/runtime/app.js`: todo o comportamento visual de Projetos agora está em `frontend/projetos/`.

O backend dessa tela continua em `backend/projetos/`: canais IPC em `api/`, persistência em `banco/`, regras em `regras/` e contratos em `tipos/`. Conexões com serviços pertencem à tela Conexões; Projetos utiliza seus canais públicos, sem duplicar a autenticação dos serviços.

Para modificar a tela, altere sempre os arquivos de `frontend/projetos/`, nunca as cópias compiladas em `dist/renderer/`. O teste `testes/unitario/frontend/projetos/tela-projetos-modular.test.mjs` confere a montagem, a ordem de carregamento, a edição e os vínculos sem chamar serviços externos. Execute-o antes da suíte de testes completa.

## Manutenção da tela Tickets

A implementação visual de Tickets fica exclusivamente em `frontend/tickets/`. Os cinco fragmentos possuem responsabilidades diferentes:

- `fluxos-tickets.parte.js`: tela principal, filtros, consulta e lista unificada de tickets Jira, defeitos Qase, Issues GitHub e rascunhos Prumo.
- `tickets-locais.parte.js`: criação de rascunhos, classificação, revisão, vínculos e escolha do destino para publicação.
- `tickets-jira.parte.js`: consulta avançada, detalhe, comentários, transições, edição e criação de tickets no Jira.
- `tickets-defeitos-qase.parte.js`: detalhe de defeitos Qase, relações com Jira e alteração de status quando autorizada.
- `tickets-issues-github.parte.js`: leitura dos detalhes de Issues do repositório GitHub vinculado.

O manifesto `frontend/construcao/telas-modulares.json` estabelece a ordem desses fragmentos, reunidos automaticamente em `dist/renderer/fluxos-v40.js`. **Edite as fontes de `frontend/tickets/`, nunca o bundle gerado.**

As regras de Tickets ficam em `backend/tickets/`: `api/` são canais IPC, `banco/` é persistência local, `regras/` organiza a criação, revisão e publicação, `integracoes/` executa chamadas autorizadas ao Jira e `tipos/` define os contratos. O login nas plataformas externas pertence à tela Conexões e não deve ser implementado novamente em Tickets.

Para conferir a separação sem publicar nada, execute `node --test testes/unitario/frontend/tickets/modulos-tickets.test.mjs testes/unitario/frontend/tickets/fonte-jira-ou-local.test.mjs`, depois o build e a suíte unitária. Operações reais de escrita em Jira/Qase/GitHub ainda exigem homologação manual com permissão e confirmação explícitas.

## Manutenção da tela Conexões

A autenticação da conta do **Prumo QA** pertence exclusivamente a `frontend/login/` e `backend/login/`. As credenciais de **Jira, Qase e GitHub** não fazem login no aplicativo: elas permitem consultar os serviços e realizar ações somente depois das confirmações necessárias.

Na tela `frontend/conexoes/`:

- `mostrarConexoes.js`: abre a tela, lista contas vinculadas e organiza as ações de cada serviço.
- `componentes/apresentarProjetosQase.js`: filtra, seleciona e importa os projetos presentes na prévia da API do Qase; cancelar descarta a prévia.
- `componentes/mostrarPermissoesConexao.js`: orienta quais permissões cada serviço exige, sem participar do armazenamento de credenciais.
- `formularios/abrirFormularioConexao.js`: exibe os campos específicos de Qase, Jira e GitHub e envia o pedido de validação ao backend.
- `mostrarOperacoesExternas.js`: mostra as operações externas recentes sem permitir escrita automaticamente.
- `mostrarIntegracoesDosAgentes.js`: exibe as conexões de IA e permite abrir o painel MCP, sem implementar outra autenticação.
- `frontend/agentes/mostrarConfiguracaoMcp.js`: configura e testa os clientes Codex/Claude Code. Esse código pertence a Agentes, não ao runtime compartilhado `app.js`.

No backend, `backend/conexoes/api/` recebe os pedidos IPC; `banco/` protege e recupera credenciais; `integracoes/`, `github/` e `ia/` acessam os sistemas correspondentes; `escrita/` verifica permissões e registra operações; `tipos/` contém os contratos. Nenhuma dessas pastas substitui `backend/login/`.

Para conferir o comportamento do formulário sem enviar credenciais reais, execute `node --test testes/unitario/frontend/conexoes/campos-por-servico.test.mjs no Prumo QA e node automacao/prumo-qa/executar.mjs --tipo regressao --arquivo frontend/conexoes/mensagens-login-qase.test.mjs no Prumo QA Lab`. O teste visual completo e a homologação real das permissões externas ainda são etapas separadas.

## Manutenção da tela Agentes

A tela de agentes está em `frontend/agentes/`, não no runtime compartilhado. A divisão do bundle `interfaces-v36.js` mantém três responsabilidades:

- `tela-agentes.parte.js`: cadastro, seleção, permissões e configurações de agentes.
- `cerebro-do-agente.parte.js`: visualização dos neurônios, vínculos e habilidades do agente.
- `atividades-do-agente.parte.js`: orquestrações e abertura do painel de atividades.
- `atividades/modelo-e-layout.js`: transforma os registros observados (MCP, conversas e worker) em nós e ligações e calcula suas posições no canvas, sem fazer chamadas de API.
- `atividades/painel-atividades-v41.js`: controles do canvas, navegação, atualização dos registros e apresentação visual. Carregado depois do modelo, conforme `frontend/recursos.json` e `frontend/compartilhado/runtime/index.html`.
- `mostrarConfiguracaoMcp.js`: orientação e teste das conexões MCP de Claude Code e Codex, exibido também por Conexões.

Os fragmentos do bundle são concatenados exatamente na ordem indicada em `frontend/construcao/telas-modulares.json`; não edite diretamente `dist/renderer/interfaces-v36.js`. As permissões e a execução ficam no backend em `backend/agentes/`.

A separação em arquivos não constitui homologação manual do painel, nem prova de conexão com IA externa. Primeiro confira a tela em um perfil de homologação, depois avalie as APIs de IA/MCP conforme as permissões de cada agente.

## Manutenção de Agendamentos e Testes › Runs

A tela `frontend/agendamentos/operacao-v40.js` registra `abas.agenda` e cuida da lista, dos formulários, das autorizações e das políticas do worker. Os arquivos `mostrarAgendamentos.js` e `cartoes/montarCartaoRotina.js` eram implementações antigas substituídas pela tela nova e foram retirados.

`frontend/testes/execucoes-e-evidencias.js` contém os detalhes de Runs, logs e evidências locais, além de `abas.evidencias` e da API de interface `window.PrumoOperacao`. A ordem de carga depende de `frontend/recursos.json` e `frontend/compartilhado/runtime/index.html`. As operações de execução permanecem no backend; nenhuma chamada de escrita externa foi alterada nesta divisão.

## Manutenção da tela Métricas

A versão ativa está em `frontend/metricas/tela-metricas.parte.js`, montada no bundle `interfaces-v36.js`. A implementação antiga `mostrarMetricas.js` e seu auxiliar `componentes/montarVisuaisMetricas.js` eram carregados antes da versão v36 e depois substituídos. Ambos foram retirados do frontend e do carregamento para evitar duas fontes concorrentes da mesma tela.

## Manutenção da tela Logs

O terminal visual mantém a responsabilidade na pasta `frontend/logs/`: `tela-logs.parte.js` monta a interface e os botões; `eventos-e-detalhes.parte.js` prepara as linhas e a inspeção de eventos; `filtros-e-atualizacao.parte.js` filtra, consulta o backend e controla a atualização automática. As três partes são montadas nesta ordem no `interfaces-v36.js` pelo manifesto `frontend/construcao/telas-modulares.json`.

As consultas e a exportação continuam em `backend/logs/api`, com regras de processamento em `backend/logs/regras` e persistência em `backend/logs/banco`. A modularização não altera os eventos, o intervalo de atualização nem a comunicação IPC. Ainda é necessária homologação visual real, incluindo navegação, seguir saída, filtros e exportação.

## Manutenção da Administração

A Documentação Viva utiliza o bundle `administracao.js`, gerado de cinco fragmentos em `frontend/administracao/`: `tela-administracao.parte.js` inicia a interface, `documentacao/explorador.parte.js` cria o índice e a árvore, `documentacao/fluxo.parte.js` desenha o fluxograma, `documentacao/codigo-e-telas.parte.js` exibe o código com explicações e `painel-e-navegacao.parte.js` registra abas e resumo do sistema. Edite essas fontes; não modifique o bundle de `dist/renderer/`.

`gerenciarAcessos.js` permanece responsável por usuários, papéis, agentes e configurações gerais; `chamadosDeSuporte.js` cuida da gestão dos chamados. Os canais e as regras permanecem em `backend/administracao/`. O mesmo JavaScript original foi distribuído entre os cinco fragmentos sem alterar suas instruções executáveis.

## Manutenção de Configurações

O painel de Configurações em `frontend/configuracoes/` tem quatro partes no bundle `interfaces-v36.js`: `ajustes-do-assistente.parte.js` prepara o estado e os controles compartilhados, `perfil-e-conta.parte.js` apresenta e salva dados de perfil, `aparencia-e-assistente.parte.js` cuida de aparência, voz e IA externa e `navegacao-dos-ajustes.parte.js` controla as abas e a atualização das informações. `preferenciasDaJanela.js` mantém tema, idioma e cor. A navegação, o menu lateral e o seletor de projeto ficam em `frontend/compartilhado/navegacaoDaJanela.js`.

Os fragmentos preservam o código anterior na mesma ordem; a persistência e a autorização permanecem nas APIs já existentes. A homologação manual do painel e as permissões de usuário ainda precisam ser conferidas na aplicação real.

## Manutenção da tela Início

A única implementação da tela Início fica em `frontend/inicio/tela-inicio-v36.parte.js` e usa `conversa.montar()`. A antiga `frontend/inicio/mostrarInicio.js`, carregada antes e sobrescrita pelo bundle, foi retirada. `frontend/inicio/identidade/qc.js` continua necessário aos retratos, esfera e estados visuais do assistente; `orbitas-v36.js` e `robos-v36.js` também permanecem com seus usos próprios.

## Manutenção do runtime compartilhado e limpeza de código antigo

`frontend/compartilhado/runtime/app.js` guarda apenas estado, navegação e funções comuns. As implementações antigas de Métricas, Logs, Ajuda e Suporte foram retiradas porque suas telas oficiais já são carregadas separadamente. Os painéis de versões, atualizações, integrações e privacidade ficam em `frontend/ajuda/paineis-da-ajuda.js`; o sino e o acompanhamento de versões ficam em `frontend/compartilhado/notificacoes.js`. O `index.html` carrega ambos após `app.js`. Para alterar uma tela, abra a pasta dessa tela, não o runtime comum.

Também foram retirados os estilos da antiga tela Início sem consumidores atuais e o wrapper de validação de links de issue (`backend/suporte/regras/linkDeIssueValido.ts`); os testes validam diretamente a regra `padraoLink` em `backend/suporte/tipos/suporte.ts`. Os agentes, a identidade visual compartilhada e o código usado por testes/release foram preservados.

**Compatibilidade externa:** a pasta `scripts/` ainda contém `gerar-site.mjs` porque a configuração efetiva do Render para `prumo-qa-docs` continua chamando esse caminho. `render.yaml` já usa `site/construir-no-render.mjs`, mas apagar o atalho antes de atualizar o serviço existente interromperia o build. Não remova esse arquivo sem mudar e validar o Build Command real no Render.

**Limite de homologação:** a última execução de `npm run check:isolado` passou em **681 de 681 testes elegíveis** e `npm run test:smoke` passou em **2 de 2 testes**, inclusive abrindo as telas do Electron. O modo isolado não executa 40 arquivos que precisam de janela Electron ou migração. Três falhas vistas numa bateria visual anterior foram corrigidas nos dados de teste e passaram em execuções direcionadas, mas a bateria completa não foi repetida. Login e integrações externas reais, instaladores e deploy não estão homologados por esses resultados.

## Ajuda e Suporte

A tela **Ajuda** é gerada em `dist/renderer/ajuda.js` com `frontend/ajuda/busca-e-indice.parte.js` (grupos, termos, sinônimos e pontuação da pesquisa) e `frontend/ajuda/navegacao-e-conteudo.parte.js` (lista, abertura, seleção e navegação). Os painéis especiais permanecem em `frontend/ajuda/paineis-da-ajuda.js`, carregado antes da tela.

A tela **Suporte** é gerada em `dist/renderer/suporte.js` com `frontend/suporte/chamados-da-pessoa.parte.js` (lista e respostas), `frontend/suporte/revisao-e-envio.parte.js` (formulário, consentimento, revisão e envio) e `frontend/suporte/consultas-e-diagnostico.parte.js` (consultas públicas, acesso à Ajuda e dados locais). Os cinco fragmentos preservam o JavaScript anterior; edite somente as fontes e rode o build.

## Auditoria com agentes locais

Para inspecionar o código alterado, execute `npm run build` e depois `npm run auditoria:agentes` na raiz. O **Orquestrador existente** executa primeiro o agente `investigacao-bugs` (localiza arquivos grandes e candidatos à simplificação) e depois o agente `regressao` (reabre as fontes para verificar imports, scripts de tela e o `git diff --check`). Cada etapa fica identificada no relatório `.prumo/auditorias/revisao-por-agentes.json`, que é ignorado pelo Git.

Este fluxo utiliza tarefas determinísticas de inspeção feitas por agentes internos de QA. **Não são duas sessões de IA que programam**, não modifica arquivos e não aprova uma release. A indicação de arquivo longo não autoriza exclusão automática: contratos centrais ou testes com vários cenários podem ser extensos legitimamente. Correções precisam de análise individual, testes de regressão e verificação no Electron.

Para cobrir todas as áreas versionadas, execute `npm run auditoria:agentes -- --todas-as-pastas`. O resultado detalhado fica em `.prumo/auditorias/revisao-todas-as-pastas.json`. Cada arquivo do inventário é lido, e um segundo agente confere sua integridade; o relatório separa **candidatos** de falhas efetivamente encontradas. Inspeção automatizada não equivale a compreender manualmente cada função.

Na primeira vistoria ampla, sete candidatos de tamanho elevado foram analisados e preservados: `catalogoDeContratos.ts` é a fonte central dos esquemas IPC/MCP; `registrarCanaisIpc.ts` concentra o registro dos canais; três arquivos CodeMirror são código de terceiros necessário ao editor; `i18n-en-v41.js` contém as traduções utilizadas pela interface; `formulario-caso-local-execucao.test.mjs` reúne cenários separados por comportamento. O tamanho isoladamente não justificou criar pastas extras ou remover funcionalidades.

## Andamento da auditoria de manutenção

Este inventário distingue **refatoração do frontend** de **homologação real**. Passar em testes de código não confirma que integrações externas estão funcionando.

| Pasta do frontend | Situação | Próxima verificação |
| --- | --- | --- |
| `login/` | Entrada local e OAuth modularizados | GitHub/Google locais: autorização e cancelamento aprovados no Electron. OAuth do Better Auth central ainda pendente de integração e homologação. |
| `projetos/` | Refatorada | Uso visual no Electron com integrações reais |
| `testes/` | Refatorada | Navegação visual, Qase, planos e runs reais |
| `tickets/` | Refatorada | Formulários e ações reais em Jira/Qase/GitHub |
| `conexoes/` | Refatoração visual concluída | Validar comportamento na janela Electron, cofre e escrita real autorizada |
| `agentes/` | Revisão parcial | Simplificar telas grandes, painel, MCP e observabilidade (configuração MCP já retirada do `app.js`) |
| `agendamentos/` | Revisão de separação realizada | Tela e cartão antigos retirados; execução e evidências movidas para `testes/`; conferir horários, permissões e worker |
| `metricas/` | Revisão parcial | Removida implementação antiga; revisar legibilidade da tela v36, filtros e relatórios |
| `logs/` | Refatoração estrutural realizada | Três módulos no frontend; validar atualização periódica, filtros e navegação no Electron |
| `administracao/` | Documentação Viva modularizada | Cinco módulos no bundle, separados de Usuários, Permissões e Chamados; validar interação no Electron |
| `configuracoes/` | Interface modularizada | Perfil, aparência/assistente e navegação separados; validar preferências e acessibilidade no Electron |
| `inicio/` | Tela legada substituída removida | Validar chat e esfera no Electron; identidade `qc.js` permanece ativa |
| `ajuda/` | Organização concluída | Busca e índice separados da navegação; validar pesquisa no Electron |
| `suporte/` | Organização concluída | Meus chamados, formulário/envio e diagnóstico separados; validar jornada no Electron |
| `compartilhado/` e `design-system/` | Revisão de inventário e dependências realizada | Manter componentes e bibliotecas usados; não dividir artificialmente o Design System. Verificação visual contínua no Electron. |

Além dessas telas, há módulos internos sem pasta de frontend equivalente, como `backend/atualizacoes/`, `backend/aplicativo/` e `backend/terminal/`, que também precisam de auditoria própria. Conexões e Agentes continuam parcialmente revisadas; nenhuma pasta deve ser marcada como totalmente homologada sem execução manual dos fluxos envolvidos.

## Evidências de regressão da etapa de 19/10/2026

A regressão MCP revelou uma validação equivocada: o processo exigia um espaço de trabalho mesmo quando a pasta do projeto já estava vinculada à conta. O MCP agora verifica o **vínculo da pasta** e a sessão atual a cada ferramenta, além de impedir que um processo iniciado pela conta A seja reaproveitado pela conta B. O teste real de Contextos MCP passou; a janela passou nas verificações de isolamento e IPC.

Logs, Métricas e Ajuda foram retestados sem simular atividades que o MCP autenticado já registra automaticamente. Passaram os testes direcionados de visualização, exportação e limpeza de dados, diagnóstico IPC e revogação do MCP após encerrar o Electron. O transporte de teste é fechado inclusive quando a autenticação falha.

A tela Login não pede Client ID nem Client Secret da pessoa. O módulo de entrada por provedor monta apenas os botões de provedores locais **já configurados pelo administrador**, inicia o OAuth no navegador e acompanha confirmação ou cancelamento; as opções são ocultadas sem configuração. Os seis testes direcionados de login local/GitHub/Google e primeiro acesso passaram no Electron. **A autenticação central Better Auth permanece restrita ao fluxo remoto por e-mail e senha**: OAuth central, callback de sessão entre navegador e desktop e vínculo entre contas remotas não foram homologados e não devem ser anunciados como concluídos.

A auditoria dos agentes internos percorreu **82 áreas e 1.425 arquivos** em **164 etapas**, com sete arquivos grandes investigados sem exclusões especulativas. O smoke do Electron passou (2/2), assim como a compilação e a verificação dos contratos IPC; as regressões de integração real com contas e tokens externos continuam fora desse atestado. Na validação final, `npm run check:isolado` concluiu **683/683 testes** e `npm run test:regressao` concluiu **398/398 testes** (zero falhas em ambas; **1.081 cenários**, em dois conjuntos independentes). `npm run test:smoke` concluiu **2/2**, a conferência dos módulos e `git diff --check` passaram. O site está gerado localmente em **38 páginas**. A [release oficial v2.18.0](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.18.0) já havia sido publicada em 17/10/2026, antes desta auditoria. **As correções locais validadas aqui não estão incluídas nessa release sem novo commit e publicação.** A geração local não representa deploy.

**Limites da homologação:** os provedores sociais locais foram exercitados com navegador e perfis sintéticos; não ocorreu login real em contas externas. Não houve assinatura de instalador, publicação de release, migração do perfil pessoal de produção ou teste de OAuth remoto do Better Auth. Os dados reais de terceiros não foram alterados.

Nenhum commit, push ou deploy foi realizado nesta etapa.

A verificação de manutenção existente (`testes/unitario/frontend/compartilhado/manutencao-por-tela.test.mjs`) confirma que todos os fragmentos pertencem a um único bundle, que há só um consumidor de cada tela e que não há arquivos de interface sem entrada declarada, exceto a página de recuperação de senha servida fora do Electron. Os oito testes desse contrato passaram. Não foi criada uma segunda regra redundante para a mesma validação.

## Decisões de manutenção: contratos e traduções

O arquivo `backend/aplicativo/api/registrarCanaisIpc.ts` concentra apenas o registro dos canais da janela: cada implementação pertence ao backend da tela correspondente. Ele é longo porque serve como ponto único de ligação, não porque mistura as regras de negócio das telas. O `catalogoDeContratos.ts` mantém os esquemas Zod compartilhados pelos canais e pela Documentação Viva; dividir esse catálogo sem necessidade aumentaria as referências cruzadas. Os arquivos CodeMirror em `frontend/compartilhado/vendor/` são bibliotecas de terceiros usadas pela IDE e não devem ser reescritos nem repartidos por estética. O teste extenso do formulário de casos locais cobre as variações de uma única funcionalidade; sua extensão não comprova código obsoleto.

Em outra rodada, **35 repetições idênticas dos esquemas de entrada IPC** foram substituídas por cinco formatos Zod declarados no próprio catálogo, sem adicionar arquivos ou alterar os argumentos aceitos. A comparação entre versões repetiu **13 entradas em cada um dos 184 canais (2.392 validações)** e não encontrou diferenças; os nove testes de contratos também passaram. O registrador recebeu **23 títulos de seções** para facilitar a busca pelo módulo, preservando todos os 184 canais e a ordem de registro. Uma inspeção adicional de corpos de funções não triviais nos **957 arquivos TypeScript próprios** do backend (excluindo dependências instaladas) não encontrou clones literais entre arquivos diferentes. A ausência de clones idênticos não elimina a possibilidade de redundâncias semânticas.

A inspeção do grafo TypeScript revelou **dois ciclos de importação**: entre worker, avisos e bandeja, e entre a ação do menu e sua atualização. Foram corrigidos sem novas pastas: `backend/agendamentos/worker/workerDoAplicativo.ts` deixa de importar a interface; `backend/aplicativo.ts` conecta os eventos aos avisos; a bandeja repassa a função de atualização aos itens do menu. Os arquivos pequenos da bandeja foram formatados em etapas legíveis, sem alterar ações. O teste estrutural agora analisa os **957 arquivos TypeScript próprios** e reprova imports circulares; a verificação encontrou **zero ciclos**, e os **18 testes direcionados** de arquitetura e contratos passaram. Os **8/8 testes de regressão direcionada** de Agendamentos, bandeja, configurações e saída passaram novamente após a reorganização final, incluindo execução autorizada, pausa, retomada, evidência, Jira simulado, saída e liberação de trava. A última checagem isolada completa concluiu **689/689 testes**, zero falhas, com os dois testes estruturais novos.

Nos dicionários de inglês do runtime foram removidas **118 redefinições com tradução idêntica**, mantendo os arquivos existentes e preservando todas as traduções que tinham valores diferentes. A comparação do dicionário e das regras antes e depois foi idêntica; o teste de tradução agora verifica os cinco arquivos na ordem real do Electron e rejeita futuras duplicações idênticas. Não foi necessário criar outro mecanismo de internacionalização. A validação da etapa de traduções terminou com **687/687 testes isolados**, **1/1 teste visual de inglês no Electron**, **2/2 testes de smoke**, build sem imports ausentes e geração local de **38 páginas**. A regressão completa anterior de **398/398 testes** não foi repetida após essa limpeza exclusivamente de traduções.

**Como manter a bandeja:** `backend/aplicativo/bandeja/acaoDoMenuDaBandeja.ts` trata cada escolha do menu; `menuDaBandeja.ts` monta os itens e suas ações; `atualizarBandeja.ts` atualiza o ícone e a dica. A função de atualizar passa como argumento, evitando um import circular. `backend/agendamentos/worker/workerDoAplicativo.ts` só emite eventos; `backend/aplicativo.ts` conecta esses eventos aos avisos do Electron. A regressão da bandeja reorganizada passou em **7/7 testes do Electron**, inclusive o encerramento com liberação da trava.

**Manutenção dos testes:** 27 utilizações da opção obsoleta `namedExports` de `mock.module` foram substituídas por `exports` em 10 arquivos existentes. Os **47 testes direcionados** passaram. O aviso de que o mocking de módulos ainda é experimental pertence ao Node e não significa falha de código. Não foram criadas novas pastas, bibliotecas ou estruturas de testes para essa alteração.

A auditoria do Orquestrador local usa especialistas para conferência de assinaturas, imports, scripts e alterações; esse resultado é uma **inspeção estática**, não uma leitura crítica humana de cada função nem execução de modelos de IA desenvolvedores. Por isso as decisões de manter, alterar ou excluir arquivos exigem investigação adicional e testes conforme o risco.

## Limites

- Jira com token com escopos ou OAuth não está implementado.
- A API v1 do Qase não informa a identidade da conta; o projeto é identificado pelo código dentro da conexão.
- O plano gratuito do Qase não permite vincular um caso a um ticket do Jira. Em uma das contas testadas, os campos personalizados dos defeitos também não foram salvos.
- Sem permissão de leitura e escrita em Issues, o GitHub pode criar o chamado sem os rótulos. O Prumo avisa quando isso acontece.
- Status antigos de commit do GitHub não aparecem, só check runs.
