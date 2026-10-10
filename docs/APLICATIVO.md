# Aplicativo desktop (Windows) — Prumo QA 2.2

A janela é uma camada de **apresentação** sobre o núcleo existente. Ela não classifica resultados, não calcula métricas e não executa comandos: chama `src/painel.ts`, que delega a `projeto`, `atividades`, `evidencias` e `conexoes`.

## Arquitetura

```text
Janela (app/renderer: HTML+CSS+JS, sandbox, CSP, sem rede)
   │  window.prumo.*  (app/preload.cjs — 13 funções, objeto congelado)
   ▼
Processo principal Electron (src/desktop/main.ts)
   │  canais IPC `prumo:*`: confere remetente, valida com zod, devolve {ok,data|error}
   ▼
Adaptador (src/painel.ts, src/vinculos.ts)  — puro Node, testado sem janela
   ▼
Núcleo: projeto · qualidade · execucao · evidencias · atividades · conexoes
```

O **servidor MCP não roda dentro da janela**. Cada cliente de IA inicia o seu processo (`mcp.js`, stdio); fechar a janela não o afeta (há teste para isso).

### Como Electron, Node e MCP se integram

- O app instalado não depende de Node.js. O `Prumo QA.exe` é o Electron; com a variável `ELECTRON_RUN_AS_NODE=1` ele se comporta como um Node puro, sem abrir janela.
- `src/conexoes.ts` detecta `process.versions.electron` e propõe `command = Prumo QA.exe`, `args = [<instalação>\resources\app\dist\mcp.js, <projeto>]`, `env ELECTRON_RUN_AS_NODE=1`. Em desenvolvimento a proposta usa o `electron.exe` do projeto da mesma forma.
- `src/execucao.ts` faz o mesmo para capacidades `node`: o filho recebe `ELECTRON_RUN_AS_NODE=1` (senão abriria uma janela do Prumo).
- O build usa `asar: false` para que `dist/mcp.js` e `dist/aprovar.exe` existam como arquivos reais (um executável não roda de dentro de um `.asar`).
- O pacote **não inclui npm**: capacidades `npm run` continuam exigindo Node com npm na máquina (falha como `RUNTIME_MISSING`, nunca como PASS).

### Como os eventos chegam aos logs

Cada `tools/call` MCP (e cada comando do CLI) grava um registro de início e outro de término em `%LOCALAPPDATA%\PrumoQA\projects\<hash>\<operação>.jsonl` (um arquivo por operação, sem disputa entre processos). A janela só **lê** esses arquivos: a aba Logs, ao marcar “Acompanhar”, consulta de novo a cada 2 s. Registros corrompidos são excluídos e a tela avisa que as métricas são parciais.

### Onde ficam os dados

