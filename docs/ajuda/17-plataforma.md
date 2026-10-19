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

Para atualizar o catálogo de canais usado pela Documentação Viva execute `npm run documentacao:viva`. O build também o atualiza automaticamente. Não são gerados arquivos `LEIA-ME` por pasta.

## Limites

- Jira com token com escopos ou OAuth não está implementado.
- A API v1 do Qase não informa a identidade da conta; o projeto é identificado pelo código dentro da conexão.
- O plano gratuito do Qase não permite vincular um caso a um ticket do Jira. Em uma das contas testadas, os campos personalizados dos defeitos também não foram salvos.
- Sem permissão de leitura e escrita em Issues, o GitHub pode criar o chamado sem os rótulos. O Prumo avisa quando isso acontece.
- Status antigos de commit do GitHub não aparecem, só check runs.
