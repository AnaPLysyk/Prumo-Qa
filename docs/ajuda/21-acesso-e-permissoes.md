# Acesso, usuários e permissões

O Prumo abre sempre na tela de entrada. Eu separei duas coisas: o **papel** diz quais telas de trabalho cada pessoa vê e altera; a **marca admin** diz quem entra na Administração. A marca é para quem cuida do sistema, não para o uso do dia a dia.

## Primeiro acesso

Num computador sem contas, a entrada mostra **Criar conta de Administrador**. Informe nome, usuário (3 a 40 caracteres: minúsculas, números, ponto, hífen ou sublinhado) e senha (mínimo de 10 caracteres, com letras e números). Com o GitHub ou o Google configurado, **Criar conta com o GitHub** (ou **com o Google**) faz o mesmo pela autorização do provedor.

Essa primeira conta já nasce com a marca admin. Guarde o **código de recuperação**: ele aparece uma vez só e deve ficar fora deste computador.

## Papéis

Cada papel tem um nível por tela de trabalho:

- **Sem acesso**: a tela some do menu e o Prumo recusa os pedidos dela.
- **Ver**: consulta sem alterar.
- **Usar**: consulta e altera.

O papel Administrador é fixo e usa todas as telas de trabalho. Os outros você cria em **Administração › Permissões**, começando de um papel existente. A conferência acontece a cada pedido, no processo principal; esconder um botão não é a autorização.

## Marca admin

Só contas com a marca admin veem a tela **Administração** (usuários, permissões, agentes da plataforma, configurações gerais, documentação viva). O papel não muda isso: um papel Administrador sem a marca não entra lá, e um papel comum com a marca entra.

- Em **Administração › Usuários**, a coluna **Admin** liga ou tira a marca. Ao criar uma conta, a caixa **Admin: vê a tela Administração** vem desmarcada.
- Ninguém tira a própria marca, e sempre sobra pelo menos uma conta admin ativa.
- Cadastro pela tela de entrada nunca recebe a marca.
- Contas criadas antes desta regra com o papel Administrador continuam admin.

## Contas

- Quem é admin cria contas, aprova cadastros, troca o papel, desativa, desbloqueia e exclui. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma vez; a pessoa define a própria no primeiro acesso.
- Em **Configurações gerais**: cadastro aberto ou não, aprovação, papel dos novos cadastros, tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- Esqueceu a senha: use o código de recuperação; sem ele, um admin redefine.
- Cada pessoa troca o próprio nome e a senha em **Minha conta**, no canto da janela.

## Entrar com o GitHub ou o Google

Com o provedor configurado, aparecem **Entrar com o GitHub** e **Entrar com o Google**. O Prumo abre o navegador; você autoriza e volta autenticado.

- Conta ativa: entra direto. Pelo GitHub, a conexão do GitHub é criada junto, só leitura. O token tem escopo `repo`, mas o Prumo só escreve depois que você habilita a escrita e confirma. O Google só identifica.
- Pessoa nova: o cadastro fica **pendente**, com o papel de novos cadastros, até um admin aprovar.
- A conta é reconhecida pelo número do provedor, não pelo nome nem pelo e-mail.
- Cancelar, negar ou esperar 5 minutos não cria nada.

Para configurar, em **Administração › Configurações gerais**: no GitHub, um OAuth App com a callback `http://127.0.0.1/callback`; no Google Cloud Console, uma credencial OAuth do tipo **Aplicativo para computador**. Cole Client ID e Client Secret; o segredo fica no cofre do sistema e nunca volta para a tela.

## O que o login não faz

O login controla o que cada pessoa vê e altera **no aplicativo**. O worker de agendamentos, a bandeja e o servidor MCP rodam com o usuário do sistema operacional, e a confirmação do sistema para executar e publicar continua obrigatória. Os dados ficam na pasta desse usuário: o login não isola pessoas que usam o mesmo usuário do computador.

## Agentes da plataforma

Em **Administração › Agentes**, quem é admin liga ou desliga cada agente, o uso de Claude Code ou Codex e a orquestração, para todos os projetos. Um projeto pode restringir mais, nunca liberar o que está desligado aqui.

## Meu perfil

Na engrenagem, **Meu perfil** guarda como chamar você, seu papel no time, sua experiência e seu foco (até 160 caracteres). Os agentes usam isso neste computador para ajustar as respostas. Claude Code e Codex só recebem esses dados se você marcar **Compartilhar experiência, foco e conta com a IA externa** (vem desmarcado), e mesmo assim como dado, nunca como instrução.
