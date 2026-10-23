# Plataforma manual, Jira, Qase e GitHub

Crie o projeto no Prumo antes de conectar serviços. Depois você escolhe quais serviços usar. Para vincular uma pasta de código, veja **Ajuda › Como vincular um projeto**.

## Criar o projeto

Em **Projetos**, a tela mostra um projeto por vez. Use:

- **Novo projeto** (ou **Criar projeto manual**, quando ainda não há nenhum): informe o nome e a descrição. Pasta, serviços e IA são opcionais.
- **Importar**: traz projetos do Jira, Qase ou GitHub, de uma pasta do computador ou de um projeto manual. Cada recurso escolhido vira um projeto Prumo independente, depois que você confirma.
- **Editar**: altera os dados do projeto aberto.

No projeto, **Vincular repositório local…** liga uma pasta de código e **Escolher repositório do GitHub…** liga um repositório. Você pode ficar só com a pasta local.

## O mapa de conexões

O mapa tem o núcleo do projeto e cinco ramos: **Manual / Prumo**, **Jira**, **Qase**, **GitHub** e **Pasta local**. Cada ramo mostra se está vinculado, o identificador de origem e as ações que fazem sentido: **Conectar**, **Verificar**, **Remover**, **Escolher pasta** ou **Trocar pasta**. O mapa só representa os vínculos. Ele não executa testes nem transfere dados entre serviços.

- Clique na bolha do serviço para abrir o painel dele; **Fechar** volta ao mapa. **Contas e permissões** mostra todos os serviços.
- Você pode **arrastar** as bolhas e o núcleo. Os cabos acompanham e a posição fica guardada neste computador, por projeto. Mover nunca desfaz uma conexão: só **Remover** desvincula, e isso não apaga nada no serviço. **Reorganizar**, no topo do painel, devolve tudo ao lugar original. Em tela estreita, a ordem original é mantida.
- Para trocar de projeto, clique no nome dele no topo ou use o seletor de projeto.

Cada ligação de Jira, Qase e GitHub tem dois modos, no próprio painel:

- **Só ver**: o Prumo e os agentes apenas leem a ferramenta.
- **Integrado**: você publica na ferramenta os defeitos e melhorias que abriu, comenta resultados, anexa evidências e muda o status, com os agentes e as funções normais de QA. Cada envio mostra o que vai sair e só acontece com a sua confirmação. No Jira isso inclui criar ticket, editar, comentar, anexar e transicionar.

## Importar

**Importar** pergunta primeiro de onde vem o recurso: Qase, Jira, GitHub, uma pasta ou um projeto manual. Depois de escolher o projeto, o repositório ou a pasta, você decide o destino:

- **Projeto novo**: nasce só com aquela conexão. Nada vem de outros projetos.
- **Projeto que já existe**: o recurso é vinculado a ele. Só aparecem os projetos que ainda não têm aquele serviço.

Uma trilha no topo (por exemplo **Importar › GitHub › Destino**) mostra onde você está e deixa voltar um passo. Reimportar o mesmo recurso devolve o projeto que já existe, sem duplicar. Projetos Qase ambíguos entre contas diferentes são recusados. A importação não cria vínculos cruzados, não executa código e não altera nada nos serviços. O GitHub não é clonado automaticamente.

## Um projeto, um destino

Cada projeto do Jira, cada projeto do Qase, cada repositório do GitHub e cada pasta local fica em um único projeto do Prumo, mesmo que você o veja por duas contas. Assim, agentes e automações nunca têm mais de um destino possível. Na lista de escolha, o que já está em outro projeto aparece como "já está em …" e oferece **Abrir** esse projeto. Para mover um destino, remova o vínculo do projeto atual e vincule no outro. Vínculos repetidos criados em versões anteriores continuam funcionando, mas os agentes avisam e não agem neles até você resolver.

## Conectar um serviço

Em **Projetos**, clique na bolha do serviço e escolha **Conectar**. GitHub e Jira se conectam pelo navegador, igual no Windows, macOS e Linux: o Prumo abre a página do serviço, você autoriza e volta, sem gerar nem colar token. O Qase usa token de API.

