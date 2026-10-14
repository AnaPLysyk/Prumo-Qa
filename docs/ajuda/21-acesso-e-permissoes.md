# Acesso, usuários e permissões

O Prumo funciona com a conta do Windows deste computador. Se várias pessoas usam o mesmo computador, ou se você quer limitar o que cada uma faz, ligue o **login** em **Administração › Usuários**.

## Ligar o login

1. Abra **Administração › Usuários** e clique em **Ativar login**.
2. Crie a primeira conta: ela é sempre de **Administrador**. O usuário tem de 3 a 40 caracteres (letras minúsculas, números, ponto, hífen ou sublinhado) e a senha, pelo menos 10 caracteres, misturando letras e números.
3. Guarde o **código de recuperação** que aparece uma única vez, fora deste computador.

Daí em diante a janela pede login antes de mostrar qualquer tela. Sem login ligado, nada muda: todas as telas ficam liberadas, como antes.

## Papéis e permissões

Cada pessoa tem um **papel**, e cada papel tem um nível por tela: **Sem acesso** (a tela some do menu e o backend recusa os pedidos dela), **Ver** (consulta sem alterar) ou **Usar** (consulta e altera). O papel Administrador é fixo; você cria os outros em **Administração › Permissões**, começando de um papel existente.

A conferência é feita no processo principal a cada pedido, não só na janela: esconder um botão não é a autorização.

## Contas

- O administrador cria contas, aprova cadastros, troca o papel, desativa, desbloqueia e exclui. Ao criar uma conta ou redefinir uma senha, o Prumo mostra uma **senha temporária** uma única vez; a pessoa define a própria senha no primeiro acesso.
- Em **Configurações gerais** você decide se o cadastro pela tela de entrada fica aberto, se precisa de aprovação, qual papel os novos cadastros recebem, o tempo de inatividade e quantas tentativas erradas bloqueiam a conta.
- Quem esquece a senha usa o código de recuperação; sem ele, a Administração redefine a senha.
- O último administrador não pode ser excluído nem rebaixado, e ninguém vira administrador pelo cadastro.
- Cada pessoa pode trocar o próprio nome e a senha em **Minha conta**, no canto da janela.

## O que o login não faz

O login controla o que cada pessoa vê e altera **no aplicativo**. O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta do Windows deste computador, e a confirmação nativa do Windows para executar e publicar continua obrigatória. Os dados de projetos e integrações continuam locais por conta do Windows: o login não isola pessoas que usam a mesma conta do Windows.

## Agentes da plataforma

Em **Administração › Agentes**, quem tem permissão liga ou desliga cada agente para todos os projetos, o uso de Claude Code ou Codex e a orquestração. Essas regras valem por cima das políticas de cada projeto (tela Agentes).

## Meu perfil (Configurações)

Na engrenagem, a aba **Meu perfil** guarda como o Prumo deve chamar você, seu papel no time, sua experiência (iniciante, intermediária ou avançada) e seu foco de trabalho (até 160 caracteres). Os agentes do Prumo usam esses dados neste computador para cumprimentar, ajustar o nível das explicações e priorizar o seu foco. Claude Code e Codex só recebem experiência, foco e o papel da sua conta se você marcar **Compartilhar experiência, foco e conta com a IA externa** (vem desmarcado); mesmo assim, chegam como dados, nunca como instrução. **Minha conta** (troca de nome e senha) fica no mesmo painel e no canto da janela.
