# Acesso, usuários e permissões

O Prumo abre sempre na tela de entrada. Cada pessoa tem uma conta e um papel; quem administra o computador controla quem entra e o que cada um vê.

## Primeiro acesso

Num computador sem contas, a entrada traz **Criar conta**, que cria a conta de **Administrador**, sempre a primeira. Informe nome, usuário (3 a 40 caracteres: minúsculas, números, ponto, hífen ou sublinhado) e senha (mínimo de 10 caracteres, com letras e números). Com o GitHub ou o Google já configurado, **Criar conta com o GitHub** (ou **com o Google**) faz o mesmo pela autorização do provedor.

Guarde o **código de recuperação**: ele aparece uma só vez, e deve ficar fora deste computador. Até a conta existir, nenhuma tela abre.

## Papéis e permissões

Cada pessoa tem um **papel**, e cada papel tem um nível por tela: **Sem acesso** (a tela some do menu e o backend recusa os pedidos dela), **Ver** (consulta sem alterar) ou **Usar** (consulta e altera). O papel Administrador é fixo; você cria os outros em **Administração › Permissões**, começando de um papel existente.

A conferência é feita no processo principal a cada pedido, não só na janela: esconder um botão não é a autorização.

## Contas

- O administrador cria contas, aprova cadastros, troca o papel, desativa, desbloqueia e exclui. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma única vez; a pessoa define a própria senha no primeiro acesso.
- Em **Configurações gerais** você decide se o cadastro pela tela de entrada fica aberto, se precisa de aprovação, qual papel os novos cadastros recebem, o tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- Quem esquece a senha usa o código de recuperação; sem ele, a Administração redefine a senha.
- O último administrador não pode ser excluído nem rebaixado, e ninguém vira administrador pelo cadastro.
- Cada pessoa pode trocar o próprio nome e a senha em **Minha conta**, no canto da janela.

## Entrar com o GitHub ou o Google

Com o provedor configurado, a entrada e a criação de conta ganham **Entrar com o GitHub** e **Entrar com o Google**. O Prumo abre o navegador; você autoriza e volta já autenticado.

- Conta ativa: entra direto. Com o GitHub, a conexão do GitHub é criada junto (só leitura; a escrita segue desligada). O token tem, tecnicamente, permissão de escrita (escopo `repo`); o Prumo só a usa depois que você habilita a escrita e confirma. O Google só identifica e não cria conexão.
- Pessoa nova: o cadastro fica **pendente**, com o papel de novos cadastros, e nada é habilitado até a Administração aprovar. Depois, é só entrar de novo.
- A conta é reconhecida pelo número do provedor, não pelo nome nem pelo e-mail, e não tem senha do Prumo.
- Cancelar, negar ou esperar 5 minutos não cria conta, sessão nem conexão.

Para configurar, em **Administração › Configurações gerais**: no GitHub, registre um OAuth App com a callback `http://127.0.0.1/callback`; no Google Cloud Console, crie uma credencial OAuth do tipo **Aplicativo para computador**. Cole o Client ID e o Client Secret na seção do provedor. O segredo fica no cofre do sistema e nunca volta para a tela. O GitHub pede `read:user repo` (para listar repositórios privados); o Google, `openid email profile`.

## O que o login não faz

O login controla o que cada pessoa vê e altera **no aplicativo**. O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta do Windows deste computador, e a confirmação nativa do Windows para executar e publicar continua obrigatória. Os dados de projetos e integrações continuam locais por conta do Windows: o login não isola pessoas que usam a mesma conta do Windows.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem permissão liga ou desliga cada agente para todos os projetos, o uso de Claude Code ou Codex e a orquestração. Essas regras valem para todos os projetos: um projeto pode restringir mais, mas não liberar o que está desligado aqui.

## Meu perfil (Configurações)

Na engrenagem, a aba **Meu perfil** guarda como o Prumo deve chamar você, seu papel no time, sua experiência (iniciante, intermediária ou avançada) e seu foco de trabalho (até 160 caracteres). Os agentes do Prumo usam esses dados neste computador para cumprimentar, ajustar o nível das explicações e priorizar o seu foco. Claude Code e Codex só recebem experiência, foco e o papel da sua conta se você marcar **Compartilhar experiência, foco e conta com a IA externa** (vem desmarcado); mesmo assim, chegam como dados, nunca como instrução. **Minha conta** (troca de nome e senha) fica no mesmo painel e no canto da janela.
