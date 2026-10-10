# Validação real — 10/10/2026

Ambiente: Windows, PowerShell, Node v24.20.0, npm 11.19.0, SDK MCP 1.32.1, TypeScript 5.9.3, Zod 3.25.76. Instaladas 98 dependências no total (incluindo transitivas); npm audit: **zero vulnerabilidades** na rodada registrada.

## Comandos e resultados

| Comando executado | Resultado observado |
|---|---|
| `npm install` | Instalado com package-lock; zero vulnerabilidades |
| `npm run typecheck` | PASS, TypeScript sem erros |
| `npm run build` | PASS, dist e broker Windows compilados |
| `npm run check` | PASS: tipos + build + **40 testes, 40 aprovados, zero falhas/skip/todo** |
| `npm run demo` | CLI e cliente MCP real; consultas aprovadas; execução Prumo BLOCKED sem consentimento |
| `node --test testes/publicacao.test.mjs` no demo (executado pelo script de demonstração) | 3 testes aprovados: persistência, autorização negativa e limites 0/1/80/81 |
| MCP Inspector CLI `--method tools/list` | Quatro tools listadas pelo servidor real |
| MCP Inspector CLI `--method tools/call --tool-name contexto_projeto` | Contexto real do exemplo retornado |
| `codex mcp add prumo-qa-demo -- node <server> <demo>` e `codex mcp get prumo-qa-demo` | Servidor stdio habilitado na configuração local |
| `codex exec ...` com tools Prumo | contexto_projeto, revisar_cobertura e consultar_evidencias concluídas; executar_validacao rejeitada pela política de aprovação do cliente |
| `codex exec ...` com `$qa` e exemplo de redundância | Análise NOT_VERIFIED, redundância reconhecida, consulta de fonte e distinção código/requisito |
| Skill Creator `quick_validate.py skills/qa` | Skill is valid! |
| Contexto G3 com `--readonly-contract` | Web/Angular/Express/Playwright e fontes reais reconhecidos, sem execução ou alteração |

Os testes abrangem fixtures web/API/automação, manifesto inválido/v1/tipos, capability inexistente, strings/objetos de comando, comando não autorizado, shell/eval/flags, paths absolutos/traversal/UNC/ADS, symlink/junction, limites de leitura, binários, credenciais, mascaramento de saída, ambiente sem segredo/NODE_TEST_CONTEXT, timeout e limite de saída, arquivo/pré-condição faltante, recusa de aprovação fabricada, mudança de escopo, resultado antigo/malformado, hash e contexto de evidência, PASS/FAIL/BLOCKED/NOT_RUN, subprocessos, npm, CLI em caminhos com espaços, handshake e tools/call MCP reais, análise de equivalência/limites/autorização/tabelas/estados/lacunas/contradição e testes ignorados.

## O que é real e o que é fixture

Testes do executor substituem **somente o broker humano**, explicitamente via Node test module mocks em processo de teste. Subprocessos executam de verdade e preservam stdout/exit; o exemplo produz seis resultados individuais com assertions reais. Resultado do broker nessa suíte é `test-double`/`FIXTURE-NON-HUMAN`, nunca apresentado como consentimento real. Teste de falha de spawn usa um subprocesso simulado, identificado no teste para reproduzir o erro determinístico.

Adaptadores CLI/MCP executam em processos separados de produção, sem double. Validam que nenhum booleano/env da IA autoriza. A demo padrão registra BLOCKED de verdade; não finge execução autorizada. Testes diretos do exemplo são execuções reais autorizadas pela tarefa em dados sintéticos, mas **não são uma rodada Prumo autenticada**.

O broker nativo foi compilado e iniciado. A tentativa de autenticação aguardou 120 segundos e não recebeu consentimento humano; preservou BLOCKED e executed=false. Portanto a aprovação humana end-to-end ainda não foi comprovada. Não coletamos senha, não a fabricamos nem dispensamos o gate. A implementação está entregue, mas esse critério de aceite depende de uma pessoa usando `qa approve unit`.

Na demonstração Codex, `executar_validacao` foi rejeitada antes de chegar ao servidor: **“MCP tool call requires approval, but approval policy is never”**. Não mudamos a política para contornar a rejeição. As quatro chamadas respondem pelo SDK Client real e Inspector; o cliente IA comprovou três chamadas concluídas e uma recusa segura. Claude Code não está instalado neste ambiente; configuração está pronta no README, sem alegar demonstração nele.

## Avaliação da Skill no cliente

O Codex leu contexto e chamou revisão; reconheceu Editor duplicado e Leitor negativo, consultou testes retornados e percebeu que o arquivo já incluía recusa do Leitor, além do que a lista supplied enumerava. Registrou que códigos 200/403 estavam nos testes/expectativas, não literalmente no requisito documental. Não declarou PASS sem execução. Isso demonstra o papel semântico da IA complementando a análise estrutural do núcleo; não é promessa de invocação universal nem avaliação estatística ampla de modelos.

## Falhas diagnosticadas e corrigidas

1. Harness de compilação PowerShell por stdin não executava o bloco completo; corrigida forma de invocação.
2. Windows PowerShell recusou execução de arquivo .ps1 pela política local. Broker passou a ser executável C# compilado, sem mudar ExecutionPolicy, usar Bypass ou enfraquecer autenticação.
3. Revisão podia considerar teste ignorado como candidato de duplicidade; agora não conta como cobertura.
4. npm precisa localizar Node com ambiente mínimo: PATH construído a partir de caminhos confiáveis, sem herdar PATH do host; testado com execução real.
5. Artefato redigido tinha hash do conteúdo anterior; hash agora corresponde ao arquivo persistido.
6. Uma recusa imediata do broker sem diagnóstico produziu UNKNOWN intermitente no spawnSync do Windows. Acrescentado diagnóstico explícito no caminho expirado, preservando exit=1 e nenhuma autorização; o teste original de recusa foi mantido e repetido após a correção. A hipótese de interação com pipe/encerramento não é apresentada como causa comprovada do Windows.

Após correções, suíte inteira foi repetida e passou. Não alteramos assertions do produto para fabricar sucesso.

## Logs locais

Em `C:\Users\DELL\projetos-github\Prumo-Qa\.prumo\demonstracao\`:

- `checks-finais.txt`: tipos/build e resultados individuais da suíte.
- `demonstracao.json`: CLI, consultas e bloqueio real.
- `protocolo-mcp.json`: tools/list e quatro tools/call do SDK Client.
- `inspector-list.json`, `inspector-contexto.json`: MCP Inspector CLI real.
- `codex-real.jsonl`, `codex-skill.jsonl`: eventos de chamadas e respostas do cliente IA.
- `node-test.txt`: saída dos testes reais do produto fictício.
- `npm-audit.json`: auditoria de dependências.
- `g3-contexto.json`: contexto real com fontes e hashes, mantido local.
- `aprovacao-humana.json`: tentativa sem autenticação concluída, BLOCKED.

Jobs do exemplo: `exemplos/projeto-demo/.prumo/evidencias/*.json`. Logs e contextos ficam fora do Git; não transferimos conteúdo de empresas.
