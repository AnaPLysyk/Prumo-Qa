# Segurança e limitações

Controles existentes:

- leitura restrita à raiz autorizada, sem fuga de diretório, links simbólicos ou arquivos de credenciais;
- somente comandos declarados no contrato, sem shell e sem comandos vindos de prompts;
- variáveis de ambiente por lista de permissão, tempo e saída limitados, segredos mascarados;
- documentos e código de projetos são tratados como dados, nunca como instruções;
- autenticação humana nativa do Windows antes de executar capacidades protegidas;
- a janela não tem acesso direto ao sistema nem à rede: só operações explícitas, validadas e catalogadas;
- exclusão de dados, aprovação de contextos e envio de contextos ao agente exigem confirmação nativa e não existem como ferramenta MCP.

Limitações:

- Execução protegida só existe no Windows. Em outros sistemas ela fica bloqueada.
- Não há sandbox forte: o comando autorizado roda com seus privilégios.
- O instalador não é assinado digitalmente. O Windows pode exibir alerta do SmartScreen, e Smart App Control ou Controle de Aplicativo podem bloquear o instalador ou o aprovar.exe; nesse caso a execução protegida fica BLOCKED, sem contornos. Uma assinatura de código com certificado confiável reduziria esses bloqueios; ela exige certificado e decisão da titular.
- Checksums SHA-256 detectam corrupção ou troca do arquivo baixado, mas não provam a identidade de quem publicou.
- Hashes das evidências detectam corrupção acidental, não adulteração por um administrador.
- A identidade do cliente de IA registrada nos logs é declarada, não autenticada.
- O pacote contém o runtime do aplicativo, mas não inclui o npm.
