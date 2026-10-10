# Prumo QA 2.0

Camada local de engenharia de qualidade para agentes que já desenvolvem software. Entende o contexto autorizado de um projeto, confere estrutura de planos de teste, controla execução e preserva evidências. A IA hospedeira interpreta requisitos e riscos; o núcleo impõe regras determinísticas. Não exige outra chave de LLM.

CLI e servidor MCP stdio usam o mesmo núcleo. São quatro tools: `contexto_projeto`, `revisar_cobertura`, `executar_validacao`, `consultar_evidencias`. A Skill orienta o raciocínio; não é um modelo nem um mecanismo de permissão.

## Instalar no Windows PowerShell

Node **24 LTS** recomendado. Produção requer Node 22 ou superior; suíte usa module mocks experimentais do Node. Git para obter o projeto. Sem Docker, banco, frontend ou servidor remoto.

```powershell
git clone https://github.com/AnaPLysyk/Prumo-Qa.git
Set-Location .\Prumo-Qa
npm.cmd ci
npm.cmd run build
npm.cmd run check
```

Para usar os nomes `qa` sem alterar uma instalação anterior do QA Orchestrator, crie uma função só nesta sessão:

```powershell
$prumoEntry = Join-Path (Get-Location) 'dist\cli.js'
function qa { & node $prumoEntry @args }
qa help
```

Também pode usar `node .\dist\cli.js` ou `npm.cmd run qa --`. `npm.cmd link` instala o binário global `qa`, mas só faça isso quando ele não conflitar com outro programa. A construção não sobrescreve o `qa` antigo.

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `src/projeto.ts` | Schema v2, validação, leitura segura, inventário e contexto com fontes/hashes |
| `src/qualidade.ts` | Requisito/origem, riscos, oráculos, lacunas, duplicidade candidata e análise NOT_VERIFIED |
| `src/aprovacao.ts` + `scripts/aprovar.cs` | Broker de autenticação humana Windows compilado em dist/aprovar.exe, escopo/expiração, sem token da IA |
| `src/execucao.ts` | Capability declarada, preflight, ambiente mínimo, subprocesso, limites e classificação |
| `src/evidencias.ts` | Resultados da rodada/casos, armazenamento local, integridade e consulta isolada |
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

Exit do CLI: 0 para consulta/PASS, 1 para FAIL, 2 para BLOCKED/NOT_RUN/entrada inválida. `doctor` valida contrato e disponibilidade do provedor; não declara teste funcional aprovado.

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

Implementados núcleo local, contrato, quatro tools, CLI, aprovação Windows, Skill, exemplo e testes. Fora desta versão: frontend, dashboard, Docker, Kubernetes, daemon, filas, servidor remoto, banco central, treinamento de modelo, integrações corporativas e sandbox forte. Sem transferência automática entre empresas.

G3 é inspecionado por contrato externo readOnly e commands vazio, sem alterar seu repositório. E2E permanece bloqueado. Diagnóstico real e validações estão em docs/DIAGNOSTICO-G3.md e docs/VALIDACAO.md. Autenticação humana end-to-end e plataformas sem Windows podem exigir participação posterior, descrita no relatório de entrega. Nenhuma pendência é mascarada por PASS.
