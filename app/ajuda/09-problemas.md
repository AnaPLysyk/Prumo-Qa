# Problemas comuns

- **Conexão MCP não detectada.** A configuração não comprova sessão. Reabra o cliente de IA e olhe a aba Logs: se houver chamadas, a conexão funciona. Se instalou o Prumo em outra pasta, reconfigure em Conexões.
- **Projeto sem contrato ou inválido.** Crie ou corrija o qa.project.json; a janela mostra o motivo. Nada é vinculado até o contrato ser válido.
- **Não aparecem logs.** Ainda não houve chamadas para esse projeto, ou o projeto selecionado é outro. Confira o projeto no cabeçalho.
- **Métricas parciais.** Há registro inválido ou truncado no histórico; ele é excluído do cálculo e sinalizado, nunca corrigido.
- **Execução retorna BLOCKED.** Falta a autenticação humana (esperado), uma pré-condição, ou o Windows bloqueou o aprovar.exe.
- **O Windows bloqueou o instalador ou o aprovar.exe.** Smart App Control e Controle de Aplicativo bloqueiam arquivos novos sem assinatura digital. O Prumo não desativa nem contorna essas proteções; a solução definitiva é a assinatura de código, ainda não disponível.
- **Capacidade npm run falha com RUNTIME_MISSING.** O pacote não inclui npm; instale Node.js com npm ou use uma capacidade node.
- **Não foi possível verificar atualizações.** Sem internet, ou o GitHub está indisponível. O aplicativo continua funcionando localmente.
