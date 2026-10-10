# Prumo QA 2.4 — Contextos, conhecimento de QA e laboratório

Camada local de engenharia de qualidade para agentes que já desenvolvem software. Entende o contexto autorizado de um projeto, confere estrutura de planos de teste, controla execução e preserva evidências. A IA hospedeira interpreta requisitos e riscos; o núcleo impõe regras determinísticas. Não exige outra chave de LLM.

CLI e servidor MCP stdio usam o mesmo núcleo. São quatro tools: `contexto_projeto`, `revisar_cobertura`, `executar_validacao`, `consultar_evidencias`. A Skill orienta o raciocínio; não é um modelo nem um mecanismo de permissão.

A versão 2.1 acrescenta um terminal de acompanhamento, histórico local e métricas derivadas das operações realmente observadas. Contexto, revisão estrutural, consultas, logs e métricas funcionam sem IA conectada. A IA externa continua responsável por interpretar requisitos e riscos. Não há chat independente, segunda chave de LLM nem telemetria remota.

```text
Claude / Codex / IA compatível
               |
          MCP local stdio
               |
     Prumo QA: quatro ferramentas <--- CLI
               |
        Núcleo de qualidade
               |
    Atividades       Evidências de testes
    dados do usuário .prumo do projeto
               |
         Terminal Prumo
```

O terminal consulta arquivos locais; a IA não precisa permanecer ligada. Uma chamada MCP concluída não equivale a teste PASS. A imagem de referência usa números ilustrativos; o programa mostra somente o seu histórico.

## Novidades da 2.4

- **Contextos por projeto**: requisitos, regras, critérios, restrições e decisões com estados RASCUNHO/APROVADO/CONFLITANTE/DESATUALIZADO, aprovação humana, histórico verificável por hash, isolamento e exclusão com confirmação. Só vão à IA se você habilitar (ver [docs/APLICATIVO.md](docs/APLICATIVO.md)).
- **`revisar_cobertura` com `contextoId`** e **`contexto_projeto`** com contextos autorizados, frameworks detectados e conhecimento aplicável.
- **Playwright e API REST**: detecção por evidência real, 12 regras de análise de testes com fonte oficial e Skills especializadas.
- Marcos: [docs/MARCOS.md](docs/MARCOS.md) (2.3.1 estabilização/assinatura, 2.4.0 contextos, 2.5.0 suporte e notificações); [docs/ASSINATURA.md](docs/ASSINATURA.md) e [docs/INSTALACAO-MANUAL.md](docs/INSTALACAO-MANUAL.md).

## Novidades da 2.3

- **Ajuda › Integrações técnicas**: catálogo das 20 operações IPC da janela e das 4 ferramentas MCP, gerado do código ([docs/CONTRATOS.md](docs/CONTRATOS.md)) e conferido por testes. Não existe API HTTP.
- **Ajuda › Versões**: histórico detalhado de 2.0.0 a 2.3.0, offline, de uma fonte única (`app/versoes.json`) que também gera as notas de release.
- **Ajuda › Atualizações**: verificação **manual** da release oficial; nada é baixado nem instalado. Atualizar sobre a versão anterior preserva projetos, histórico, métricas e evidências (testado no CI com a 2.2.0 publicada).
- **Ajuda › Privacidade e dados**: pasta real, espaço usado, retenção, exportação e exclusão controlada por escopo, com confirmação nativa.
- **Central de ajuda** reorganizada (guia, perguntas frequentes expansíveis, problemas comuns) e **diagnóstico da interface** separado das métricas de QA.
- **Prumo QA Lab**: projeto independente (pasta irmã Prumo-QA-Lab; o repositório remoto AnaPLysyk/Prumo-QA-Lab ainda precisa ser criado, veja [docs/ENTREGA-2.3.md](docs/ENTREGA-2.3.md)) com oito situações controladas para avaliar o próprio Prumo pelo MCP real.

## Aplicativo desktop (2.2)

