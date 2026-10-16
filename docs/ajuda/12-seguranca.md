# Segurança e limitações

O Prumo segue regras definidas e recusa ações que não consegue validar. Para proteger seus dados, ele:

- lê apenas a pasta autorizada. Não segue atalhos para outras pastas nem abre arquivos de credenciais;
- executa somente os comandos permitidos no contrato, nunca comandos livres escritos em um pedido;
- limita as variáveis de ambiente, o tempo e a saída dos comandos. Também oculta segredos nos logs;
- trata os documentos e o código do projeto como conteúdo, não como instruções para o próprio Prumo;
- pede sua autenticação no sistema antes de executar ações ou gravar arquivos;
- impede que a janela acesse diretamente o sistema ou a rede. Ela só pode pedir operações conhecidas e validadas;
- exige login e verifica a permissão da pessoa a cada pedido. Só contas marcadas como admin podem abrir Administração;
- não permite que agentes MCP excluam dados, aprovem contextos ou os compartilhem sem autorização.

Limites que você precisa conhecer:

- O isolamento não é completo: um comando autorizado roda com as permissões da sua conta no computador.
- O instalador não tem assinatura digital. SmartScreen, Smart App Control ou Gatekeeper podem avisar ou bloquear; o Prumo não contorna isso, e a execução protegida fica BLOCKED.
- SHA-256 ajuda a detectar um arquivo corrompido ou diferente do esperado, mas não confirma quem o publicou.
- Os códigos de verificação das evidências ajudam a detectar corrupção acidental, mas não impedem uma pessoa com acesso de administrador de alterá-las.
- O nome do cliente de IA nos logs é declarado por ele, não autenticado.
- O pacote não inclui o npm.
