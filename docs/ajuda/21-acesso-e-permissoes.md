# Acesso, usuários e permissões

O Prumo **abre sempre na tela de entrada** e não deixa usar nada sem entrar. Cada pessoa tem a sua conta e o seu papel; quem administra o computador controla quem entra e o que cada um vê.

## Primeiro acesso

Na primeira vez que o Prumo abre num computador, ainda não existe nenhuma conta. A tela pede para criar a conta de **Administrador**, que é sempre a primeira:

1. Informe nome, usuário (3 a 40 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado) e uma senha com pelo menos 10 caracteres, misturando letras e números. Se o GitHub ou o Google já estiver configurado, **Criar conta com o GitHub** (ou **com o Google**) faz o mesmo pela autorização do provedor.
2. Guarde o **código de recuperação** que aparece uma única vez, fora deste computador.

Até criar essa conta, nenhuma tela abre e nenhum pedido é atendido. Depois dela, o Prumo sempre abre na entrada e pede login.

## Papéis e permissões

Cada pessoa tem um **papel**, e cada papel tem um nível por tela: **Sem acesso** (a tela some do menu e o backend recusa os pedidos dela), **Ver** (consulta sem alterar) ou **Usar** (consulta e altera). O papel Administrador é fixo; você cria os outros em **Administração › Permissões**, começando de um papel existente.

A conferência é feita no processo principal a cada pedido, não só na janela: esconder um botão não é a autorização.

## Contas

- O administrador cria contas, aprova cadastros, troca o papel, desativa, desbloqueia e exclui. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma única vez; a pessoa define a própria senha no primeiro acesso.
- Em **Configurações gerais** você decide se o cadastro pela tela de entrada fica aberto, se precisa de aprovação, qual papel os novos cadastros recebem, o tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- Quem esquece a senha usa o código de recuperação; sem ele, a Administração redefine a senha.
- O último administrador não pode ser excluído nem rebaixado, e ninguém vira administrador pelo cadastro.
- Cada pessoa pode trocar o próprio nome e a senha em **Minha conta**, no canto da janela.

## Entrar e se cadastrar com o GitHub ou o Google

Se a Administração configurou, a tela de entrada e a de **Criar conta** ganham **Entrar com o GitHub** e **Entrar com o Google**. Ao clicar, o Prumo abre o provedor no seu navegador; você autoriza lá e volta ao Prumo já autenticado, sem digitar código nem senha.

- **Quem já tem conta ativa** entra direto. Com o GitHub, a conexão do GitHub também é criada sozinha (só leitura; a escrita continua desligada até você habilitar). O Google serve só para entrar: nenhuma conexão é criada.
- **Quem ainda não tem conta** é cadastrado como **pendente**, com o papel de novos cadastros, e **nada fica habilitado** até a Administração aprovar. Depois de aprovada, é só entrar de novo pelo provedor.
- **Primeiro acesso, sem nenhuma conta:** **Criar conta com o GitHub** (ou **com o Google**) cria a primeira conta, de Administrador, pela autorização do provedor. Isso exige o aplicativo do provedor já configurado neste computador.
- A conta é reconhecida pelo número do provedor, nunca pelo nome ou e-mail. Contas criadas assim não têm senha do Prumo.
- Cancelar, negar a autorização ou deixar passar 5 minutos não cria conta, sessão nem conexão.

**Como configurar (Administração › Configurações gerais).** No GitHub, registre um OAuth App em github.com/settings/developers com a callback `http://127.0.0.1/callback`; no Google Cloud Console, crie uma credencial OAuth do tipo **Aplicativo para computador**. Cole o **Client ID** e o **Client Secret** na seção do provedor. O segredo fica no cofre do sistema e nunca volta para a tela. Sem essa configuração, o botão não aparece. O GitHub pede o acesso `read:user repo` (para listar repositórios privados) e o Google, `openid email profile`.

## O que o login não faz

O login controla o que cada pessoa vê e altera **no aplicativo**. O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta do Windows deste computador, e a confirmação nativa do Windows para executar e publicar continua obrigatória. Os dados de projetos e integrações continuam locais por conta do Windows: o login não isola pessoas que usam a mesma conta do Windows.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem permissão liga ou desliga cada agente para todos os projetos, o uso de Claude Code ou Codex e a orquestração. Essas regras valem por cima das políticas de cada projeto (tela Agentes).

## Meu perfil (Configurações)

Na engrenagem, a aba **Meu perfil** guarda como o Prumo deve chamar você, seu papel no time, sua experiência (iniciante, intermediária ou avançada) e seu foco de trabalho (até 160 caracteres). Os agentes do Prumo usam esses dados neste computador para cumprimentar, ajustar o nível das explicações e priorizar o seu foco. Claude Code e Codex só recebem experiência, foco e o papel da sua conta se você marcar **Compartilhar experiência, foco e conta com a IA externa** (vem desmarcado); mesmo assim, chegam como dados, nunca como instrução. **Minha conta** (troca de nome e senha) fica no mesmo painel e no canto da janela.