A versão 2.2 acrescenta uma **janela desktop** (Electron) para consultar projetos, métricas, logs, histórico, evidências, conexões de IA e a ajuda (privacidade e termos em rascunho). É só apresentação: usa o mesmo núcleo, não executa testes e não altera projetos. O servidor MCP continua sendo iniciado pelo cliente de IA e **não depende da janela**.

Para usar sem PowerShell, baixe o instalador `Prumo-QA-Setup-<versão>.exe` na página de *Releases* do repositório (não exige Node.js). O instalador **não é assinado**: o SmartScreen ou o Smart App Control podem alertar ou bloquear, e o Prumo não contorna isso. Para desenvolver ou gerar o instalador:

```powershell
npm.cmd ci
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue   # se definido pelo terminal
npm.cmd run app      # abre a janela em desenvolvimento
npm.cmd run dist     # release\Prumo-QA-Setup-<versão>.exe
```

Arquitetura, dados, segurança da janela, troca do ícone (`assets/`), release pelo GitHub Actions e limitações do Smart App Control estão em [docs/APLICATIVO.md](docs/APLICATIVO.md).

## Instalar no Windows PowerShell

Node **24 LTS** recomendado. Produção requer Node 22 ou superior; suíte usa module mocks experimentais do Node. Git para obter o projeto. Sem Docker, banco, frontend ou servidor remoto.

```powershell
git clone https://github.com/AnaPLysyk/Prumo-Qa.git
Set-Location .\Prumo-Qa
npm.cmd ci
npm.cmd run build
npm.cmd run check
```

Para instalar o comando localmente a partir deste código, sem publicar no npm:

```powershell
npm.cmd pack                  # prepack compila TypeScript e broker
npm.cmd install --global '.\prumo-qa-2.2.0.tgz'
prumo.cmd help
$demo = Join-Path (Get-Location) 'exemplos\projeto-demo'
prumo.cmd --root "$demo"
```

Use `prumo` quando a política do PowerShell permitir; `prumo.cmd` evita selecionar o shim `.ps1`. O único binário npm registrado agora é **prumo**: a instalação não cria nem substitui `qa`. Não usamos `force`. Se já existir outro programa chamado prumo, escolha `npm.cmd install --global --prefix '<pasta própria>' '<pacote.tgz>'` e execute seu `prumo.cmd` por caminho absoluto. Node deve estar no PATH.

O pacote contém dist (incluindo o broker Windows quando compilado no Windows), Skill, documentação e fonte do broker. Não inclui projetos analisados, histórico, prompts, testes privados, dependências instaladas ou anexos. `private: true` e `UNLICENSED` foram preservados; a titular ainda precisa decidir uma licença para distribuição a terceiros. Este fluxo comprova instalação local, sem npm publish ou instalador desktop. Em outra máquina Windows, prefira clonar e empacotar nela; políticas de Controle de Aplicativo podem bloquear o broker não assinado. Nunca desative políticas para liberar uma rodada.

## Terminal e acompanhamento

```powershell
prumo.cmd doctor --root "$demo"
prumo.cmd --root "$demo"                 # menu em terminal interativo
prumo.cmd atividade --root "$demo"
prumo.cmd logs --follow --root "$demo"   # Ctrl+C encerra; sem daemon
prumo.cmd metricas --root "$demo"
prumo.cmd evidencias --root "$demo"
prumo.cmd atividade --json --root "$demo"
prumo.cmd metricas --json --root "$demo"
prumo.cmd logs --json --root "$demo"     # JSONL, uma linha por evento
```

Sem `--root`, usa o diretório atual, sem busca por projetos vizinhos. Se não houver contrato válido, o menu interativo solicita uma raiz absoluta; não cria manifesto nem altera o projeto. `doctor` explica problemas de contrato. Fora de TTY, o painel termina após imprimir; não fica esperando entrada. Os comandos antigos `context`, `review`, `run`, `approve`, `evidence` continuam disponíveis via prumo/node e preservam saída JSON. Consultar atividade/logs/métricas não gera novas operações; consultar evidências usa o núcleo e é registrado.

