# Prumo QA 2.11 — Plataforma desktop de engenharia de qualidade

## Onde fica cada coisa

Procure pelo nome da tela que aparece no menu: a mesma pasta existe no frontend e no backend.

| Quero mexer em… | Vá para |
| --- | --- |
| O que aparece numa tela | `frontend/<tela>/` (fonte única; `dist/renderer/` é gerado no build) |
| O que a tela faz por trás (canais, regras, dados, integrações) | `backend/<tela>/` com `api/`, `regras/`, `banco/`, `integracoes/`, `tipos/` |
| Componentes e estilos comuns | `frontend/design-system/` e `frontend/compartilhado/` |
| Skills dos agentes | `backend/agentes/skills/` (arquivos do aplicativo) e o banco `skills.db` ([docs/SKILLS.md](docs/SKILLS.md)) |
| Testes | `testes/<tipo>/<camada>/` ([testes/LEIA-ME.md](testes/LEIA-ME.md)) |
| Build, empacotamento, release, documentação gerada | `ferramentas/<finalidade>/` |
| Site público | `site/gerar.mjs`, `site/componentes/`, `site/estilos/` |
| Ajuda do aplicativo e do site | `docs/ajuda/*.md` |
| Ver tudo isso dentro do aplicativo | Administração › Documentação viva (gerada do código no build) |

Mapa completo: [Arquitetura modular por tela](docs/ARQUITETURA-MODULAR-ATUAL.md) · [índice do backend](backend/LEIA-ME.md) · [seleção de testes](docs/TESTES.md). `npm.cmd run check` confere dependências, tipos e a suíte inteira.

Versão atual 2.12.0; releases publicadas em [github.com/AnaPLysyk/Prumo-Qa/releases](https://github.com/AnaPLysyk/Prumo-Qa/releases) (a 2.8.0 e a 2.7.0 não foram alteradas). [Agendamentos e worker](docs/AGENDAMENTOS.md) · [reaproveitamento](docs/REAPROVEITAMENTO-2.8.md) · [baseline 2.8](docs/BASELINE-2.8.md). [Documentação pública](https://prumo-qa-docs.onrender.com) · [baseline 2.7](docs/BASELINE-2.7.md) · [contratos dos serviços](docs/SERVICOS.md). Instalador sem assinatura; publicação depende das verificações obrigatórias.

## Ciclo de qualidade e IA

[Guia do ciclo](docs/CICLO-QUALIDADE.md): projeto → requisitos → casos e cenários → execução manual/automatizada → evidências → revisão → aprendizado. Início, chat flutuante e Agentes compartilham o orquestrador, perfil local, memória da sessão e revisão de conhecimentos. Aprendizados de IA permanecem rascunhos até decisão da pessoa.

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

O backend é organizado **por tela**: `backend/<tela>/` tem a mesma pasta que a tela tem no frontend. Dentro de cada tela, `api/` atende os pedidos da janela (um arquivo por canal IPC, com o nome do canal), `regras/` decide, `banco/` lê e grava os dados deste computador, `integracoes/` fala com Jira, Qase, GitHub ou IA e `tipos/` descreve o formato dos dados. Cada arquivo começa com uma frase dizendo o que faz; os canais de `api/` têm um arquivo por canal e as regras reúnem suas funções auxiliares privadas no mesmo arquivo. O índice completo, gerado do código, está em [backend/LEIA-ME.md](backend/LEIA-ME.md) e em cada `backend/<tela>/LEIA-ME.md`.

| Caminho | Responsabilidade |
|---|---|
| `backend/aplicativo.ts` | Porta de entrada do aplicativo desktop (Electron): pasta de dados, canais da janela, janela, bandeja e worker |
| `backend/cli.ts` | Porta de entrada do terminal (`prumo`); comandos em `backend/terminal/` |
| `backend/mcp.ts` | Porta de entrada do servidor MCP (`dist/mcp.js`, mesmo caminho das versões anteriores); ferramentas em `backend/agentes/mcp/` |
| `backend/aplicativo/api/catalogoDeContratos.ts` | Fonte única dos esquemas IPC e do catálogo técnico (IPC + MCP); `registrarCanaisIpc.ts` liga cada canal ao arquivo `api/` da tela |
| `backend/compartilhado/` | Só o que várias telas usam: contrato `qa.project.json` (`projeto/`), leitura segura e máscara de segredos (`seguranca/`), erros, textos e pasta de dados |
| `backend/execucoes/` + `ferramentas/empacotamento/aprovar.cs` | Executar capacidade com aprovação humana do Windows (`dist/aprovar.exe`), histórico de execuções e comentário de resultado no Jira |
| `backend/agendamentos/` | Rotinas, fila, worker residente, autorizações prévias e k6 |
| `backend/testes/` | Catálogo de testes, frameworks e análise Playwright, revisão de cobertura, runs e escrita no Qase |
| `backend/tickets/` | Propostas de caso/bug e escrita no Jira |
| `backend/conexoes/` | Contas de serviço com credencial protegida, transporte HTTPS, escrita externa controlada, GitHub e conexão das IAs pelo MCP |
| `backend/agentes/` | Chat com agentes, bancos de conhecimento e de Skills (SQLite local), políticas da IA e servidor MCP |
| `backend/contextos/`, `backend/evidencias/`, `backend/logs/`, `backend/projetos/` … | Uma pasta por tela, cada uma com seu `LEIA-ME.md` |
| `backend/aplicativo/preload.cjs` | Ponte mínima (`window.prumo`) entre a janela e os canais IPC |
| `frontend/<tela>/` → `dist/renderer/` | Interface HTML/CSS/JS sem frameworks; `dist/renderer/` é gerado no build e não é versionado |
| `docs/ajuda/*.md` | Documentos da aba Ajuda (inclui privacidade e termos em rascunho) |
| `electron-builder.yml`, `assets/` | Instalador NSIS e ícone substituível |
| `.github/workflows/windows.yml` | Testes, instalador, instalação em pasta com espaços e release por tag |
| `backend/agentes/skills/qa/SKILL.md` | Método de qualidade aplicável do ISTQB, sem meta fixa de cenários |
| `testes/<tipo>/<camada>/` | Unitários, contratos (IPC, MCP), integração, segurança, E2E na janela real e migração; regras do repositório em `testes/estrutura/` |
| `ferramentas/` | Ferramentas por finalidade: arquitetura, documentação, frontend, empacotamento, release, migração, site, qa, skills e testes |
| `backend/projetos/exemplos/projeto-demo` | Produto fictício de publicações, dados em memória e testes reais |
| `backend/projetos/exemplos/plano-demo.json` | Revisão rastreável com cenário duplicado |
| `backend/projetos/exemplos/g3-somente-leitura.json` | Contrato externo restrito, sem comandos, para G3 |
| `ferramentas/demonstracao/demonstrar.mjs` | Demonstração CLI/MCP com logs reais; sem simular aprovação humana |
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

Paths são relativos; os diretórios/arquivos de contexto, cwd e entrypoints precisam existir. Pré-condições ausentes bloqueiam a execução, mas permitem inspecionar contexto. Campos desconhecidos/tipos incorretos são recusados. v1 não é convertido silenciosamente. Schema runtime é `manifestoSchema` em `backend/compartilhado/tipos/projeto.ts`.

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

Codex reconhece `.agents/skills` no projeto e no perfil; Claude Code reconhece `.claude/skills`. A pasta `backend/agentes/skills/qa` deste pacote é fonte portátil e não é carregada universalmente por todos os hosts. Instale em um projeto autorizado, sem sobrescrever uma Skill existente:

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
