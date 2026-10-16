# Como instalar

O instalador ainda não tem assinatura digital. O sistema pode mostrar um aviso antes de abri-lo. Antes de instalar, compare o SHA-256 do arquivo com o valor publicado na release oficial. Se os valores forem iguais, o arquivo corresponde ao publicado; isso não confirma quem o criou.

1. Baixe o instalador na página Download do site ou nas releases do repositório AnaPLysyk/Prumo-Qa:
   - Windows: Prumo-QA-Setup-versão.exe
   - macOS: Prumo-QA-versão-mac-arm64.dmg (Apple Silicon) ou mac-x64.dmg (Intel)
   - Linux: Prumo-QA-versão-linux-x86_64.AppImage ou linux-amd64.deb
2. Confira o SHA-256 na release oficial. Se os valores forem iguais, o arquivo corresponde ao publicado. Isso **não** substitui uma assinatura digital.
3. Instale seguindo os passos do seu sistema, abaixo.
4. Abra o Prumo. Na primeira vez, crie uma conta de Administrador usando seu e-mail (você receberá um código de confirmação), GitHub ou Google. Você também pode escolher o idioma na tela de entrada. Depois, em **Projetos**, crie um projeto, importe um do Qase ou escolha **Adicionar projeto de demonstração**.

## Windows

O instalador configura o Prumo para a sua conta do Windows e não pede acesso de administrador. Você pode escolher a pasta de instalação. O assistente cria atalhos no menu Iniciar e na área de trabalho.

Se o Windows barrar o instalador, confira o SHA-256 e:

- **"O Windows protegeu o computador" (SmartScreen):** **Mais informações** › **Executar assim mesmo**.
- **Arquivo bloqueado por ter vindo da internet:** botão direito › **Propriedades** › marque **Desbloquear** › **OK** e execute de novo.
- **Executar como administrador:** só se a sua própria conta for administradora; com outra conta, o Prumo é instalado no perfil dela.
- **Smart App Control ligado:** o Windows bloqueia o instalador. Não desative essa proteção; aguarde uma versão assinada ou fale com quem administra o computador.

## macOS

1. Abra o .dmg e arraste o Prumo QA para Aplicativos.
2. Na primeira vez, botão direito no Prumo QA › **Abrir**. O app não é assinado pela Apple, então o macOS avisa sobre "desenvolvedor não identificado".
3. Se o macOS disser que o app "está danificado", rode no Terminal: xattr -dr com.apple.quarantine "/Applications/Prumo QA.app".
4. Os tokens ficam no Keychain. Aprovar execuções e escritas pede a senha (ou Touch ID) de um administrador do Mac.

## Linux

- **AppImage:** chmod +x Prumo-QA-*.AppImage e depois ./Prumo-QA-*.AppImage. No Ubuntu 22.04 ou mais novo, instale antes o libfuse2.
- **.deb:** sudo apt install ./Prumo-QA-*.deb.
- Os tokens ficam no gnome-keyring ou no KWallet. Sem cofre, o Prumo se recusa a guardar tokens.
- Aprovar execuções e escritas abre uma janela com o escopo (zenity ou kdialog) e pede a sua senha pelo polkit (pkexec). Sem essas ferramentas o pedido fica BLOCKED; instale policykit-1 e zenity.
- **Iniciar o Prumo com o sistema** (em Agendamentos) cria um atalho em ~/.config/autostart.

## Requisitos

- Windows 10 ou 11 de 64 bits, macOS 11 ou mais novo, ou Linux de 64 bits. Não precisa instalar Node.js.
- Capacidades com npm run exigem Node.js com npm na máquina.

## Desinstalar

- Windows: Configurações › Aplicativos › Prumo QA.
- macOS: arraste o Prumo QA de Aplicativos para a Lixeira.
- Linux: apague o AppImage ou rode sudo apt remove prumo-qa.

Seus dados continuam no computador (Windows: %LOCALAPPDATA%\PrumoQA; macOS: ~/Library/Application Support/PrumoQA; Linux: ~/.local/share/prumo-qa). Para apagá-los, use **Ajuda › Privacidade e dados**.
