# Plataforma manual, Jira, Qase e GitHub

Crie o projeto no Prumo antes de conectar serviços. Você escolhe depois quais serviços quer usar.

## Criar o projeto

Em **Projetos**:

- **Criar projeto manual**: informe o nome e a descrição. Vincular uma pasta, conectar serviços e usar IA são opções.
 - **Importar projetos do Jira, Qase ou GitHub:** consulte as contas já conectadas, escolha recursos reais e confirme a criação de um espaço Prumo independente por recurso. A importação por token do Qase continua em Projetos > Configurar contas e conexões.

Depois, no projeto, **Vincular repositório local…** liga uma pasta de código e **Escolher repositório do GitHub…** liga um repositório. Dá para ficar só no local.

## O painel de conexões

Cada bolha (Jira, Qase, GitHub, pasta local, Manual) e o núcleo do projeto podem ser **arrastados** para onde você quiser; os cabos acompanham e a posição fica guardada neste computador, por projeto. Mover nunca desfaz uma conexão: só **Remover** desvincula. **Reorganizar** (no topo do painel) devolve tudo ao lugar original. Em tela estreita o painel mantém a ordem original.

Cada ligação de Jira, Qase e GitHub tem dois modos, no próprio painel:
- **Só ver**: o Prumo e os agentes apenas leem a ferramenta.
- **Integrado**: você publica na ferramenta os defeitos e melhorias que abriu, comenta resultados, anexa evidências e muda o status com os agentes e as funções normais de QA. Cada envio mostra o que vai sair e só acontece com a sua confirmação. No Jira isso inclui criar ticket, editar, comentar, anexar e transicionar.

## Importar sem confusão

**Importar** pergunta primeiro **de onde vem**: Qase, Jira, GitHub, uma pasta do computador ou um projeto manual. Depois de escolher o projeto, o repositório ou a pasta, você decide onde ele entra:
- **Projeto novo**: nasce só com aquela conexão. Nada vem de outros projetos; o resto você conecta depois, do jeito normal.
- **Projeto que já existe**: o recurso é vinculado a esse projeto. Só aparecem para vincular os projetos que ainda não têm aquele serviço.

Uma trilha no topo (por exemplo **Importar › GitHub › Destino**) mostra onde você está e deixa voltar um passo. No núcleo do painel não há mais "Trocar projeto": para trocar, use o seletor de projeto do topo.

## Um projeto, um destino

Cada projeto do Jira, cada projeto do Qase, cada repositório do GitHub e cada pasta local fica em **um único** projeto do Prumo, mesmo que você o enxergue por duas contas. Isso evita que os agentes e as automações tenham mais de um destino possível. Na lista de escolha, o que já está em outro projeto aparece marcado ("já está em …") e oferece **Abrir** esse projeto em vez de vincular de novo. Para mover um destino, remova o vínculo do projeto atual e vincule no outro. Vínculos repetidos de versões anteriores continuam funcionando, mas os agentes avisam e não agem neles até você resolver.

## Conectar um serviço

Em **Projetos**, clique na bolha do serviço e escolha **Conectar**. **GitHub** e **Jira** se conectam pelo navegador, igual em Windows, macOS e Linux: o Prumo abre a página do serviço, você autoriza e volta, sem gerar nem colar token. O **Qase** ainda usa token de API:

- **Jira**: clique em **Conectar com Jira**. O navegador abre a página da Atlassian; você escolhe os sites que o Prumo pode acessar e volta. Com mais de um site autorizado, o Prumo pergunta qual conectar. O acesso é renovado sozinho. A escrita no Jira continua desligada até você habilitá-la por projeto. Se a conexão pelo navegador ainda não estiver ativa no seu ambiente, o Prumo mostra direto **Prefiro usar um token de API**: clique em **Abrir a Atlassian**, crie o token (Segurança › Criar token de API), cole aqui e clique em **Conectar**. O Prumo **descobre o seu site Jira sozinho**: testa os sites prováveis (os das suas conexões, o domínio da sua empresa e o início do seu e-mail) e o próprio Jira confirma. Só se não achar ele pede o e-mail da sua conta Atlassian (que pode ser diferente do e-mail do Prumo) e, em último caso, o nome do site (o que vem antes de `.atlassian.net`). O nome da conexão é gerado sozinho.
- **Qase**: o Qase não oferece autorização pelo navegador, então são três passos curtos: **1** clique em **Abrir o Qase** e crie um token (Perfil › API tokens); **2** cole o token e clique em **Ver meus projetos** (depois de verificado, o token some da tela); **3** escolha quais projetos vêm para o Prumo e clique em **Trazer projetos**. Cada projeto vira um projeto Prumo independente, sem vínculos por nomes coincidentes.
- **GitHub (recomendado)**: clique em **Conectar com GitHub**. O navegador abre a página do **GitHub App do Prumo QA**; depois de autorizar, o GitHub pede em **quais repositórios** instalar o aplicativo: o Prumo só enxerga esses. Se você ainda não instalou o aplicativo, o Prumo avisa e oferece **Escolher repositórios no GitHub**. O acesso expira e é renovado sozinho; ao remover a conexão, o Prumo também pede ao GitHub que revogue a autorização. Se a autorização pelo navegador não estiver disponível, o Windows ainda pode usar o **Git Credential Manager** e, em **Configuração avançada**, um token pessoal.

