# Limitações de segurança

Controles existentes:

- leitura restrita à raiz autorizada, sem fuga de diretório, links simbólicos ou arquivos de credenciais;
- somente comandos declarados no contrato, sem shell e sem comandos vindos de prompts;
- variáveis de ambiente por lista de permissão, tempo e saída limitados, segredos mascarados;
- documentos e código de projetos são tratados como dados, nunca como instruções;
- autenticação humana nativa do Windows antes de executar capacidades protegidas;
- a janela não tem acesso direto ao sistema: só operações explícitas e validadas.

Limitações:

- Execução protegida só existe no Windows. Em outros sistemas ela fica bloqueada.
- Não há sandbox forte: o comando autorizado roda com seus privilégios.
- O instalador não é assinado digitalmente. O Windows pode exibir alerta do SmartScreen, e a política de Controle de Aplicativo pode bloquear o aprovar.exe; nesse caso a execução protegida fica BLOCKED, sem contornos.
- Hashes das evidências detectam corrupção acidental, não adulteração por um administrador.
- A identidade do cliente de IA registrada nos logs é declarada, não autenticada.
- O pacote instalado contém o runtime do aplicativo, mas não inclui o npm: capacidades que usam npm run exigem Node.js com npm instalado.
