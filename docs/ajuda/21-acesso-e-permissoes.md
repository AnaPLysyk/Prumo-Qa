# Acesso, usuários e permissões

O Prumo sempre abre na tela de entrada. O **papel** define quais telas de trabalho cada pessoa vê ou altera. A **marca admin** define quem abre a Administração, que é para quem cuida do sistema e não para o uso diário.

## Autenticação central com PostgreSQL (em desenvolvimento)

Existe um segundo modo de entrada, com **e-mail e senha** pelo Better Auth, no serviço Node.js do Render com PostgreSQL. O Electron envia as credenciais por HTTPS a partir do processo principal. O login exige o e-mail confirmado e mantém a sessão num cookie protegido no Main. **Sair e trocar usuário** revoga a sessão remota, encerra a local e limpa a interface. Em Configurações, **Recuperar acesso** envia um link por e-mail.

Este modo só aparece quando `PRUMO_AUTH_API_URL` está configurada. Sem o serviço pronto, o perfil isolado de homologação avisa e não transforma a conta local em conta online. Com ele, a tela tem só **Entrar**, **Criar conta** e **Esqueci a senha**. A entrada por GitHub ou Google pertence ao Login e é diferente dos tokens que você usa em Projetos para vincular repositórios e outros recursos.

## Contas antigas (compatibilidade)

O login local de versões anteriores continua isolado, para você **não perder o acesso às contas existentes**. Ele não é o caminho de cadastro do modo remoto. O resto desta página descreve esse fluxo local: primeiro acesso, papéis, marca admin e contas. O fluxo experimental de Supabase por código de seis dígitos foi retirado e não deve ser configurado de novo.

## Primeiro acesso

Num computador sem contas, a tela de entrada oferece **Criar conta**, **Continuar com GitHub** e **Continuar com Google**.

- **Criar conta**: informe nome, e-mail e senha (pelo menos 10 caracteres, com letras e números). O Prumo envia um código de 6 dígitos para o seu e-mail; digite-o para criar a conta e entrar. O código vale 10 minutos. Se não chegar, confira o spam e use **Reenviar código** depois de um minuto.
- **GitHub ou Google**: você autoriza no navegador. O login nunca pede Client ID, segredo nem token. No GitHub, a autorização inclui um código curto digitado no navegador.

A primeira conta recebe a marca admin. Se foi criada por e-mail, você entra com e-mail e senha (ou login curto); se foi pelo GitHub ou Google, entre de novo pelo mesmo provedor.

Abaixo do cartão ficam o **idioma** (português ou inglês, já vale na entrada) e **Site e documentação**, que abre o site oficial no navegador. Em janelas estreitas e baixas, a vitrine decorativa encolhe para manter campos e rodapé visíveis; formulários maiores, como o da primeira conta, rolam dentro da entrada.

O envio do código precisa de internet: o e-mail, o código e o idioma vão para o serviço de envio do Prumo, que manda a mensagem. Nada mais sai do computador.

## Entrar com o GitHub ou o Google

O cartão de entrada mostra a versão instalada, mantém e-mail e senha e acrescenta **Continuar com GitHub** e **Continuar com Google**.

- O GitHub pede só `read:user`, nunca `repo`, e não cria conexão com repositórios. Para usá-los, vincule-os depois de entrar, em **Projetos**.
- O Google pode fornecer um e-mail verificado, mas e-mails iguais não unem contas automaticamente.
- Novos cadastros seguem a política de aprovação: com aprovação obrigatória, aguardam; sem ela, entram direto. Em instalações novas, a aprovação vem desligada.
- Login social não equivale a uma segunda etapa de MFA.

A Administração configura as credenciais OAuth uma vez, em **Administração › Configurações gerais**. Sem elas, o botão avisa que o provedor não está disponível e o login por e-mail continua funcionando.

## Papéis

Cada papel tem um nível por tela de trabalho:

- **Sem acesso**: a tela some do menu e o Prumo recusa os pedidos dela.
- **Ver**: consulta sem alterar.
- **Usar**: consulta e altera.

O papel Administrador é fixo e usa todas as telas de trabalho. Crie outros papéis em **Administração › Permissões**, a partir de um papel existente. O Prumo verifica a permissão a cada pedido; esconder um botão não protege a ação.

Depois do login, o Prumo abre o **Início** se a pessoa tem acesso a ele; senão, abre direto a primeira tela autorizada do menu, sem mostrar antes uma tela bloqueada.

## Marca admin

Só contas com a marca admin abrem a **Administração**, que reúne usuários, permissões, agentes da plataforma, configurações gerais e a documentação viva. O papel não muda essa regra: um Administrador sem a marca não entra, e uma conta de papel comum com a marca entra.

- Em **Administração › Usuários**, a coluna **Admin** liga ou tira a marca. Ao criar uma conta, a caixa **Admin: vê a tela Administração** vem desmarcada.
- Ninguém tira a própria marca, e sempre sobra pelo menos uma conta admin ativa.
- Cadastro feito pela tela de entrada nunca recebe a marca.
- Contas criadas antes desta regra com o papel Administrador continuam admin.

## Contas