As credenciais de integração ficam protegidas no cofre do sistema e nunca são enviadas à interface do aplicativo. Se esse cofre não estiver disponível, o Prumo não registra a conexão.

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

Para atualizar o catálogo de canais usado pela Documentação Viva execute `npm run documentacao:viva`. O build também o atualiza automaticamente. Não são gerados arquivos `LEIA-ME` por pasta. O login do MVP usa somente o módulo remoto Better Auth/PostgreSQL; o fluxo local anterior continua disponível apenas para compatibilidade. Os bundles atuais no `dist/renderer/` são derivados do manifesto `frontend/construcao/telas-modulares.json` e não devem ser editados.

## Manutenção da tela Projetos

Abra a Documentação Viva antes de editar. A lógica de Projetos permanece em `frontend/projetos/tela-projetos.js`; toda a apresentação e os componentes visuais ficam em `frontend/design-system/`:

- `tela-projetos.js`: reúne a navegação, o formulário de cadastro, a seleção do repositório GitHub, a apresentação de vínculos, a lista de pastas locais e os diagnósticos. Dentro do arquivo, os blocos têm comentários de responsabilidade e funções com nomes descritivos.

A lista de pastas e seu diagnóstico não ficam mais no arquivo compartilhado `frontend/compartilhado/runtime/app.js`: todo o comportamento visual de Projetos agora está em `frontend/projetos/`.

O backend da tela fica em `backend/projetos/`: `controlador.ts` define os canais, `servicoProjetos.ts` gerencia os espaços e o vínculo inicial, `banco/projetos.ts` persiste, e `contratos.ts` valida as identidades. A autenticação e a validação dos recursos externos pertencem a `backend/conexoes/`.

Para modificar a tela, altere sempre os arquivos de `frontend/projetos/`, nunca as cópias compiladas em `dist/renderer/`. O teste `testes/unitario/frontend/projetos/tela-projetos-modular.test.mjs` confere a montagem, a ordem de carregamento, a edição e os vínculos sem chamar serviços externos. Execute-o antes da suíte de testes completa.

## Manutenção da tela Tickets

A tela de Tickets fica em um único arquivo: `frontend/tickets/tela-tickets.parte.js`. Dentro dele, as funções de listagem, rascunhos locais, operações do Jira, defeitos Qase e Issues GitHub continuam identificadas pelo nome e agrupadas por fluxo, mas não ficam espalhadas em arquivos distintos.

O manifesto `frontend/construcao/telas-modulares.json` inclui a fonte única de Tickets em `dist/renderer/fluxos.js`. **Edite a fonte da tela, nunca o bundle gerado.**

As regras de Tickets ficam em `backend/tickets/`: `api/` são canais IPC, `banco/` é persistência local, `regras/` organiza a criação, revisão e publicação, `integracoes/` executa chamadas autorizadas ao Jira e `tipos/` define os contratos. O login nas plataformas externas pertence à área de conexões em Projetos e não deve ser implementado novamente em Tickets.

Para conferir a separação sem publicar nada, execute `node --test testes/unitario/frontend/tickets/modulos-tickets.test.mjs testes/unitario/frontend/tickets/fonte-jira-ou-local.test.mjs`, depois o build e a suíte unitária. Operações reais de escrita em Jira/Qase/GitHub ainda exigem homologação manual com permissão e confirmação explícitas.

## Manutenção das conexões dentro de Projetos