O painel informa a **última chamada MCP observada**, com identidade declarada pelo cliente. Não anuncia conexão ativa ou acesso a conversas externas. Histórico vazio mostra zero operações, nenhuma atividade e duração indisponível.

### Logs e métricas verificáveis

No Windows, histórico em `%LOCALAPPDATA%\PrumoQA\projects\<hash-da-raiz-e-id>\<operação-UUID>.jsonl`. Em outros sistemas, `~/.local/share/prumo-qa/projects/…`. Pode escolher um diretório absoluto externo com `$env:PRUMO_DATA_DIR = 'C:\dados\PrumoQA'`; configure o mesmo ambiente para servidor e terminal. Raízes/diretórios com links e destinos dentro do projeto analisado são recusados.

O assistente `conectar` inclui somente PRUMO_DATA_DIR na proposta quando essa variável foi definida; não copia outras variáveis do processo para a configuração. O terminal precisa usar o mesmo valor nas sessões seguintes.

Cada operação tem início e término, timestamps UTC, duração monotônica, origem CLI/MCP, ferramenta, estado e resumo. Projeto e raiz são identificados por hashes; nomes/caminhos completos são resolvidos localmente pelo contrato. Entradas de revisão armazenam somente quantidades e presença de requisito/origem. Saídas armazenam tipos/contagens e recomendações genéricas do catálogo público, sem copiar texto de requisito, cenário, conflito, credencial, código ou resposta extensa. `evidenceJobId` referencia a evidência existente; seu conteúdo não é duplicado. Pino emite JSON e severidades info/warn/error, com redação defensiva e sem stdout do MCP.

`manifestHash` identifica o vínculo carregado ao iniciar o CLI/servidor. Tools revalidam o contrato; evidências de execução preservam seu próprio hash/escopo efetivo. Alterar o id do projeto durante uma sessão MCP exige reiniciar o servidor e não transfere histórico para a nova identidade.

| Indicador | Definição |
|---|---|
| Chamadas MCP | Operações tools/call observadas, incluindo erros; handshake/tools/list não são análises |
| Contextos e revisões | Términos NOT_VERIFIED dessas ferramentas; rejeição de entrada não conta como análise feita |
| Achados/recomendações | Ocorrências retornadas; repetir revisão soma ocorrências, não mede problemas únicos ou mudanças aplicadas |
| Lacunas | Achados MISSING_*, UNVERIFIED_*, TRACEABILITY_GAP, COVERAGE_GAP e CONTRADICTORY_REQUIREMENT |
| Redundâncias candidatas | Ocorrências POTENTIAL_REDUNDANCY, sem declarar equivalência semântica comprovada |
| Execuções solicitadas | Chamadas à ferramenta de execução, inclusive inválidas/incompletas |
| PASS/FAIL/BLOCKED/NOT_RUN | Somente estados retornados pela execução; consultas/revisões não incrementam PASS |
| Duração média | Términos válidos; início sem término não recebe duração inventada |
| Tokens, custos, alterações aplicadas | Indisponíveis; não recebemos comprovação do cliente/provedor |

Histórico usa arquivo exclusivo por operação e fsync, schema estrito, checksum e vínculo de projeto. Limites: 10.000 arquivos, 32 KiB por operação e 32 MiB por leitura. Não apaga dados por rotação automática; ao atingir limite, arquive manualmente a pasta fora de `projects` com processos parados. Métricas abrangem os registros presentes. Uma linha final parcial é sinalizada; arquivo inválido é excluído das métricas com aviso **HISTORY_INCOMPLETE**, nunca silenciosamente. Início sem término aparece como “sem término observado”, não PASS/NOT_RUN. Hashes detectam corrupção, não adulteração por quem pode reescrevê-los.

Falha ao gravar gera `PRUMO_OBSERVABILITY_ERROR` em stderr com UUID/fase, sem texto privado de erro. O resultado original do núcleo é preservado; CLI mantém exit 1/2 de FAIL/BLOCKED e usa 3 quando uma consulta bem-sucedida perde observabilidade. MCP preserva o contrato de resposta e comunica o problema por stderr do processo, que o cliente deve capturar. Sem acesso ao disco, o evento não pode ser persistido: contadores não representam operações perdidas. Logs de teste permanecem isolados do perfil real.

