# Prumo QA 2.16 — Plataforma desktop de engenharia de qualidade

Eu sou a Ana Paula Lysyk, trabalho com QA e criei o Prumo para juntar num lugar só o que faço todo dia: projeto, requisitos, casos, runs, evidências e tickets, com ou sem IA. Ele roda no seu computador (Windows, macOS e Linux) e abre na tela de login. No primeiro acesso você cria a conta de Administrador com o seu e-mail (confirmado por um código), com o GitHub ou com o Google.

Eu preferi que nada saísse do seu computador sem você ver. Qase, Jira e GitHub conectam só para leitura. A escrita é ligada por projeto e por serviço, e cada envio mostra uma prévia e pede a confirmação nativa do sistema. A IA (Claude Code ou Codex, por MCP) lê o contexto e propõe casos, bugs e aprendizados como rascunho. Executar um teste sempre passa pela sua aprovação.

Versão atual 2.16.0; releases publicadas em [github.com/AnaPLysyk/Prumo-Qa/releases](https://github.com/AnaPLysyk/Prumo-Qa/releases). O instalador não é assinado: confira o SHA-256 publicado junto. [Site e documentação pública](https://prumo-qa-docs.onrender.com) · [catálogo de versões](docs/catalogo/versoes.json) · [registros antigos](docs/historico/).

## Estado atual

- Integrações homologadas com contas reais do Qase, do Jira e do GitHub em 15 e 16/10/2026: caso, defeito, run e resultado no Qase, bug e comentário no Jira e issue no GitHub, conferidos direto no serviço.
- Limites conhecidos: o plano gratuito do Qase não libera o vínculo caso-ticket do Jira; campos personalizados obrigatórios de defeito só foram homologados em projetos sem esses campos; sem Issues: Read and write, o GitHub descarta os rótulos (o Prumo avisa); editar ou fechar issue, editar defeito e excluir qualquer item não existem.
- O que cada serviço lê e recebe: [origem e destino das integrações](docs/INTEGRACOES-ORIGEM-DESTINO.md). Regras de confiança: [segurança](docs/SEGURANCA.md). Ciclo de trabalho: [ciclo de qualidade](docs/CICLO-QUALIDADE.md).

## Onde fica cada coisa

Procure pelo nome da tela no menu: a mesma pasta existe no frontend e no backend.

| Quero mexer em… | Vá para |
| --- | --- |
| O que aparece numa tela | `frontend/<tela>/` (HTML/CSS/JS sem framework; `dist/renderer/` é gerado no build) |
| O que a tela faz por trás | `backend/<tela>/`: `api/` (um arquivo por canal IPC), `regras/`, `banco/`, `integracoes/`, `tipos/` |
| Componentes e estilos comuns | `frontend/design-system/` e `frontend/compartilhado/` |
| O que várias telas usam | `backend/compartilhado/`: contrato `qa.project.json` (`projeto/`, `tipos/projeto.ts`), leitura segura e máscara de segredos (`seguranca/`), erros e pasta de dados |
| Portas de entrada | `backend/aplicativo.ts` (Electron), `backend/cli.ts` (terminal, comandos em `backend/terminal/`), `backend/mcp.ts` (servidor MCP, ferramentas em `backend/agentes/mcp/`) |
| Ponte janela ↔ canais | `backend/aplicativo/preload.cjs` (`window.prumo`) e `backend/aplicativo/api/catalogoDeContratos.ts` (esquemas IPC e MCP; [catálogo gerado](docs/CONTRATOS.md)) |
| Testes, runs e execução com aprovação humana | `backend/testes/` (aprovação em `aprovacao/`, broker Windows em `ferramentas/empacotamento/aprovar.cs`) |
| Agendamentos, worker e k6 | `backend/agendamentos/` ([agendamentos](docs/AGENDAMENTOS.md)) |
| Contas de serviço e escrita externa | `backend/conexoes/` e `backend/tickets/` |
| Agentes, conhecimento e Skills | `backend/agentes/` e `backend/agentes/skills/` ([Skills](docs/SKILLS.md)) |
| Testes | `testes/<natureza>/<camada>/<módulo>/` ([testes/LEIA-ME.md](testes/LEIA-ME.md), [seleção](docs/TESTES.md)) |
| Build, empacotamento, release e documentação gerada | `ferramentas/<finalidade>/` (não vão para o instalador) |
| Instaladores | `electron-builder.yml` (NSIS no Windows, .dmg no macOS, AppImage e .deb no Linux) e `assets/` |
| CI | `.github/workflows/`: `windows.yml` (suíte, instalador, atualização, release), `multiplataforma.yml` (macOS e Linux), `site.yml`, `triagem.yml` |
| Site público | `site/gerar.mjs`, `site/componentes/`, `site/estilos/`; `scripts/gerar-site.mjs` só repassa para `site/construir-no-render.mjs` enquanto o Render usar o comando antigo |
| Ajuda do aplicativo e do site | `docs/ajuda/*.md` |
| Exemplos | `backend/projetos/exemplos/` (`projeto-demo`, `plano-demo.json`, `g3-somente-leitura.json`) |

Mapa completo: [arquitetura por tela](docs/ARQUITETURA-MODULAR-ATUAL.md) e [índice do backend](backend/LEIA-ME.md), gerado do código (cada `backend/<tela>/` tem o seu `LEIA-ME.md`). Dentro do aplicativo: Administração › Documentação viva.

## Rodar a partir do código

Node 24 (o CI usa 24; o mínimo declarado é 22) e Git. Não precisa de Docker, banco ou servidor.

```powershell
git clone https://github.com/AnaPLysyk/Prumo-Qa.git
Set-Location .\Prumo-Qa
npm.cmd ci
npm.cmd run app      # build e abre o aplicativo
```

Para ter o comando `prumo` sem publicar no npm:

```powershell
$pacote = npm.cmd pack | Select-Object -Last 1   # o prepack compila
npm.cmd install --global ".\$pacote"
prumo.cmd help
```

O único binário registrado é `prumo` (não cria nem substitui `qa`). Se já existir outro `prumo`, instale com `--prefix '<pasta própria>'` e chame pelo caminho absoluto. `prumo.cmd` evita o shim `.ps1` quando a política do PowerShell bloqueia scripts. Sem instalar, use `node .\dist\cli.js` ou `npm.cmd run prumo --`. O pacote é `private` e `UNLICENSED`; a licença para terceiros ainda está para decidir ([licenças](docs/LICENCAS.md)).

## Terminal

```powershell
$demo = Join-Path (Get-Location) 'backend\projetos\exemplos\projeto-demo'
prumo.cmd doctor --root "$demo"              # explica problemas do contrato
prumo.cmd --root "$demo"                     # menu interativo
prumo.cmd context --root "$demo"
prumo.cmd review '.\backend\projetos\exemplos\plano-demo.json' --root "$demo"
prumo.cmd run unit --root "$demo"            # BLOCKED: sem aprovação
prumo.cmd approve unit --root "$demo"        # pede a aprovação do sistema e roda uma vez
prumo.cmd evidencias --root "$demo"
prumo.cmd atividade --root "$demo"           # --json em atividade, metricas e logs
prumo.cmd metricas --root "$demo"
prumo.cmd logs --follow --root "$demo"       # Ctrl+C encerra
npm.cmd run demo                             # demonstração CLI/MCP com logs reais
```

- Sem `--root`, vale a pasta atual. O CLI nunca cria `qa.project.json`; fora de um terminal interativo, o menu imprime e termina.
- `approve` autentica a pessoa e executa uma única rodada; não deixa autorização guardada. Windows: CredUI com a senha da conta atual (conta só com PIN/Hello precisa de senha compatível). macOS e Linux: autenticação do sistema, com as ressalvas de [segurança](docs/SEGURANCA.md). Cancelar, errar a senha, mudar o escopo ou expirar bloqueia. Nunca deixe uma IA preencher a credencial.
- Saída: 0 consulta/PASS, 1 FAIL, 2 BLOCKED/NOT_RUN/entrada inválida, 3 histórico incompleto ou falha ao registrar, sem falha do núcleo.

### Histórico e métricas

O histórico fica em `%LOCALAPPDATA%\PrumoQA\projects\<hash>\<operação>.jsonl` (macOS: `~/Library/Application Support/PrumoQA`; Linux: `~/.local/share/prumo-qa`). `PRUMO_DATA_DIR` (caminho absoluto) troca a pasta; use o mesmo valor no terminal e no servidor MCP. Pastas com links ou dentro do projeto analisado são recusadas.

Cada operação guarda início, término, duração, origem (CLI/MCP), ferramenta, estado e contagens. Texto de requisito, código, credencial ou resposta não é copiado. Limites: 10.000 arquivos, 32 KiB por operação, 32 MiB por leitura; nada é apagado por rotação, você arquiva à mão. Arquivo inválido sai das métricas com aviso `HISTORY_INCOMPLETE`, nunca em silêncio. Falha ao gravar gera `PRUMO_OBSERVABILITY_ERROR` no stderr e não muda o resultado do núcleo.

| Indicador | O que conta |
|---|---|
| Chamadas MCP | `tools/call` observadas, inclusive com erro; handshake e `tools/list` não contam |
| Achados e recomendações | Ocorrências retornadas; repetir a revisão soma de novo |
| Lacunas | `MISSING_*`, `UNVERIFIED_*`, `TRACEABILITY_GAP`, `COVERAGE_GAP`, `CONTRADICTORY_REQUIREMENT` |
| Redundâncias candidatas | `POTENTIAL_REDUNDANCY`, sem afirmar equivalência |
| PASS/FAIL/BLOCKED/NOT_RUN | Só estados devolvidos pela execução; consulta não vira PASS |
| Tokens, custo, mudanças aplicadas | Indisponíveis: o cliente não comprova |

## Vincular um projeto

Na raiz do projeto, um `qa.project.json` define o que o Prumo pode ler e executar. A raiz vem do terminal ou da configuração MCP; a IA não consegue trocá-la. No aplicativo, ao vincular uma pasta sem contrato, o Prumo propõe um e só grava depois da sua confirmação.

```json
{
  "schemaVersion": 2,
  "id": "minha-api",
  "name": "Minha API",
  "context": { "documentation": ["README.md", "package.json"], "tests": ["tests/"], "code": ["src/"] },
  "commands": {
    "unit": {
      "executable": "node",
      "args": ["--test", "tests/api.test.mjs"],
      "cwd": ".",
      "env": { "TEST_MODE": "isolated" },
      "requiredEnv": ["TEST_MODE"],
      "requiredFiles": ["tests/api.test.mjs"],
      "timeoutMs": 10000,
      "maxOutputBytes": 65536
    }
  },
  "execution": { "requireApproval": true, "blockedByDefault": [], "environment": "host", "envAllowlist": ["TEST_MODE"], "readOnly": false }
}
```

- Caminhos relativos e existentes; campo desconhecido ou tipo errado é recusado. O esquema é `manifestoSchema` em `backend/compartilhado/tipos/projeto.ts`.
- Executável só `node` ou `npm`. A forma curta (`"unit": "npm run test:unit"`) aceita apenas `node <arquivos locais>`, `node --test <arquivos locais>` e `npm run <script existente>`; nada de `&&`, pipe, redirecionamento ou glob.
- `blockedByDefault` bloqueia mesmo com aprovação. `readOnly: true` bloqueia execução e gravação de evidência. Variáveis de segredo não entram nem pela allowlist.

## Conectar uma IA por MCP

Cada configuração vincula uma raiz; use outro nome de servidor para outro projeto. O assistente monta o comando e confere se o nome já existe:

```powershell
prumo.cmd conectar codex --root "$demo"          # pede confirmação digitada e chama o configurador do Codex
prumo.cmd conectar codex --json --root "$demo"   # só a proposta
prumo.cmd conectar claude --root "$demo"         # mostra o comando para você revisar e executar
```

À mão, a partir do Prumo compilado:

```powershell
$server = Join-Path (Get-Location) 'dist\mcp.js'
codex mcp add prumo-qa-demo -- node "$server" "$demo"
claude mcp add --transport stdio --scope user prumo-qa-demo -- node "$server" "$demo"
```

Cliente com JSON (Claude Desktop e outros): `"command": "node"`, `"args": ["<caminho>/dist/mcp.js", "<raiz do projeto>"]`, com caminhos absolutos. Abra uma sessão nova e peça `contexto_projeto` para confirmar. Rodar `node "$server" "$demo"` direto fica em silêncio esperando o protocolo; é normal.

| Ferramenta | O que faz |
|---|---|
| `contexto_projeto` | Stack, scripts e fontes lidas com hash; lacunas e omitidos |
| `revisar_cobertura` | Fatos, hipóteses, lacunas e seleção sugerida para um requisito; não executa |
| `executar_validacao` | Roda uma capability do contrato com aprovação humana |
| `consultar_evidencias` | Evidências locais verificadas, ou NOT_RUN |
| `listar_politicas` | O que a IA pode e não pode pedir neste projeto |
| `propor_caso`, `propor_bug` | Caso ou bug como rascunho local; não publica no Qase nem no Jira |
| `propor_aprendizado` | Aprendizado em rascunho para o conhecimento dos agentes; só você aprova |

O plano `backend/projetos/exemplos/plano-demo.json` é uma entrada completa de `revisar_cobertura`. Para inspecionar sem instalar nada: `npx.cmd @modelcontextprotocol/inspector --cli node "$server" "$demo" --method tools/list`.

### Skill de qualidade

A Skill `backend/agentes/skills/qa/SKILL.md` orienta o método da IA. O Codex lê `.agents/skills` e o Claude Code lê `.claude/skills`; copie para o projeto sem sobrescrever uma existente:

```powershell
foreach ($pasta in '.agents\skills\qa', '.claude\skills\qa') {
  $dest = Join-Path (Get-Location) $pasta
  if (Test-Path "$dest") { throw "Skill existente em ${dest}: escolha outro destino" }
  New-Item -ItemType Directory -Path "$dest" -Force | Out-Null
  Copy-Item '.\backend\agentes\skills\qa\SKILL.md' "$dest\SKILL.md"
}
```

Invoque explicitamente (`$qa` no Codex, `/qa` no Claude Code). Se o cliente vai usá-la sozinho depende dele; o MCP não obriga.

## Resultados e evidências

Evidência em `<raiz>/.prumo/evidencias/<job>.json` (integridade, logs mascarados, origem, escopo, horários) e resultado em `.prumo/resultados/<job>.json`. Coloque `.prumo/` no `.gitignore` do projeto e não traga evidências de empresas para este repositório.

O runner pode gravar os casos no arquivo indicado por `PRUMO_RESULT_FILE`:

```json
{ "jobId": "UUID de PRUMO_JOB_ID", "cases": [{ "id": "R1-editor", "status": "PASS", "evidence": "retorno 200 e leitura persistida" }] }
```

Há adaptadores para `node:test` e Playwright em `backend/testes/reporters/`. Sem relatório, exit 0 vale só para a rodada; um FAIL do processo nunca vira PASS.

## Testar

```powershell
npm.cmd run check            # dependências, tipos, build e a suíte inteira
npm.cmd run check:isolado    # sem Electron, SQLite nem rede externa; o que depende disso sai NOT_RUN
npm.cmd run test:selecionar -- --isolado --listar
```

Também há `test:unitarios`, `test:smoke`, `test:regressao`, `test:backend` e `test:frontend`. Nenhum teste toca banco ou projeto externo; os serviços e o broker humano são sintéticos na suíte. `check:isolado` não substitui o `check` nem é sandbox de segurança. Instalador e migração rodam no CI.

| Código | O que fazer |
|---|---|
| `INVALID_MANIFEST` | Confira versão, tipos, campos, `requireApproval: true` e caminhos |
| `PATH_FORBIDDEN`, `SECRET_FORBIDDEN`, `SYMLINK_FORBIDDEN` | Aponte para arquivos locais, não sensíveis, sem links |
| `HUMAN_APPROVAL_REQUIRED` | Use `approve`; nenhuma flag pula a aprovação |
| `POLICY_BLOCKED` | Capability bloqueada ou `readOnly` não roda, nem com aprovação |
| `RUNTIME_MISSING` | Falta o `npm-cli.js` junto ao Node; prefira `node` explícito |
| `CONTEXT_LIMIT` | Declare caminhos menores; o omitido não conta como lido |
| `TIMEOUT`, `OUTPUT_LIMIT`, `INVALID_RESULT` | Veja os logs e corrija a causa ou o runner |
| `EVIDENCE_TAMPERED`, `PROJECT_MISMATCH` | Não confie no arquivo nem reescreva hashes |

## Publicar uma versão

Siga [docs/RELEASE.md](docs/RELEASE.md) até o fim: número, catálogo, ajuda e site, `npm run check`, `main` e tag. O CI gera os instaladores, cria a release, marca o catálogo como publicado e republica o site; o aplicativo instalado avisa sozinho. Assinatura: [docs/ASSINATURA.md](docs/ASSINATURA.md).
