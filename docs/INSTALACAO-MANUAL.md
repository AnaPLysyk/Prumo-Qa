# Roteiro de instalação e teste manual (Windows)

Este roteiro é para **você** validar o aplicativo na sua máquina. Ele não desativa nenhuma proteção do Windows e não pede que você faça isso.

## 1. Baixar e conferir (sem executar)

```powershell
Set-Location 'C:\Users\DELL\projetos-github\Prumo-Qa'
.\scripts\verificar-download.ps1 -Versao 2.3.1
```

O script baixa o instalador e o `.sha256` da release oficial, confere o SHA-256 e mostra o estado da assinatura. **Só continue se o SHA-256 conferir.** O checksum prova que o arquivo é o publicado, não quem o publicou. Procedência: a release deve estar em `https://github.com/AnaPLysyk/Prumo-Qa/releases` e a tag deve ser a da versão.

## 2. Instalar

Execute `Prumo-QA-Setup-<versão>.exe` (instalação por usuário, sem administrador, pasta alterável).

**Se o Windows bloquear** (SmartScreen ou "Uma política de Controle de Aplicativo bloqueou este arquivo"): o instalador não é assinado e o bloqueio é o comportamento esperado de uma proteção ativa. **Não desative Smart App Control nem o Defender para forçar.** Registre o bloqueio e aguarde a versão assinada (veja [ASSINATURA.md](ASSINATURA.md)). Nesse caso a validação local **não** está concluída.

## 3. Verificações após instalar

| # | Verificação | Esperado |
|---|---|---|
| 1 | Abrir **Prumo QA** pelo menu Iniciar ou pelo atalho | Janela abre; cabeçalho mostra `v<versão>` |
| 2 | Projetos › Adicionar projeto de demonstração | Projeto INTEGRADO na lista |
| 3 | Métricas, Logs, Histórico, Evidências | Abrem sem erro; sem registros aparece vazio, nunca número inventado |
| 4 | Conexões | Mostra o comando MCP com o `Prumo QA.exe` instalado |
| 5 | Ajuda › Versões e Atualizações | Versão instalada correta; "Verificar atualizações" responde |
| 6 | Fechar e reabrir | Projetos e histórico preservados |
| 7 | Instalar uma versão mais nova por cima | Dados e vínculos preservados; conexão MCP continua válida se a pasta não mudou |
| 8 | Desinstalar (Configurações › Aplicativos) | Programa removido; `%LOCALAPPDATA%\PrumoQA` permanece |

## 4. Teste da autenticação humana (execução protegida)

Esta é a única etapa que **só você** pode fazer. Nada é simulado.

1. Abra um terminal e rode, com a pasta de instalação real (ajuste o caminho):
   ```powershell
   $app = "$env:LOCALAPPDATA\Programs\Prumo QA"
   $env:ELECTRON_RUN_AS_NODE = '1'
   & "$app\Prumo QA.exe" "$app\resources\app\dist\cli.js" approve unit --root "$env:LOCALAPPDATA\PrumoQA\demonstracao"
   Remove-Item Env:ELECTRON_RUN_AS_NODE
   ```
2. O Windows abre a janela de credenciais (CredUI). Digite a senha **da sua conta Windows**. Nunca a entregue a uma IA nem a um script.
3. Resultado esperado: a capacidade `unit` do projeto de demonstração executa de verdade e o resultado e a evidência aparecem no aplicativo (Evidências).
4. Se você cancelar ou errar a senha, o resultado deve continuar **BLOCKED**, sem PASS.
5. Se o Windows bloquear o `aprovar.exe` (política de Controle de Aplicativo), o resultado é BLOCKED com o motivo. Isso não é falha do Prumo: o executável precisa estar assinado. Registre e não desative proteções.

Registre em `docs/` o resultado real (data, o que apareceu). Só depois dessa etapa a autenticação ponta a ponta poderá ser declarada comprovada.