## Assistente de conexão

```powershell
prumo.cmd conectar codex --root "$demo"
prumo.cmd conectar codex --json --root "$demo"   # só proposta, nenhuma escrita
prumo.cmd conectar claude --root "$demo"         # comando manual revisável
```

O assistente valida o contrato, localiza o cliente e apresenta raiz, destino, nome único e comando PowerShell com caminhos escapados. No Codex nativo, exige digitar a confirmação exibida em TTY antes de chamar o configurador oficial. Consulta configurações existentes e recusa sobrescrever o mesmo nome; falha de inspeção impede escrita. Não há `--yes`. Fora de TTY/JSON ou com cliente ausente/shim .cmd, mostra a proposta para execução posterior. Execute o comando proposto somente após revisar o destino e verificar que o nome não existe. Configuração não comprova sessão ativa; reabra o cliente e peça uma chamada `contexto_projeto`. Claude Code está documentado, mas não foi executado neste ambiente.

Para usar os nomes `qa` sem alterar uma instalação anterior do QA Orchestrator, crie uma função só nesta sessão:

```powershell
$prumoEntry = Join-Path (Get-Location) 'dist\cli.js'
function qa { & node $prumoEntry @args }
qa help
```

Também pode usar `node .\dist\cli.js`, `npm.cmd run prumo --` ou o script compatível `npm.cmd run qa --`. A função qa acima só existe na sessão; o pacote 2.1 registra exclusivamente prumo.

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `src/projeto.ts` | Schema v2, validação, leitura segura, inventário e contexto com fontes/hashes |
| `src/qualidade.ts` | Requisito/origem, riscos, oráculos, lacunas, duplicidade candidata e análise NOT_VERIFIED |
| `src/aprovacao.ts` + `scripts/aprovar.cs` | Broker de autenticação humana Windows compilado em dist/aprovar.exe, escopo/expiração, sem token da IA |
| `src/execucao.ts` | Capability declarada, preflight, ambiente mínimo, subprocesso, limites e classificação |
| `src/evidencias.ts` | Resultados da rodada/casos, armazenamento local, integridade e consulta isolada |
| `src/atividades.ts` | Diário JSONL externo com Pino, privacidade, integridade, contadores e acompanhamento |
| `src/conexoes.ts` | Proposta revisável e configuração Codex mediante confirmação, sem sobrescrita |
| `src/vinculos.ts` | Lista local de projetos vinculados; diagnóstico sem escrever na pasta do projeto |
| `src/painel.ts` | Adaptador da janela: valida, exige projeto vinculado e delega ao núcleo (sem regra própria) |
| `src/contratos.ts` | Fonte única dos esquemas IPC e do catálogo técnico (IPC + MCP) |
| `src/contextos.ts` | Contextos persistentes por projeto: estados, aprovação, conflito, histórico encadeado por hash, leitura controlada pelo MCP |
| `src/frameworks.ts`, `skills/playwright`, `skills/api-rest` | Detecção de framework por evidência e análise de testes Playwright (`PW_*`) com fontes oficiais |
| `src/contextoCompleto.ts` | Resposta de `contexto_projeto`: contexto autorizado + frameworks + contextos habilitados |
| `src/versoes.ts`, `app/versoes.json` | Histórico de versões validado, comparação semântica e notas de release |
| `src/atualizacao.ts` | Verificação manual de atualização: destino fixo, timeout, resposta validada, sem download |
| `src/dados.ts`, `src/diagnostico.ts` | Resumo dos dados locais e diagnóstico IPC (só metadados, fora das métricas) |
| `src/desktop/main.ts` | Processo Electron: janela, IPC validado, diálogos nativos |
| `app/preload.cjs`, `app/renderer/` | Ponte mínima (`window.prumo`) e interface HTML/CSS/JS sem frameworks |
| `app/ajuda/*.md` | Documentos da aba Ajuda (inclui privacidade e termos em rascunho) |
| `electron-builder.yml`, `assets/` | Instalador NSIS e ícone substituível |
| `.github/workflows/windows.yml` | Testes, instalador, instalação em pasta com espaços e release por tag |
| `src/mcp.ts` | Adaptador do SDK oficial, exatamente quatro tools, stdout só para protocolo |
| `src/cli.ts` | Adaptador terminal, mesmos controles do núcleo |
| `skills/qa/SKILL.md` | Método de qualidade aplicável do ISTQB, sem meta fixa de cenários |
| `testes/*.test.mjs` | Contrato, segurança, subprocessos, CLI, MCP real e aceitação sintética |
| `exemplos/projeto-demo` | Produto fictício de publicações, dados em memória e testes reais |
| `exemplos/plano-demo.json` | Revisão rastreável com cenário duplicado |
| `exemplos/g3-somente-leitura.json` | Contrato externo restrito, sem comandos, para G3 |
| `scripts/demonstrar.mjs` | Demonstração CLI/MCP com logs reais; sem simular aprovação humana |
| `docs/` | Segurança, proveniência, validação, diagnóstico e entrega |

