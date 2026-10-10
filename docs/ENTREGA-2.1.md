# Entrega — Prumo QA 2.1

Data: 10/10/2026. [Repositório oficial](https://github.com/AnaPLysyk/Prumo-Qa). Incremento funcional de observabilidade e terminal, com análise real pelo Codex e persistência comprovada após reinício. **A aprovação humana real continua não comprovada; existe bloqueio intermitente do broker pela política de Controle de Aplicativo do Windows.** Isso não foi ocultado, dispensado nem convertido em teste aprovado.

## Implementação

- `src/atividades.ts`: Pino 10.4.0, JSONL externo por operação/projeto, início/término, origem, duração, estados, contagens, recomendações públicas, referência de job, checksum, validação, limites, consultas e acompanhamento cancelável.
- `src/mcp.ts`: preserva as quatro tools e schemas. Observa a fronteira tools/call para incluir rejeições do SDK e ferramentas desconhecidas, mantém stdout exclusivo do protocolo e impede trocar a identidade vinculada durante a sessão.
- `src/cli.ts`: comando prumo, menu em português, atividade, logs/--follow, metricas, evidencias, doctor e --json. Preserva os subcomandos anteriores e executa o mesmo núcleo.
- `src/conexoes.ts`: reconhece cliente, prepara nome por projeto/raiz, exibe destino e argv, exige confirmação em TTY para Codex nativo e preserva nomes já existentes. Não há flag de aprovação automática.
- `package.json`/lock: versão 2.1.0, somente bin `prumo`, prepack com build, dependência Pino fixada; private/UNLICENSED preservados. Nenhum pacote publicado em registro externo.
- `testes/atividades.test.mjs` e `testes/conexoes.test.mjs`: 20 verificações novas. Fixtures passaram a manter dados de observabilidade fora dos projetos e do perfil real. Assertions dos 40 testes anteriores foram preservadas.
- README e docs: instalação, arquitetura, métricas, privacidade, limites, integração, origem das referências e relatório real.

`projeto.ts`, `qualidade.ts`, `aprovacao.ts`, `execucao.ts`, `evidencias.ts` e o broker `scripts/aprovar.cs` não foram alterados. A Skill existente foi lida e preservada. Não houve modificação no QA Orchestrator antigo ou no G3. As únicas ideias aproveitadas das referências e suas licenças estão em [ORIGEM.md](ORIGEM.md); nenhum trecho Quality/Sonar/Ink foi incorporado. Pino é a única dependência direta adicionada.

## Verificações reais

| Verificação | Resultado |
|---|---|
| Baseline `npm.cmd run check` antes de alterações | 39/40; falha de inicialização do broker (`spawnSync UNKNOWN`) |
| Diagnóstico direto PowerShell do broker expirado | SO informou: “Uma política de Controle de Aplicativo bloqueou este arquivo” |
| Primeiros 16 testes 2.1 | 16/16 |
| Suíte intermediária completa | 56/56, inclusive teste original do broker; nenhuma proteção alterada |
| Nova rodada focada de observabilidade/conector | 19/19; depois acrescentada a verificação de identidade MCP |
| `npm.cmd run typecheck` e `npm.cmd run build` finais | Concluídos sem erros |
| `npm.cmd run check` com 20 novos testes | **59/60**, zero skip/todo; os 20 novos passaram. Mesmo bloqueio intermitente do broker |
| `npm.cmd run demo` | CLI + protocolo MCP real; quatro ferramentas; execução sem consentimento BLOCKED; três testes diretos reais do exemplo passaram |
| `npm.cmd audit --json` | Zero vulnerabilidades reportadas nesta data |
| `npm.cmd pack` + instalação global em prefixo isolado | Comando prumo.cmd instalável, doctor e histórico funcionando; qa não registrado |
| Terminal TTY PowerShell | Menu, opção atividades, saída 0, conexão cancelada por Enter e follow encerrado por Ctrl+C exercitados |
| Codex real autenticado na conta existente | contexto_projeto e revisar_cobertura concluídos via MCP stdio |
| Novo processo do pacote instalado | Histórico idêntico ao anterior, incluindo UUID da revisão Codex |
| SDK real usando o pacote instalado em `Prumo instalação 2.1` | Quatro tools responderam; contexto/revisão NOT_VERIFIED, execução BLOCKED, consulta OK; stderr vazio |

O resultado intermediário 56/56 não substitui a rodada final 59/60. Não modificamos o teste do broker, não removemos assertions, não aplicamos retentativas internas nem alteramos políticas do Windows. Não foi estabelecida uma correção do bloqueio de aplicação; a pessoa administradora do ambiente precisará avaliar confiança/assinatura/distribuição conforme sua política. Recusar entrada inválida não comprova autenticação humana.

Os testes novos exercitam processos simultâneos, entradas sensíveis omitidas, duração, estado sem término, corrupção/checksum/linha parcial, isolamento por raiz e id, leitura em readonly, caminhos com espaços, symlink/junction/hardlink, limites de arquivo, falha de gravação no início/fim, métricas sem duplicação, erros de schema MCP, quatro tools reais, conector sem sobrescrita e cancelamento de acompanhamento. Testes de conector usam double explícito do configurador para não modificar configurações pessoais. A análise Codex e o protocolo de produção não são doubles.

## Demonstração Codex e terminal

Servidor `prumo-qa-demo` já existia habilitado. Foi conferido e reutilizado; não sobrescrevemos nem acrescentamos configuração externa sem confirmação. O assistente novo foi exercitado em modo proposta/JSON e em TTY com cancelamento, além dos testes do caminho confirmado. Claude Code não está instalado: comandos prontos, sem alegação de validação nele.

O Codex chamou contexto, encontrou R1 no README do produto sintético e leu o teste de recusa do Leitor. Enviou uma revisão com teste existente e três candidatos. O núcleo retornou dois achados: POTENTIAL_REDUNDANCY e MISSING_ORACLE. A resposta da IA distinguiu hipóteses, requisito e expectativas encontradas nos testes, mantendo NOT_VERIFIED/`executed:false`.

Evento real da revisão:

```text
operação: 28d0663c-b0c5-4a2b-aa81-b2baed501214
origem: MCP / codex (nome declarado pelo cliente)
ferramenta: revisar_cobertura
término UTC: 2026-10-10T15:10:54.545Z
duração: 31.823 ms
estado: NOT_VERIFIED
achados: 2; recomendações: 2; lacunas: 1; redundâncias candidatas: 1
```

Snapshot após demo CLI/SDK e análise Codex: 10 operações, 6 chamadas MCP, 3 contextos concluídos, 3 revisões, 4 ocorrências de achados/recomendações, 1 lacuna, 3 redundâncias candidatas e 2 execuções BLOCKED. **Não são indicadores do G3** e não indicam quatro mudanças aplicadas ou três duplicações comprovadas. Duração média medida nesse snapshot: 29.646 ms. Tokens/custos permanecem indisponíveis no Prumo; não são parte das mensagens das suas ferramentas.

`prumo atividade`, o menu TTY e outro processo do pacote instalado encontraram o mesmo UUID, estado e contagens. A comparação JSON entre o histórico antes e depois do reinício foi exata. Os bloqueios possuem referências de evidência, sem copiar logs de subprocesso para o diário. O terminal não depende da sessão Codex permanecer ativa.

## Evidências locais

Histórico operacional externo nesta máquina:

```text
C:\Users\DELL\AppData\Local\PrumoQA\projects\3be03a49c7251efa0101563ee37775b5586809f0d1d58e4ddaf8882300a7bf9b7\
  28d0663c-b0c5-4a2b-aa81-b2baed501214.jsonl
```

Relatórios de validação do desenvolvimento (não são o histórico operacional; ficam ignorados pelo Git):

```text
C:\Users\DELL\projetos-github\Prumo-Qa\.prumo\
  baseline-2.1.txt
  check-21.txt                 rodada intermediária 56/56
  check-final-21.txt           rodada completa 59/60
  testes-atividades.txt
  demo-21.txt
  audit-21.json
  codex-21.jsonl               eventos reais do cliente, não coletados automaticamente pelo Prumo
  codex-21-stderr.txt
  atividades-21.json
  atividades-reinicio-21.json
  metricas-21.json
  pacote-21.json
  instalacao-pacote-21.txt
  pacote-final-21.json
  instalacao-final-21.txt
  atividades-pacote-final-21.json
  protocolo-pacote-final-21.json
```

Evidências de bloqueio permanecem em `exemplos/projeto-demo/.prumo/evidencias/`: jobs `667ae3f6-5c4b-4897-a324-50f2fd40a81b` e `3cd40d13-a9fd-4513-a4e1-495919f03e52`. Um registro experimental anterior ao fechamento do schema foi arquivado em `%LOCALAPPDATA%\PrumoQA\desenvolvimento-21`, sem alterar o histórico de demonstração. Os dados operacionais, traces do cliente, pacotes e anexos não são publicados no Git.

## Usar nesta máquina ou em outra

```powershell
git clone https://github.com/AnaPLysyk/Prumo-Qa.git
Set-Location .\Prumo-Qa
npm.cmd ci
npm.cmd pack
npm.cmd install --global '.\prumo-qa-2.1.0.tgz'
$demo = Join-Path (Get-Location) 'exemplos\projeto-demo'
prumo.cmd doctor --root "$demo"
prumo.cmd conectar codex --root "$demo"  # revisar destino e confirmar pessoalmente
prumo.cmd --root "$demo"
prumo.cmd atividade --root "$demo"
prumo.cmd logs --follow --root "$demo"
prumo.cmd metricas --json --root "$demo"
```

Configuração manual para cliente instalado, com nome ainda inexistente:

```powershell
$server = Join-Path (Get-Location) 'dist\mcp.js'
codex mcp add prumo-qa-demo -- node "$server" "$demo"
# Ou Claude Code:
claude mcp add --transport stdio --scope user prumo-qa-demo -- node "$server" "$demo"
```

Em projeto próprio, declare seu contrato qa.project.json v2 e passe a raiz absoluta. Instalação/disponibilização da Skill para Codex/Claude está no README; ela orienta a IA, não o terminal nem as permissões. Não copie sobre uma Skill ou configuração já existente. Reabra o cliente para carregar MCP/Skill.

## Limitações preservadas

Autenticação Windows real exige participação humana e ambiente que permita o broker. Não implementamos PIN/Hello, assinamos binário ou contornamos Controle de Aplicativo. G3 continua somente leitura, sem E2E/banco. Diário local é protegido por validação/hash/permissões, não assinatura imutável contra o dono do host. Falha de disco torna métricas incompletas e é avisada em stderr. Identidade do cliente é declarada; alterações aplicadas, pensamentos e conversas fora das tools não são observados. Não há retenção automática, chat próprio, frontend, daemon, instalador de um clique, OpenTelemetry, Ink ou métricas de custo inventadas. Distribuição pública/licença e validação humana permanecem decisões da titular, não tarefas transferidas para outra IA.

O commit final e a confirmação de push exclusivo para AnaPLysyk/Prumo-Qa são informados na entrega e conferíveis por `git log -1` / `git ls-remote origin main`.