As contas de Jira, Qase e GitHub não fazem login no Prumo; o login do aplicativo pertence exclusivamente ao módulo Login. As contas autorizadas para integrações são gerenciadas em **Projetos > bolha do serviço > Contas e permissões**. Para começar sem nenhum projeto, use **Projetos > Criar projeto manual** ou **Importar do Qase/Jira/GitHub**.

O formulário de credenciais, o botão de autorização do GitHub, a prévia e importação de projetos Qase, a validação de contas, a habilitação de escrita e o histórico de operações estão em frontend/projetos/tela-projetos.js. O Device Flow fica em backend/conexoes/integracoes/autorizacaoGitHub.ts e os canais respectivos são registrados no controlador de Conexões. O mapa visual e os estilos pertencem ao Design System. A configuração MCP de Claude Code e Codex permanece em frontend/agentes/mostrarConfiguracaoMcp.js e requer selecionar o projeto correspondente.

Contas autorizadas são compartilháveis, mas vincular Jira, Qase e GitHub, habilitar escrita ou consultar informações é por projeto. A exclusão de uma credencial compartilhada pode afetar outros projetos. No backend, backend/conexoes/ preserva o cofre e as chamadas autenticadas; backend/projetos/ armazena os vínculos.

Validação dos formulários: testes/unitario/frontend/projetos/campos-por-servico.test.mjs e arquitetura-da-tela.test.mjs. A homologação visual em Electron e a validação de contas externas reais são etapas distintas.

## Manutenção da tela Agentes

A tela de agentes está em `frontend/agentes/`, não no runtime compartilhado. Cada fluxo possui uma fonte principal fácil de localizar:

- `tela-agentes.parte.js`: reúne cadastro, seleção, permissões, cérebro visual e orquestrações, com funções e comentários de responsabilidade.
- `frontend/design-system/painel-atividades.js`: reúne modelo, posições calculadas, canvas, navegação e atualização das atividades. Mantém leitura de dados separada do desenho, dentro do mesmo arquivo.
- `mostrarConfiguracaoMcp.js`: orientação e teste das conexões MCP de Claude Code e Codex, exibido também por Projetos quando este projeto está selecionado.

Os fragmentos do bundle são concatenados exatamente na ordem indicada em `frontend/construcao/telas-modulares.json`; não edite diretamente `dist/renderer/interfaces.js`. As permissões e a execução ficam no backend em `backend/agentes/`.

A separação em arquivos não constitui homologação manual do painel, nem prova de conexão com IA externa. Primeiro confira a tela em um perfil de homologação, depois avalie as APIs de IA/MCP conforme as permissões de cada agente.

## Manutenção de Agendamentos e Testes › Runs

A tela `frontend/agendamentos/tela-agendamentos.js` registra `abas.agenda` e reúne a lista de rotinas, o cálculo de horários do formulário, os campos, a edição, as autorizações e as políticas do worker. Os arquivos `mostrarAgendamentos.js` e `cartoes/montarCartaoRotina.js` eram implementações antigas substituídas pela tela nova e foram retirados.

`frontend/testes/execucoes-e-evidencias.js` contém os detalhes de Runs, logs e evidências locais, além de `abas.evidencias` e da API de interface `window.PrumoOperacao`. A ordem de carga depende de `frontend/recursos.json` e `frontend/compartilhado/runtime/index.html`. As operações de execução permanecem no backend; nenhuma chamada de escrita externa foi alterada nesta divisão.

## Manutenção da tela Métricas

A versão ativa está em `frontend/metricas/tela-metricas.parte.js`, montada no bundle `interfaces.js`. A implementação antiga `mostrarMetricas.js` e seu auxiliar `componentes/montarVisuaisMetricas.js` eram carregados antes da versão v36 e depois substituídos. Ambos foram retirados do frontend e do carregamento para evitar duas fontes concorrentes da mesma tela.

## Manutenção da tela Logs

O terminal visual mantém a responsabilidade na pasta `frontend/logs/`: `tela-logs.parte.js` monta a interface e os botões; `eventos-e-detalhes.parte.js` prepara as linhas e a inspeção de eventos; `filtros-e-atualizacao.parte.js` filtra, consulta o backend e controla a atualização automática. As três partes são montadas nesta ordem no `interfaces.js` pelo manifesto `frontend/construcao/telas-modulares.json`.

As consultas e a exportação continuam em `backend/logs/api`, com regras de processamento em `backend/logs/regras` e persistência em `backend/logs/banco`. A modularização não altera os eventos, o intervalo de atualização nem a comunicação IPC. Ainda é necessária homologação visual real, incluindo navegação, seguir saída, filtros e exportação.