## Vincular um projeto

Na raiz autorizada, crie `qa.project.json`. Não existe cadastro global duplicado: a raiz vem do terminal ou da configuração MCP. A IA não pode trocá-la por argumento de tool.

```json
{
  "schemaVersion": 2,
  "id": "minha-api",
  "name": "Minha API",
  "context": {
    "documentation": ["README.md", "package.json"],
    "tests": ["tests/"],
    "code": ["src/"]
  },
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
  "execution": {
    "requireApproval": true,
    "blockedByDefault": [],
    "environment": "host",
    "envAllowlist": ["TEST_MODE"],
    "readOnly": false
  }
}
```

Paths são relativos; os diretórios/arquivos de contexto, cwd e entrypoints precisam existir. Pré-condições ausentes bloqueiam a execução, mas permitem inspecionar contexto. Campos desconhecidos/tipos incorretos são recusados. v1 não é convertido silenciosamente. Schema runtime é `manifestoSchema` em projeto.ts.

O formato simples do HTML v2 (`"unit": "npm run test:unit"`) funciona pela gramática restrita. Só `node <arquivos locais>` / `node --test <arquivos locais>` e `npm run <script>` são aceitos. Nenhum `&&`, pipe, redirecionamento, eval, loader, glob ou parâmetro de prompt entra no shell. Para caminhos com espaços use objeto com args separados. Script npm precisa existir em package.json do cwd. Revise scripts antes de autorizá-los.

`blockedByDefault` é bloqueio efetivo: aprovação não o remove. `readOnly: true` bloqueia todas as execuções e escritas de evidência. Variáveis de segredo e reconfiguração do runtime não são aceitas, mesmo na allowlist.

## Usar CLI e aprovação

```powershell
$demo = Join-Path (Get-Location) 'exemplos\projeto-demo'
qa doctor --root "$demo"
qa context --root "$demo"
qa review '.\exemplos\plano-demo.json' --root "$demo"
qa run unit --root "$demo"       # BLOCKED: sem consentimento
qa approve unit --root "$demo"   # CredUI nativo; senha Windows da conta atual
qa evidence --root "$demo"
# qa evidence '<UUID devolvido pela execução>' --root "$demo"
npm.cmd run demo
```

`approve` autentica a pessoa e executa uma única rodada no mesmo processo; não cria uma autorização reutilizável. A janela mostra projeto, raiz, capability, comando e SHA256. Cancelamento, senha inválida, alteração do escopo e expiração bloqueiam. Não aceite uma IA preencher credenciais. Conta só com PIN/Hello precisa de uma senha Windows compatível com LogonUser; outros sistemas permanecem bloqueados para execução. CLI funciona para contexto/revisão/evidências em outras plataformas, ainda sem aprovação nativa implementada.

Exit do CLI: 0 para consulta/PASS, 1 para FAIL, 2 para BLOCKED/NOT_RUN/entrada inválida, 3 para histórico parcial/falha de observabilidade quando não há falha do núcleo. `doctor` valida contrato e informa o provedor; não comprova autenticação nem liberação pelo Windows.

