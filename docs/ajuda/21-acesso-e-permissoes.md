# Acesso, usuários e permissões

O Prumo sempre abre na tela de entrada. O **papel** define quais telas de trabalho cada pessoa pode ver ou alterar. A **marca admin** define quem pode abrir a Administração. Ela é para quem cuida do sistema, não para o uso do dia a dia.

## Primeiro acesso

Num computador sem contas, a tela de entrada oferece três caminhos para criar a primeira conta:

- **Criar conta**: informe seu nome, e-mail e senha (pelo menos 10 caracteres, incluindo letras e números). O Prumo envia um código de 6 dígitos para seu e-mail. Digite o código para criar a conta e entrar. Ele vale por 10 minutos. Se não chegar, confira o spam e use **Reenviar código** depois de um minuto.
- **Criar conta com o GitHub** ou **Criar conta com o Google**: o Prumo abre o navegador, você autoriza e volta já dentro. Se o provedor ainda não estiver configurado neste computador, a entrada pede o **Client ID** e o **Client Secret** uma vez (como criar: seção **Entrar com o GitHub ou o Google**, abaixo).

Abaixo do cartão ficam o **idioma** (português ou inglês, já vale na entrada) e **Site e documentação**, que abre o site oficial no navegador.

A primeira conta recebe a marca admin. Depois, entre com seu e-mail e senha. Você também pode usar o login curto: a parte do e-mail antes de `@`.

O envio do código precisa de internet: o e-mail, o código e o idioma vão para o serviço de envio do Prumo, que manda a mensagem. Nada mais sai do computador.

## Papéis

Cada papel tem um nível por tela de trabalho:

- **Sem acesso**: a tela some do menu e o Prumo recusa os pedidos dela.
- **Ver**: consulta sem alterar.
- **Usar**: consulta e altera.

O papel Administrador é fixo e pode usar todas as telas de trabalho. Crie outros papéis em **Administração › Permissões**, começando de um papel existente. O Prumo verifica a permissão a cada pedido; esconder um botão não protege a ação.

## Marca admin

Só contas com a marca admin podem abrir **Administração**, que reúne usuários, permissões, agentes da plataforma, configurações gerais e documentação viva. O papel não muda essa regra: um Administrador sem a marca não entra, mas uma conta com papel comum e a marca pode entrar.

- Em **Administração › Usuários**, a coluna **Admin** liga ou tira a marca. Ao criar uma conta, a caixa **Admin: vê a tela Administração** vem desmarcada.
- Ninguém tira a própria marca, e sempre sobra pelo menos uma conta admin ativa.
- Cadastro pela tela de entrada nunca recebe a marca.
- Contas criadas antes desta regra com o papel Administrador continuam admin.

## Contas

- Quem tem a marca admin pode criar contas, aprovar cadastros, trocar papéis, desativar, desbloquear ou excluir contas. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma vez. A pessoa cria a própria senha ao entrar pela primeira vez.
- Em **Configurações gerais**: cadastro aberto ou não, aprovação, papel dos novos cadastros, tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- Para trocar uma senha esquecida, escolha **Esqueci a senha**, informe o e-mail da conta, digite o código recebido e crie uma senha nova. Se a conta não tiver e-mail (por exemplo, se foi criada por um admin ou pelo GitHub/Google), um admin precisa redefinir a senha.
- Cada pessoa troca o próprio nome e a senha em **Minha conta**, no canto da janela.

## Entrar com o GitHub ou o Google

Depois de configurar um provedor, aparecem **Entrar com o GitHub** e **Entrar com o Google**. O Prumo abre o navegador para você autorizar e depois volta ao aplicativo.

- Conta ativa: entra direto. O GitHub também cria uma conexão somente para leitura. O token inclui o escopo `repo`, mas o Prumo só escreve depois que você habilita a escrita e confirma. O Google serve apenas para identificar você.
- Pessoa nova: a conta fica **pendente** e usa o papel definido para novos cadastros até um admin aprová-la.
- A conta é reconhecida pelo número do provedor, não pelo nome nem pelo e-mail.
- Cancelar, negar ou esperar 5 minutos não cria nada.

Para configurar um provedor, abra **Administração › Configurações gerais**. No GitHub, crie um OAuth App com o endereço de retorno `http://127.0.0.1/callback`. No Google Cloud Console, crie uma credencial OAuth do tipo **Aplicativo para computador**. Informe o Client ID e o Client Secret; o segredo fica protegido no cofre do sistema e não é mostrado novamente.

## O que o login não faz

O login controla o que cada pessoa pode ver e alterar **no aplicativo**. O worker (processo que executa as rotinas), a bandeja e o servidor MCP usam a conta do sistema operacional. A confirmação do sistema continua necessária para executar e publicar. Os dados ficam na pasta dessa conta; portanto, o login não separa pessoas que compartilham a mesma conta do computador.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem a marca admin pode ligar ou desligar cada agente, Claude Code, Codex e a orquestração para todos os projetos. Um projeto pode impor mais restrições, mas não pode liberar o que foi desligado aqui.

## Meu perfil

No menu da engrenagem, **Meu perfil** guarda como chamar você, seu papel no time, sua experiência e seu foco (até 160 caracteres). Os agentes usam essas informações neste computador para adaptar as respostas. Claude Code e Codex só recebem esses dados se você marcar **Compartilhar experiência, foco e conta com a IA externa**. Essa opção vem desmarcada; quando compartilhadas, as informações são tratadas como dados, não como instruções.
