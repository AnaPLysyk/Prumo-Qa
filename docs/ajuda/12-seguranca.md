# Segurança e limitações

Eu preferi que o Prumo recuse em vez de adivinhar. O que ele faz para proteger você:

- lê só a raiz autorizada, sem sair dela, seguir links simbólicos ou abrir arquivos de credenciais;
- roda só comandos declarados no contrato, sem shell e nunca vindos de um prompt;
- limita variáveis de ambiente, tempo e saída, e mascara segredos nos logs;
- trata documentos e código dos projetos como dados, nunca como instruções;
- pede a autenticação do sistema (Windows, macOS ou polkit no Linux) antes de executar ou escrever fora;
- deixa a janela sem acesso direto ao sistema ou à rede: só operações catalogadas e validadas;
- exige login e confere a permissão de cada tela no servidor; a tela Administração só abre para contas marcadas como admin;
- não oferece por MCP excluir dados, aprovar contextos ou enviar contextos ao agente.

Limites que você precisa conhecer:

- Não há sandbox forte: o comando autorizado roda com os seus privilégios.
- O instalador não tem assinatura digital. SmartScreen, Smart App Control ou Gatekeeper podem avisar ou bloquear; o Prumo não contorna isso, e a execução protegida fica BLOCKED.
- SHA-256 detecta arquivo corrompido ou trocado, mas não prova quem publicou.
- Hashes das evidências detectam corrupção acidental, não adulteração por quem administra o computador.
- O nome do cliente de IA nos logs é declarado por ele, não autenticado.
- O pacote não inclui o npm.