## Conectar MCP local

Cada configuração vincula **uma raiz**. Use outro nome de servidor para outro projeto. Nenhum serviço remoto do ChatGPT recebe acesso automático a arquivos locais.

PowerShell, a partir do Prumo compilado:

```powershell
$server = Join-Path (Get-Location) 'dist\mcp.js'
$demo = Join-Path (Get-Location) 'exemplos\projeto-demo'
codex mcp add prumo-qa-demo -- node "$server" "$demo"
codex mcp get prumo-qa-demo
# Abra nova sessão Codex para carregar o servidor.
```

Claude Code, instalado separadamente:

```powershell
claude mcp add --transport stdio --scope user prumo-qa-demo -- node "$server" "$demo"
claude mcp get prumo-qa-demo
# Dentro do Claude Code: /mcp
```

Para Claude Desktop/cliente JSON:

```json
{
  "mcpServers": {
    "prumo-qa-demo": {
      "command": "node",
      "args": ["C:/projetos/Prumo-Qa/dist/mcp.js", "C:/projetos/Prumo-Qa/exemplos/projeto-demo"]
    }
  }
}
```

Use caminhos absolutos reais da máquina; se Node não estiver no PATH do cliente, informe o caminho absoluto de node.exe. Início manual `node "$server" "$demo"` espera stdin do protocolo; tela silenciosa é normal. Logs internos somente stderr.

Entradas/saídas das tools:

| Tool | Entrada | Resultado |
|---|---|---|
| contexto_projeto | `{}` | Tipo/stack inferidos, scripts, fontes consultadas com hashes, omitidos/lacunas; NOT_VERIFIED |
| revisar_cobertura | requirement, source, sourcePath opcional, existingTests, candidates, contradictions opcional | Fatos de leitura, hipóteses, lacunas, findings e seleção estrutural sugerida; executed=false |
| executar_validacao | capability, solicitarAprovacao opcional | Job, comando efetivo, exit, status, logs e casos reais se disponíveis |
| consultar_evidencias | jobId e/ou criterio opcionais | Registros locais verificados, ou NOT_RUN sem evidência |

O plano de exemplo é entrada completa de revisar_cobertura. Cenários têm id, behavior, source, risk, expected, oracle, technique e, quando aplicáveis, partition/conditions/boundary/testPath/blockedReason. Contradições semânticas são informadas pela IA; o núcleo não finge compreendê-las sozinho.

O SDK Client faz handshake e tools/list/tools/call reais nos testes. Inspector opcional, sem instalação global:

```powershell
npx.cmd @modelcontextprotocol/inspector --cli node "$server" "$demo" --method tools/list
```

## Disponibilizar a Skill

Codex reconhece `.agents/skills` no projeto e no perfil; Claude Code reconhece `.claude/skills`. A pasta `skills/qa` deste pacote é fonte portátil e não é carregada universalmente por todos os hosts. Instale em um projeto autorizado, sem sobrescrever uma Skill existente:

```powershell
$destCodex = Join-Path (Get-Location) '.agents\skills\qa'
if (Test-Path "$destCodex") { throw 'Skill existente: escolha outro destino' }
New-Item -ItemType Directory -Path "$destCodex" -Force | Out-Null
Copy-Item '.\skills\qa\SKILL.md' "$destCodex\SKILL.md"
# Em nova sessão Codex, invoque $qa explicitamente.

$destClaude = Join-Path (Get-Location) '.claude\skills\qa'
if (Test-Path "$destClaude") { throw 'Skill existente: escolha outro destino' }
New-Item -ItemType Directory -Path "$destClaude" -Force | Out-Null
Copy-Item '.\skills\qa\SKILL.md' "$destClaude\SKILL.md"
# Claude Code: /qa
```

Seleção automática é comportamento do cliente/modelo, sem garantia universal. Para repetir uma avaliação, invoque a Skill e solicite as tools explicitamente. MCP sozinho não obriga uso da metodologia.