## Manutenção da Administração

Administração possui uma fonte principal: `frontend/administracao/tela-administracao.parte.js`, que reúne navegação, documentação viva, usuários, papéis, agentes, configurações gerais e gestão de chamados de suporte. Os fluxos permanecem identificáveis por função, sem exigir abrir arquivos auxiliares da mesma tela. O estilo local está em `frontend/design-system/estilos-das-telas.parte.css` e reutiliza os tokens do Design System.

O build gera `dist/renderer/administracao.js`. As regras de autorização e de persistência continuam em `backend/administracao/`, sem duplicá-las no front-end.

## Manutenção de Configurações

O painel de Configurações em `frontend/configuracoes/` tem quatro partes no bundle `interfaces.js`: `ajustes-do-assistente.parte.js` prepara o estado e os controles compartilhados, `perfil-e-conta.parte.js` apresenta e salva dados de perfil, `aparencia-e-assistente.parte.js` cuida de aparência, voz e IA externa e `navegacao-dos-ajustes.parte.js` controla as abas e a atualização das informações. `preferenciasDaJanela.js` mantém tema, idioma e cor. A navegação, o menu lateral e o seletor de projeto ficam em `frontend/compartilhado/navegacaoDaJanela.js`.

Os fragmentos preservam o código anterior na mesma ordem; a persistência e a autorização permanecem nas APIs já existentes. A homologação manual do painel e as permissões de usuário ainda precisam ser conferidas na aplicação real.

## Manutenção da tela Início

A única implementação da tela Início fica em `frontend/inicio/tela-inicio-v36.parte.js` e usa `conversa.montar()`. A antiga `frontend/inicio/mostrarInicio.js`, carregada antes e sobrescrita pelo bundle, foi retirada. `frontend/design-system/qc.js` continua necessário aos retratos, esfera e estados visuais do assistente; `frontend/design-system/orbitas.js` e `frontend/design-system/robos.js` também permanecem com seus usos próprios.

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


## Isolamento das origens

## Origem e isolamento dos projetos

**Projetos** é o cadastro central do Prumo QA. Cada projeto tem seu próprio ID, pasta de contexto, histórico, relações, repositório local opcional e até um vínculo por serviço. Os vínculos de outros projetos não são reutilizados nem associados por semelhança de nomes.

- **Criar projeto manual:** cria um espaço Prumo sem conexões externas.
- **Importar projetos do Jira:** escolhe uma conta conectada, consulta os projetos disponíveis e cria um espaço por projeto escolhido.
- **Importar projetos do Qase (TMS):** permite escolher projetos de uma conta já vinculada; o fluxo de prévia e token em Conexões continua disponível.
- **Importar projetos do GitHub:** escolhe um repositório remoto e cria seu espaço Prumo, sem clonagem automática.
- **Vincular Jira ou Qase a um projeto existente:** acrescenta somente o serviço selecionado ao espaço escolhido. O repositório GitHub ou a pasta local também podem ser vinculados explicitamente.

A criação/importação exige confirmação na janela nativa do aplicativo; os recursos externos são revalidados no backend antes de serem persistidos. Uma reimportação da mesma identidade remota retorna o projeto existente, sem criar duplicata. Projetos Qase ambíguos entre contas distintas são recusados. A importação não cria vínculos Jira/Qase/GitHub cruzados, não executa código nem publica ou altera recursos remotos.

**Permissões:** leitura de projetos e seus recursos exige Projetos VER; importação, criação e novos vínculos exigem Projetos USAR. Credenciais são administradas em Projetos > bolha do serviço > Contas e permissões. A IDE trabalha somente com o repositório local ou GitHub associado ao projeto selecionado. Cada tela deve utilizar o ID do projeto selecionado para escopar todas as consultas, execuções, casos, tickets e evidências.

**Manutenção:** alterações de comportamento de Projetos em `frontend/projetos/tela-projetos.js`; identidade, contratos, persistência e vínculo inicial em `backend/projetos/controlador.ts`, `servicoProjetos.ts`, `contratos.ts` e `banco/projetos.ts`. Validação das contas e APIs externas pertence a `backend/conexoes/`. Os controles e toda a aparência da interface continuam centralizados em `frontend/design-system/`, inclusive os botões e campos compartilhados.

## Mapa visual de conexões por projeto

