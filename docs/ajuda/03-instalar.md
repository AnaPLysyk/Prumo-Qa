# Como instalar

1. Baixe o instalador do seu sistema na página Download do site oficial (ou na página de releases do repositório AnaPLysyk/Prumo-Qa): Prumo-QA-Setup-versão.exe para Windows, Prumo-QA-versão-mac-arm64.dmg (Apple Silicon) ou mac-x64.dmg (Intel) para macOS, e Prumo-QA-versão-linux-x86_64.AppImage ou linux-amd64.deb para Linux.
2. Confira o SHA-256 informado na release. O checksum confirma que o arquivo é o publicado; ele **não** substitui uma assinatura digital.
3. No Windows, execute o instalador (passos para macOS e Linux estão mais abaixo). A instalação é por usuário (não pede administrador) e a pasta pode ser alterada. O assistente cria atalho no menu Iniciar e na área de trabalho.
4. Abra o Prumo QA pelo atalho. Na primeira abertura não há projetos: vincule uma pasta ou use o projeto de demonstração.

## Se o Windows barrar o instalador (versões sem assinatura)

As primeiras versões do Prumo não têm assinatura digital, então o Windows avisa antes de executar. Confira o SHA-256 primeiro e, se for igual ao da release:

- **"O Windows protegeu o computador" (SmartScreen):** clique em **Mais informações** e depois em **Executar assim mesmo**.
- **Arquivo bloqueado por ter vindo da internet:** botão direito no instalador › **Propriedades** › marque **Desbloquear** › **OK**, e execute de novo.
- **Pelo botão direito:** botão direito no instalador › **Executar como administrador** e confirme o aviso. Use só se a sua própria conta for administradora: com outra conta, o Prumo é instalado no perfil dessa outra conta.
- **Smart App Control ligado:** o Windows bloqueia sem opção de executar. O Prumo não orienta desligar essa proteção; aguarde uma versão assinada ou fale com quem administra o computador.

## macOS

1. Abra o arquivo .dmg e arraste o Prumo QA para a pasta Aplicativos.
2. Na primeira vez, clique com o botão direito no Prumo QA e escolha **Abrir**. O app não é assinado pela Apple, então o macOS avisa sobre "desenvolvedor não identificado". Confira o SHA-256 antes.
3. Se o macOS disser que o app "está danificado", rode no Terminal: xattr -dr com.apple.quarantine "/Applications/Prumo QA.app".
4. Tokens do Jira, Qase e GitHub ficam no Keychain do macOS. Aprovar a execução de testes e a escrita em serviços pede a senha (ou Touch ID) do seu usuário, que precisa ser administrador do Mac.

## Linux

- **AppImage:** chmod +x Prumo-QA-*.AppImage e depois ./Prumo-QA-*.AppImage. No Ubuntu 22.04 ou mais novo, instale antes o libfuse2.
- **.deb (Debian, Ubuntu e derivados):** sudo apt install ./Prumo-QA-*.deb.
- Tokens ficam no cofre de senhas do sistema (gnome-keyring ou KWallet). Sem cofre, o Prumo recusa guardar tokens em vez de guardá-los sem proteção; instale o gnome-keyring.
- Aprovar a execução de testes e a escrita em serviços mostra uma janela com o escopo (zenity ou kdialog) e pede a sua senha pelo polkit (pkexec). Sem essas ferramentas o pedido fica BLOQUEADO; instale policykit-1 e zenity.
- "Iniciar com o sistema" cria um atalho em ~/.config/autostart.

## Requisitos

- Windows 10 ou 11 de 64 bits, macOS 11 ou mais novo (Apple Silicon ou Intel) ou Linux de 64 bits. Não é necessário instalar Node.js.
- Capacidades de projetos que usam npm run exigem Node.js com npm instalado na máquina.
- Os instaladores **não são assinados**. No Windows, o SmartScreen pode alertar e, com Smart App Control ativo, o Windows pode bloquear o instalador. O Prumo não desativa essas proteções.

## Desinstalar

Windows: Configurações › Aplicativos › Prumo QA. macOS: arraste o Prumo QA de Aplicativos para a Lixeira. Linux: apague o AppImage ou rode sudo apt remove prumo-qa.

Seus dados permanecem (Windows: %LOCALAPPDATA%\PrumoQA; macOS: ~/Library/Application Support/PrumoQA; Linux: ~/.local/share/prumo-qa); veja Privacidade e dados para excluí-los.
