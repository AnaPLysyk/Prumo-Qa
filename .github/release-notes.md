## Prumo QA — aplicativo Windows

Instalador para Windows 10/11 (x64). Não é necessário instalar Node.js.

**Instalador NÃO ASSINADO.** Esta versão não tem assinatura digital. O Windows pode mostrar o alerta do SmartScreen ("Windows protegeu seu computador") e, com Smart App Control ou Controle de Aplicativo ativos, pode bloquear o instalador ou o `aprovar.exe`. O Prumo não contorna essas proteções. Baixe somente desta página de releases e confira o hash SHA-256 antes de executar.

### Instalar
1. Baixe `Prumo-QA-Setup-<versão>.exe` abaixo.
2. Execute e siga o assistente (instalação por usuário, sem administrador; pasta alterável).
3. Abra **Prumo QA** pelo menu Iniciar ou pelo atalho da área de trabalho.

### O que há na janela
Projetos, métricas, logs, histórico, evidências, conexões de IA (Codex e Claude Code) e ajuda com privacidade e termos (rascunhos que exigem revisão humana).

### Privacidade
Sem telemetria e sem rede. Histórico e vínculos ficam em `%LOCALAPPDATA%\PrumoQA`; desinstalar não apaga esses dados.

### Limitações conhecidas
- Execução protegida (autenticação humana) só no Windows e depende de o `aprovar.exe` não ser bloqueado pela política de Controle de Aplicativo.
- Capacidades `npm run` exigem Node.js com npm instalado; capacidades `node` funcionam com o runtime embutido.
- Sem sandbox forte, sem auto-atualização.