- **Jira**: clique em **Conectar com Jira**. A Atlassian abre no navegador, você escolhe os sites que o Prumo pode acessar e volta. Se autorizar mais de um site, o Prumo pergunta qual conectar. O acesso é renovado sozinho, e a escrita no Jira fica desligada até você habilitá-la por projeto. Se a conexão pelo navegador não estiver ativa no seu ambiente, aparece **Prefiro usar um token de API**: clique em **Abrir a Atlassian**, crie o token (Segurança › Criar token de API), cole aqui e clique em **Conectar**. O Prumo tenta descobrir o seu site sozinho (os das suas conexões, o domínio da empresa e o início do seu e-mail) e o próprio Jira confirma. Só se não achar, pede o e-mail da conta Atlassian (pode ser diferente do e-mail do Prumo) e, por último, o nome do site (o que vem antes de `.atlassian.net`). O nome da conexão é gerado sozinho.
- **Qase**: o Qase não autoriza pelo navegador. **1.** Clique em **Abrir o Qase** e crie um token (Perfil › API tokens). **2.** Cole o token e clique em **Ver meus projetos**; depois de verificado, o token some da tela. **3.** Escolha os projetos e clique em **Trazer projetos**. Cada um vira um projeto Prumo independente, sem vínculos por nomes parecidos.
- **GitHub**: clique em **Conectar com GitHub**. O navegador abre o **GitHub App do Prumo QA**; depois de autorizar, o GitHub pergunta em quais repositórios instalar o aplicativo, e o Prumo só enxerga esses. Se o aplicativo ainda não foi instalado, o Prumo avisa e oferece **Escolher repositórios no GitHub**. O acesso expira e é renovado sozinho; ao remover a conexão, o Prumo também pede ao GitHub que revogue a autorização. Se a autorização pelo navegador não estiver disponível, o Windows ainda pode usar o **Git Credential Manager** e, em **Configuração avançada**, um token pessoal.

As credenciais ficam no cofre do sistema e nunca são enviadas à interface do aplicativo. Se o cofre não estiver disponível, o Prumo não registra a conexão. Contas autorizadas podem ser reaproveitadas por vários projetos, mas recursos, vínculos e permissão de escrita pertencem ao projeto ativo. Remover uma credencial compartilhada pode afetar outros projetos.

Para ligar um projeto que já existe no serviço, use **Listar recursos disponíveis** na conta, confira chave, ID e conta e escolha **Vincular**. A lista vem do serviço; o Prumo não escolhe por nomes parecidos. Para trocar o projeto vinculado, remova o vínculo e crie outro. Para trocar o token, remova a conexão e refaça.

## Consultar

- **Tickets**: tickets do Jira, defeitos do Qase, issues do GitHub e rascunhos locais na mesma lista.
- **Testes**: suítes, casos, planos e runs do Qase, testes do repositório e pipelines.

Cada resposta mostra de onde vieram os dados e quando foram consultados. Se houver erro, o Prumo mostra o erro em vez de uma lista vazia. Para ver os critérios de aceite do Jira, escolha o campo em **Descobrir campos**; o Prumo não tenta adivinhar. O resultado de uma execução externa não vale como evidência local.

Em **Testes › Repositório**, você declara um vínculo entre ticket e caso com justificativa. O Prumo confere os dois no serviço antes de registrar, mas um vínculo declarado não comprova cobertura.

## Escrever nos serviços

Por padrão, o Prumo não altera dados nos serviços. Para permitir, habilite a escrita por projeto e serviço em **Habilitar escrita…**:

- **Jira**: criar, comentar, editar, anexar, mudar status e vincular tickets.
- **Qase**: criar casos, suítes, planos, runs e defeitos, publicar resultados e mudar o status de um defeito.
- **GitHub**: criar issues, branches `prumo/…`, gravar arquivos de teste e abrir Pull Request em rascunho.

Antes de enviar, o Prumo mostra uma prévia e pede confirmação do sistema. Depois confere o resultado no serviço e evita criar itens duplicados. O Prumo não apaga dados dos serviços.

## Isolamento e permissões

Cada projeto tem o próprio ID, pasta de contexto, histórico, relações e, no máximo, um vínculo por serviço. Vínculos de outros projetos não são reaproveitados nem associados por semelhança de nomes. Antes de gravar, o backend revalida os recursos externos.

Para ver projetos e recursos é preciso a permissão Projetos VER. Importar, criar e vincular exigem Projetos USAR. A IDE trabalha só com o repositório local ou GitHub do projeto selecionado, e as demais telas usam o ID do projeto selecionado em consultas, execuções, casos, tickets e evidências. Veja também **Ajuda › Acesso, usuários e permissões**.

## Limites

- A API v1 do Qase não informa a identidade da conta; o projeto é identificado pelo código dentro da conexão.
- O plano gratuito do Qase não permite vincular um caso a um ticket do Jira. Em uma das contas testadas, os campos personalizados dos defeitos também não foram salvos.
- Sem permissão de leitura e escrita em Issues, o GitHub pode criar o chamado sem os rótulos. O Prumo avisa quando isso acontece.
- Status antigos de commit do GitHub não aparecem, só check runs.

## Para quem desenvolve o Prumo

A arquitetura, os arquivos e os canais de cada tela ficam em **Administração › Documentação viva**. Edite sempre a fonte da tela (`frontend/<tela>/`, `backend/<tela>/`), nunca os arquivos gerados em `dist/renderer/`. O catálogo da Documentação Viva se atualiza com `npm run documentacao:viva` e no build. Para inspecionar o código alterado, use `npm run auditoria:agentes` (acrescente `-- --todas-as-pastas` para o repositório inteiro). A verificação é estática, não edita arquivos e não substitui testes nem revisão humana. Os relatórios ficam em `.prumo/auditorias/`.