| Dado | Local |
|---|---|
| Histórico/métricas | `%LOCALAPPDATA%\PrumoQA\projects\` |
| Projetos vinculados | `%LOCALAPPDATA%\PrumoQA\vinculos.json` (só caminhos) |
| Projeto de demonstração copiado | `%LOCALAPPDATA%\PrumoQA\demonstracao\` |
| Dados internos do Electron | `%LOCALAPPDATA%\PrumoQA\app\` |
| Evidências de execução | `<projeto>\.prumo\evidencias\` |

`PRUMO_DATA_DIR` troca a pasta base (usado nos testes). Desinstalar **não** apaga nada disso.

## Segurança da janela

`contextIsolation`, `sandbox` e `webSecurity` ligados; `nodeIntegration` desligado; CSP `default-src 'none'`; toda requisição que não seja `file:` é cancelada; navegação e novas janelas são negadas; permissões do navegador negadas; DevTools só fora do pacote. Cada canal IPC recusa remetente que não seja a página do app, valida os argumentos e só aceita raízes **já vinculadas**. A janela nunca recebe caminho livre para ler/executar: a pasta de um projeto só entra pelo diálogo nativo. Alterar a configuração do Codex exige uma caixa de confirmação **nativa** do processo principal, que a página não consegue simular. A autenticação humana antes de executar (`aprovar.exe`, CredUI + LogonUser) é a mesma do CLI/MCP e não foi alterada.

## Desenvolvimento

```powershell
Set-Location 'C:\Users\DELL\projetos-github\Prumo-Qa'
npm.cmd ci
npm.cmd run app        # compila e abre a janela em modo desenvolvimento
npm.cmd run check      # tipos + build + todos os testes (inclui automação da janela)
```

> **VS Code / terminais de IA:** se `ELECTRON_RUN_AS_NODE` estiver definido no terminal, o Electron vira Node e a janela não abre (`does not provide an export named 'BrowserWindow'`). Rode `Remove-Item Env:ELECTRON_RUN_AS_NODE` antes de `npm run app`.

## Gerar o instalador

```powershell
npm.cmd run dist       # saída: release\Prumo-QA-Setup-<versão>.exe  (NSIS, por usuário)
```

Configuração em `electron-builder.yml`. O instalador permite escolher a pasta, cria atalho no menu Iniciar **e** na área de trabalho, tem desinstalador convencional e **não** inicia com o Windows. A versão vem do `package.json`. O build é reproduzível a partir de `package-lock.json` (`npm ci`).

O fluxo recomendado de release é o workflow `.github/workflows/windows.yml`: numa máquina Windows limpa ele roda `npm run check`, gera o instalador, instala em pasta com espaços e acentos (`C:\Prumo QA instalação`), roda a automação da janela e o cliente MCP real sobre o **executável instalado**, desinstala e confere que os dados do usuário permaneceram. Uma tag `v*` publica o instalador em GitHub Releases:

```powershell
git tag v2.2.0
git push origin v2.2.0
```

### Limitação do build local com Smart App Control

Com **Smart App Control** (ou Controle de Aplicativo) em modo ativo, o Windows bloqueia executáveis novos e sem assinatura. O electron-builder executa um instalador provisório para gerar o desinstalador e o build local falha com `spawn UNKNOWN`; do mesmo modo, `aprovar.exe` recém-compilado pode ser bloqueado. O Prumo **não** desliga nem contorna essa proteção. Em máquinas sem esse bloqueio (ou com certificado de assinatura configurado no electron-builder) `npm run dist` funciona; o workflow do GitHub é a alternativa.

## Instalar em outra máquina

1. Baixe `Prumo-QA-Setup-<versão>.exe` na página de releases do repositório.
2. Execute. Este instalador **não é assinado**: o SmartScreen pode alertar e o Smart App Control pode bloquear. Confira o SHA-256 publicado antes de executar. Não desative proteções do sistema por conta do Prumo sem avaliar o risco.
3. Abra **Prumo QA** pelo menu Iniciar.

Desinstalar: Configurações › Aplicativos › Prumo QA. Para apagar também o histórico, remova `%LOCALAPPDATA%\PrumoQA`.

## Vincular um projeto e conectar uma IA

- **Projetos › Vincular pasta…** valida o `qa.project.json`. Sem manifesto ou inválido: aparece o diagnóstico e as instruções; nada é gravado na pasta nem vinculado.
- **Projetos › Adicionar projeto de demonstração** copia o exemplo (instalação é somente leitura) para `%LOCALAPPDATA%\PrumoQA\demonstracao` e o vincula.
- **Conexões** mostra o comando exato para Codex e Claude Code. Para o Codex, se o cliente for localizado, o botão pede confirmação nativa e adiciona a configuração sem sobrescrever outra existente. Para Claude Code, copie o comando e execute no PowerShell.

## Substituir o ícone

Troque `assets/prumo-icon.png` (512×512) e `assets/prumo-icon.ico` (com 16, 32, 48 e 256 px) e rode `npm run dist`. O mesmo arquivo alimenta a janela, o executável, o instalador, o desinstalador e os atalhos. O ícone atual é **provisório**, gerado por `npm run icone` (não rode esse comando depois de colocar o seu).

## Diagnóstico de erros comuns

| Sintoma | Causa e ação |
|---|---|
| A janela não abre em desenvolvimento, erro sobre `BrowserWindow` | `ELECTRON_RUN_AS_NODE` definido; remova a variável. |
| `spawn UNKNOWN` / “Uma política de Controle de Aplicativo bloqueou este arquivo” | Smart App Control. Veja acima; use o workflow ou assine. |
| Execução protegida retorna `BLOCKED` | Falta a autenticação humana (esperado) ou o `aprovar.exe` foi bloqueado. |
| Métricas “parciais” | Há registro inválido ou truncado em `projects\`; ele é excluído, não corrigido. |
| Cliente de IA não chama o Prumo | A configuração não comprova sessão: reabra o cliente e confira em Logs se há chamadas. |
| `PROJECT_NOT_LINKED` | A raiz não está vinculada; use Projetos › Vincular pasta. |