A tela **Projetos** apresenta **somente um projeto por vez**, sem rolagem da bancada nem mapas empilhados. No estado inicial vazio, é possível criar manualmente ou importar do Qase, Jira ou GitHub. O nome no topo e a bolha central permitem trocar entre os projetos cadastrados. O mapa tem um núcleo Prumo QA e cinco ramificações independentes:

- **Manual / Prumo:** casos, tickets e propostas mantidos no próprio Prumo, sem fornecedor obrigatório.
- **Jira:** projeto externo de gestão/requisitos. Mostra a chave efetivamente vinculada e o estado de validação.
- **Qase:** projeto externo de casos e gestão de qualidade. Mostra a identidade específica da conta vinculada.
- **GitHub:** repositório de código. Mostra o repositório escolhido e oferece trazer a cópia para o computador quando ainda não há pasta local.
- **Pasta local:** diretório vinculado para a IDE e automações. Pode ser escolhido ou trocado pela confirmação nativa.

Cada ramificação exibe a condição real **vinculado/não vinculado**, o identificador de origem e comandos adequados: **Conectar**, **Verificar**, **Remover**, **Escolher pasta** ou **Trocar pasta**. O desenho não pressupõe equivalência entre projetos de serviços diferentes e não cria vínculos apenas pelo nome. **Conectar** abre a lista real da conta e exige confirmação antes de persistir. **Remover** usa o contrato existente e não exclui dados remotos. A configuração, a lista de recursos e os dados técnicos aparecem somente no painel da bolha correspondente, com a ação **Fechar**.

O mapa é só uma **representação dos vínculos**: não é o orquestrador de testes, não executa pipelines e não transfere dados entre fornecedores. O isolamento continua garantido por ID de projeto e por ID da conta/recurso. Alterar os vínculos de um projeto só reflete naquele projeto, inclusive ao abrir a IDE e os fluxos de Testes/Tickets.

**Para fazer manutenção:** a regra de cada botão, a seleção de conta, os IDs e o estado do projeto ficam em `frontend/projetos/tela-projetos.js`. O componente visual reutilizável `DS.fluxoProjeto` fica em `frontend/design-system/ds.js`, e **todos** os seus estilos, linhas, estados, tamanhos e comportamento responsivo ficam em `frontend/design-system/ds.css`. Não crie outro componente por fornecedor, nem folha de estilo na pasta da tela. O seletor GitHub usa o mesmo fluxo de importação de Jira/Qase, com uma opção extra de clonagem local.

**Editor de conexões:** o desenho usa portas circulares e cabos SVG calculados pelas posições reais dos módulos. Apenas o projeto interno (Manual) e os serviços efetivamente vinculados têm cabo; serviços desconectados têm portas livres. Clicar na porta livre abre a escolha da conta, recurso ou pasta; clicar numa porta vinculada permite conferir ou trocar a pasta, conforme o serviço. O cabo não simula sincronização, execução nem associação cruzada. A conexão acontece ao escolher um recurso real e confirmar no backend. Em janelas estreitas, a bancada reorganiza os módulos sem esconder as ações. Todas as regras visuais continuam no Design System, sem novos arquivos.

## Conexões dentro de cada projeto

A antiga tela independente **Conexões** foi incorporada à bancada **Projetos**. Clique na bolha do serviço para abrir um painel sobreposto e depois em **Fechar** para retornar ao mapa. O botão **Contas e permissões** permite ver todos os serviços. Credenciais autorizadas podem ser reutilizadas, mas recursos, vínculos e permissão de escrita pertencem ao projeto ativo. Remover uma credencial compartilhada pode afetar outros projetos; remover um vínculo não altera o serviço externo.

Sem nenhum projeto, escolha **Criar projeto manual** ou **Importar do Qase/Jira/GitHub**. A importação do Qase pode começar pela autorização do token, mostrar os projetos existentes e importar apenas os selecionados. A importação cria projetos independentes; conectar outra plataforma depois, dentro da bolha de um projeto, acrescenta somente o recurso autorizado àquele projeto.

O seletor lateral troca o ID do projeto ativo, atualiza o nome e renova o conteúdo dos módulos pela navegação comum. No menu, as legendas de Tickets e Testes mostram as fontes habilitadas para o projeto atual. Funcionalidades manuais continuam disponíveis independentemente das conexões. O contexto visual do menu fica em frontend/compartilhado/navegacaoDaJanela.js; sua aparência em frontend/design-system/ds.css. Credenciais e validações de API permanecem no backend de conexões por segurança.