- Quem tem a marca admin cria contas, aprova cadastros, troca papéis e desativa, desbloqueia ou exclui contas. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma vez; a pessoa cria a própria senha no primeiro acesso.
- Em **Configurações gerais**: cadastro aberto ou não, aprovação, papel dos novos cadastros, tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- **Esqueci a senha** fica sempre na tela de entrada: informe o e-mail da conta, digite o código recebido e crie a senha nova. Se a conta não tem e-mail (criada por um admin ou pelo GitHub/Google), um admin precisa redefinir a senha.
- **Minha conta** abre pela foto no canto superior, com as abas **Perfil**, **Meu perfil** e **Segurança**. Em **Perfil** você altera o nome e a foto. Em **Segurança** você troca a senha, configura a verificação em duas etapas (quando disponível) e redefine a senha pelo e-mail. **Meu perfil** é descrito mais abaixo.
- **Verificação em duas etapas:** ligada em **Minha conta**, manda um código ao seu e-mail a cada entrada, depois da senha. Em **Configurações gerais**, um admin pode exigir isso de todas as contas com e-mail. Contas sem e-mail entram só com a senha. Sem o serviço do Prumo no ar, quem precisa do código não consegue entrar.

## O que o login não faz

O login controla o que cada pessoa vê e altera **no aplicativo**. O worker (processo que executa as rotinas), a bandeja e o servidor MCP usam a conta do sistema operacional, e a confirmação do sistema continua necessária para executar e publicar. Os dados ficam na pasta dessa conta, então o login não separa pessoas que compartilham a mesma conta do computador.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem a marca admin liga ou desliga cada agente (Claude Code, Codex e a orquestração) para todos os projetos. Um projeto pode impor mais restrições, mas não libera o que foi desligado aqui.

## Meu perfil

Em **Minha conta › Meu perfil** você informa como quer ser chamada(o), seu papel no time, sua experiência e seu foco (até 160 caracteres). O Prumo guarda isso na sua conta: outra pessoa que entre neste computador não vê nem usa o seu perfil, e o histórico de atendimentos também é só seu. Os agentes usam essas informações para adaptar as respostas. Claude Code e Codex só as recebem se você marcar **Compartilhar experiência, foco e conta com a IA externa**, opção que vem desmarcada; quando compartilhadas, são tratadas como dados, não como instruções.

## Manutenção da tela de Login

As fontes da interface ficam em `frontend/login/`:

- `entrarNaConta.js`: inicializa a sessão, controla a entrada local legada, as permissões e a navegação.
- `entradaRemota.js`: formulários de login remoto, cadastro e recuperação; pede as ações ao backend pelo preload.
- `mensagensDeEntrada.js`: converte códigos de erro em mensagens claras, sem mostrar detalhes internos.
- `vitrineDaEntrada.js` e `frontend/design-system/estilos-das-telas.parte.css`: apresentação e estilos do cartão.
- `web/recuperar-senha.html`, `web/recuperar-senha.js`, `web/conta-confirmada.html` e `web/confirmacao-recusada.html` (estilo em `frontend/design-system/web/paginas.css`): páginas que os links dos e-mails abrem no navegador, com a aparência da entrada. Não vão para o instalador Electron. Se o link de confirmação venceu, o servidor mostra `confirmacao-recusada.html` em vez de dizer que confirmou.

Os e-mails (confirmação, recuperação e códigos) saem de `backend/login/servidor/modeloDeEmail.mjs`, com versão em texto puro. As cores seguem os tokens do Design System, e `testes/unitario/backend/login/emails-do-prumo.test.mjs` acusa se divergirem.

A lógica fica em `backend/login/`: canais IPC em `api/`, decisões em `regras/`, modelos em `tipos/`, dados locais em `banco/` e conexão externa em `integracoes/`. A autenticação Better Auth, que roda no Render, fica em `servidor/`. Para ver como os arquivos se conectam, abra **Administração › Documentação viva › Login**.

Não edite os arquivos compilados em `dist/renderer/`: altere `frontend/login/` e rode os testes unitários e o build. O teste `testes/unitario/frontend/login/tela-login-modular.test.mjs` confere o fluxo visual básico sem contas reais.

## Homologação do cadastro (sem afetar produção)

- **Fluxo local legado:** o código de 6 dígitos depende de um serviço de e-mail realmente configurado. O erro `EMAIL_SERVICE_NOT_CONFIGURED` indica ausência da chave ou do remetente e não deve ser contornado com código fixo.
- **Cadastro central:** use `PRUMO_AUTH_API_URL=https://prumo-qa-auth-dev.onrender.com` e um diretório de dados isolado (`PRUMO_DATA_DIR` num diretório temporário exclusivo). O fluxo pede nome, e-mail e senha, mostra **Confirme seu e-mail**, oferece **Reenviar e-mail de confirmação**, abre no navegador o link assinado do Better Auth e só deixa entrar depois da verificação. Ele não cria administrador global no serviço público; a liberação administrativa exige um procedimento autorizado à parte.
- **Pré-requisitos para homologar de verdade:** no serviço `prumo-qa-auth-dev` do Render, revisar os comandos de instalação e início e configurar um banco **exclusivo de testes** com as tabelas do Better Auth, a URL HTTPS do serviço, um segredo de pelo menos 32 caracteres, `RESEND_API_KEY` e `PRUMO_EMAIL_REMETENTE` de um domínio verificado. Não compartilhe senhas, URLs internas do banco nem chaves no chat. Testes unitários não provam a entrega real do e-mail.
- **Abrir a homologação:** na raiz do projeto, `npm run app:homologacao`. O comando valida `/saude/autenticacao` do serviço DEV e só então abre o Electron com perfil isolado em `LOCALAPPDATA/PrumoQA-Homologacao-Cadastro`. Se o serviço estiver indisponível ou incompleto, informa o motivo e **não** abre uma tela local de administrador. O título da janela mostra Homologação.
- **Não faça:** substituir a sessão instalada, reaproveitar banco de produção ou liberar cadastro anônimo como Administrador. Para concluir, confirme o recebimento do link, o clique de validação, o login, o logout e a recuperação de senha, usando só contas de teste.
