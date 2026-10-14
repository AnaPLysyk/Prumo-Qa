# Como instalar

1. Baixe Prumo-QA-Setup-versão.exe na página de releases do repositório oficial (AnaPLysyk/Prumo-Qa).
2. Confira o SHA-256 informado na release. O checksum confirma que o arquivo é o publicado; ele **não** substitui uma assinatura digital.
3. Execute o instalador. A instalação é por usuário (não pede administrador) e a pasta pode ser alterada. O assistente cria atalho no menu Iniciar e na área de trabalho.
4. Abra o Prumo QA pelo atalho. Na primeira abertura não há projetos: vincule uma pasta ou use o projeto de demonstração.

## Se o Windows barrar o instalador (versões sem assinatura)

As primeiras versões do Prumo não têm assinatura digital, então o Windows avisa antes de executar. Confira o SHA-256 primeiro e, se for igual ao da release:

- **"O Windows protegeu o computador" (SmartScreen):** clique em **Mais informações** e depois em **Executar assim mesmo**.
- **Arquivo bloqueado por ter vindo da internet:** botão direito no instalador › **Propriedades** › marque **Desbloquear** › **OK**, e execute de novo.
- **Pelo botão direito:** botão direito no instalador › **Executar como administrador** e confirme o aviso. Use só se a sua própria conta for administradora: com outra conta, o Prumo é instalado no perfil dessa outra conta.
- **Smart App Control ligado:** o Windows bloqueia sem opção de executar. O Prumo não orienta desligar essa proteção; aguarde uma versão assinada ou fale com quem administra o computador.

## Requisitos

- Windows 10 ou 11, 64 bits. Não é necessário instalar Node.js.
- Capacidades de projetos que usam npm run exigem Node.js com npm instalado na máquina.
- O instalador **não é assinado**. O SmartScreen pode alertar e, com Smart App Control ativo, o Windows pode bloquear o instalador. O Prumo não desativa essas proteções.

## Desinstalar

Configurações › Aplicativos › Prumo QA. Seus dados em %LOCALAPPDATA%\PrumoQA permanecem; veja Privacidade e dados para excluí-los.