Referências oficiais: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Skills Codex](https://learn.chatgpt.com/docs/build-skills), [MCP Claude Code](https://code.claude.com/docs/en/mcp), [Skills Claude Code](https://code.claude.com/docs/en/skills), [SDK MCP](https://github.com/modelcontextprotocol/typescript-sdk), [Agent Skills](https://agentskills.io/specification).

## Resultados e runner

Evidências ficam em `<raiz>/.prumo/evidencias/<job>.json`, com envelope de integridade, logs redigidos, origem, escopo e timestamps. Artefato individual: `.prumo/resultados/<job>.json`. Acrescente `.prumo/` ao .gitignore do projeto vinculado. Não copie evidências de empresas para este repositório.

Um runner pode gravar no arquivo recebido em `PRUMO_RESULT_FILE`:

```json
{ "jobId": "UUID recebido em PRUMO_JOB_ID", "cases": [{ "id": "R1-editor", "status": "PASS", "evidence": "assertions executadas: retorno 200 e leitura persistida" }] }
```

Sem esse relatório, exit 0 vale apenas para a rodada. FAIL de processo não vira PASS por relatório. Não há parser universal de Playwright/JUnit neste MVP; adapte o runner existente ou use somente classificação da rodada. Consulte docs/SEGURANCA.md para confiança, limites e isolamento.

## Testar e diagnosticar

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd audit
npm.cmd run demo
```

Testes sintéticos cobrem PASS/FAIL/BLOCKED/NOT_RUN, paths, symlinks, manifesto, segredo, timeout, pré-condições, autorização, MCP e CLI. Broker humano é double apenas na suíte; execução de subprocessos e assertions é real. Demonstração padrão comprova consultas e bloqueio sem consentimento; para comprovar a rodada autorizada use `qa approve unit` pessoalmente. Não afirmamos que isso já aconteceu sem registro de autenticação.

- INVALID_MANIFEST: confira versão/tipos/campos, requireApproval=true e caminhos reais.
- PATH_FORBIDDEN/SECRET_FORBIDDEN/SYMLINK_FORBIDDEN: ajuste contrato para arquivos locais não sensíveis sem links.
- HUMAN_APPROVAL_REQUIRED: use approve e autenticação Windows; nenhuma flag ignora esse gate.
- POLICY_BLOCKED: capability readonly/bloqueada não será executada, inclusive com consentimento.
- RUNTIME_MISSING: npm-cli.js precisa estar junto à instalação Node; prefira entrypoint node explícito.
- CONTEXT_LIMIT: declare caminhos menores. Arquivos omitidos não contam como consultados.
- TIMEOUT/OUTPUT_LIMIT/INVALID_RESULT: consulte logs; preserve BLOCKED e corrija causa/runner.
- EVIDENCE_TAMPERED/PROJECT_MISMATCH: não confie em arquivo corrompido/copied; não reescreva hashes para fabricar sucesso.

## Estado e limites

Implementados núcleo local, contrato, quatro tools, CLI/menu, atividades, métricas, Pino, conector Codex, aprovação Windows, Skill, exemplo, testes e, na 2.2, a janela desktop com instalador Windows (NSIS, não assinado). Fora desta versão: atualização automática, dashboard web, Docker, Kubernetes, daemon, filas, servidor remoto, banco central, treinamento de modelo, integrações corporativas, sandbox forte, assinatura de código, atualização automática, Ink, OpenTelemetry e métricas de provedores. Sem transferência automática entre empresas. Detalhes da entrega atual em [docs/ENTREGA-2.2.md](docs/ENTREGA-2.2.md); relatórios 2.0 e 2.1 são históricos.

G3 é inspecionado por contrato externo readOnly e commands vazio, sem alterar seu repositório. E2E permanece bloqueado. Diagnóstico real e validações estão em docs/DIAGNOSTICO-G3.md e docs/VALIDACAO.md. Autenticação humana end-to-end e plataformas sem Windows podem exigir participação posterior, descrita no relatório de entrega. Nenhuma pendência é mascarada por PASS.
