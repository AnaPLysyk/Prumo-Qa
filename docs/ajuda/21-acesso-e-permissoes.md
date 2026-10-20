# Acesso, usuários e permissões

## Autenticação central com PostgreSQL (em desenvolvimento)

O modelo escolhido para a próxima entrega usa **e-mail e senha** com Better Auth no serviço Node.js do Render e PostgreSQL persistente. O Electron envia as credenciais por HTTPS a partir do processo principal; o login valida o e-mail confirmado e mantém sessão com cookie protegido no Main. O botão **Sair e trocar usuário** revoga a sessão remota, encerra a local e limpa o estado da interface. Em Configurações, **Recuperar acesso** envia um link ao e-mail. GitHub/Google ficam exclusivamente em Conexões nesta fase. Este modo só aparece após configurar `PRUMO_AUTH_API_URL`; o serviço DEV existe no Render, mas o banco e o envio de e-mail ainda não estão configurados; não há homologação E2E real.

## Contas antigas (compatibilidade)

O login local de versões anteriores permanece isolado para **não perder o acesso às contas existentes**. Ele não é o caminho de cadastro do MVP remoto. O fluxo experimental de Supabase por código de seis dígitos foi retirado e não deve ser configurado novamente.

Com o login central configurado, a tela usa apenas **Entrar**, **Criar conta** e **Esqueci a senha** por e-mail e senha. Sem a API central, o perfil isolado de homologação mostra que o serviço ainda não está pronto; não transforma silenciosamente a conta local em conta online.

## Manutenção da tela de Login

As fontes da interface estão todas em `frontend/login/`:

- `entrarNaConta.js` — inicializa a sessão, controla a entrada local legada, permissões e navegação.
- `entradaRemota.js` — mostra os formulários de **login remoto, cadastro e recuperação**; solicita ações ao backend pelo preload.
- `mensagensDeEntrada.js` — converte códigos de erro em mensagens claras, sem mostrar detalhes internos.
- `vitrineDaEntrada.js` e `entrada.css` — apresentação e estilos do cartão de login.
- `web/recuperar-senha.html` e `web/recuperar-senha.js` — página aberta no navegador, sem copiar esses arquivos para o instalador Electron.

A lógica está em `backend/login/`. Os canais IPC ficam em `api/`, as decisões em `regras/`, os modelos em `tipos/`, os dados locais em `banco/` e a conexão externa em `integracoes/`. A autenticação Better Auth, executada no Render, fica em `servidor/`. Para ver como os arquivos se conectam, abra **Administração → Documentação Viva → Login**.

Nunca edite os arquivos compilados em `dist/renderer/`: faça alterações em `frontend/login/` e execute os testes unitários e o build. O teste `testes/unitario/frontend/login/tela-login-modular.test.mjs` confere o fluxo visual básico sem usar contas reais.

## Fluxo legado (versões anteriores)

O Prumo sempre abre na tela de entrada. O **papel** define quais telas de trabalho cada pessoa pode ver ou alterar. A **marca admin** define quem pode abrir a Administração. Ela é para quem cuida do sistema, não para o uso do dia a dia.

## Primeiro acesso

Num computador sem contas, a tela de entrada oferece três caminhos para criar a primeira conta:

- **Criar conta**: informe seu nome, e-mail e senha (pelo menos 10 caracteres, incluindo letras e números). O Prumo envia um código de 6 dígitos para seu e-mail. Digite o código para criar a conta e entrar. Ele vale por 10 minutos. Se não chegar, confira o spam e use **Reenviar código** depois de um minuto.
- **Continuar com GitHub / Google**: autorize sua identidade no navegador. A identidade pública do aplicativo deve ser registrada uma vez pelo mantenedor antes de distribuir; o login nunca pede Client ID, segredo nem token ao usuário. No GitHub, a autorização inclui um código curto digitado no navegador. Repositórios são independentes.

Abaixo do cartão ficam o **idioma** (português ou inglês, já vale na entrada) e **Site e documentação**, que abre o site oficial no navegador. Em janelas estreitas e baixas, a vitrine decorativa é compactada para manter os campos e o rodapé visíveis. Formulários maiores, como o cadastro da primeira conta, permitem rolagem na própria entrada.

A primeira conta recebe a marca admin. Se foi criada por e-mail, você entra com e-mail e senha (ou login curto). Se foi criada pelo GitHub ou Google, entre novamente pelo mesmo provedor.

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
- Cada pessoa troca o próprio nome e a senha em **Minha conta**, no canto da janela. Em **Configurações › Meu perfil** também ficam **Redefinir senha** (pelo e-mail) e **Sair**.
- **Verificação em duas etapas:** em **Minha conta**, ligue para que, depois da senha, um código vá ao seu e-mail a cada entrada. Em **Configurações gerais**, um admin pode exigir isso de todas as contas com e-mail. Contas sem e-mail entram só com a senha. Sem o serviço do Prumo no ar, quem precisa do código não consegue entrar.
- **Esqueci a senha** fica sempre na tela de entrada.

## Entrar com o GitHub ou o Google

O card mostra a versão realmente instalada, mantendo e-mail e senha e as opções Continuar com GitHub e Continuar com Google. O fundo estrelado e as demais telas não mudam.

O login pelo GitHub pede apenas read:user, nunca repo. Não cria conexões com repositórios. Para usá-los, vá a Conexões depois de entrar. O Google pode fornecer e-mail verificado, mas e-mails iguais não vinculam contas automaticamente.

A primeira conta do computador torna-se administradora. Depois, novos cadastros seguem a política existente: com aprovação obrigatória, aguardam; sem ela, entram automaticamente. Em novas instalações, a aprovação padrão vem desligada.

A Administração deve configurar credenciais OAuth válidas em Administração > Configurações gerais uma única vez. Sem essas credenciais, o botão informa que o provedor não está disponível e o login por e-mail continua. Login social não equivale por si só a uma segunda etapa de MFA.

## O que o login não faz

O login controla o que cada pessoa pode ver e alterar **no aplicativo**. O worker (processo que executa as rotinas), a bandeja e o servidor MCP usam a conta do sistema operacional. A confirmação do sistema continua necessária para executar e publicar. Os dados ficam na pasta dessa conta; portanto, o login não separa pessoas que compartilham a mesma conta do computador.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem a marca admin pode ligar ou desligar cada agente, Claude Code, Codex e a orquestração para todos os projetos. Um projeto pode impor mais restrições, mas não pode liberar o que foi desligado aqui.

## Meu perfil

No menu da engrenagem, **Meu perfil** guarda como chamar você, seu papel no time, sua experiência e seu foco (até 160 caracteres). O perfil é da sua conta: outra pessoa que entra neste computador não vê nem usa o seu. Os agentes usam essas informações para adaptar as respostas, e o histórico de atendimentos também é só seu. Claude Code e Codex só recebem esses dados se você marcar **Compartilhar experiência, foco e conta com a IA externa**. Essa opção vem desmarcada; quando compartilhadas, as informações são tratadas como dados, não como instruções.
