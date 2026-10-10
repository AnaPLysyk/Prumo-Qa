# Relatório de entrega — Prumo QA 2.0

Data: 10/10/2026. Destino exclusivo: [AnaPLysyk/Prumo-Qa](https://github.com/AnaPLysyk/Prumo-Qa). Implementação e verificações técnicas concluídas; **aprovação humana autenticada end-to-end permanece não comprovada**. Esse limite impede declarar todos os critérios de aceite satisfeitos.

## 1. Implementação

Pacote local Node/TypeScript com núcleo determinístico, contrato qa.project.json v2 estrito, CLI, Skill QA, SDK MCP oficial por stdio e exatamente quatro ferramentas. Há contexto com origem/hashes, análise estrutural sem inventar regra, preflight/capability declarada, broker Windows com autenticação da conta atual, execução sem shell no núcleo, ambiente mínimo, timeout/limite de saída, resultados individuais quando o runner os fornece e evidências locais isoladas por raiz.

Nenhum frontend, Docker, daemon, fila, banco central, novo modelo, chave LLM adicional ou serviço pago foi instalado como dependência do produto.

## 2. Estrutura final e responsabilidades

```text
src/
  projeto.ts       contrato, paths seguros, inventário e contexto
  qualidade.ts     requisito/fonte, riscos/oráculos, lacunas e redundância candidata
  aprovacao.ts     escopo/expiração e comunicação com broker humano
  execucao.ts      preflight, subprocesso real e limites
  evidencias.ts    classificação, persistência e consulta com integridade
  mcp.ts           quatro tools stdio usando o núcleo
  cli.ts           doctor/context/review/run/approve/evidence
scripts/
  aprovar.cs       CredUI + LogonUser, senha fora da interface da IA
  build-broker.mjs compilação .NET local sem alterar ExecutionPolicy
  demonstrar.mjs  demonstração CLI e MCP real
skills/qa/SKILL.md metodologia para a IA hospedeira
testes/           fixtures e seis arquivos de testes de comportamento
exemplos/         produto isolado, plano de cobertura e contrato G3 readonly
docs/             origem, segurança, diagnóstico, validação e este relatório
package.json      scripts/dependências/entrada qa
package-lock.json versões efetivas da instalação
tsconfig.json     TypeScript estrito
.gitignore        evidências, segredos, build, dependências e anexos fora do Git
.gitattributes    finais de linha reproduzíveis
AGENTS.md         orientações para manutenção
README.md         instalação, integração e uso PowerShell
```

## 3. Reaproveitamento

Estudo do QA Orchestrator e041003: contratos/instruções/README, manifesto, capabilities, preflight, classificador, política de IA, planejador, host e testes. Foram aproveitados conceitos, sem copiar trechos, infraestrutura ou dados. O antigo declara UNLICENSED; a implementação é nova. Diretório antigo e issue26-lint.json local foram preservados. Detalhes em ORIGEM.md.

## 4. Verificações e resultados reais

`npm run typecheck`, `npm run build`, `npm run check`: **PASS; 40 testes, 40 aprovados, zero falhas, zero skip/todo**. Contratos, unitários, integração, CLI subprocessado, segurança, MCP real, classificação dos quatro estados e aceitação sintética estão incluídos.

Outro clone, em caminho com espaços e acentos, passou por `npm ci`, `npm run check` e `npm run demo`. Auditoria npm: zero vulnerabilidades na data. Skill Creator validou o formato da Skill. A demonstração direta do produto fictício executou três testes reais, incluindo seis verificações de comportamento/limites. As verificações individuais pelo executor foram testadas com subprocesso real e double explícito do broker humano.

Comandos, limitações da metodologia de teste, falhas corrigidas e localização dos logs estão detalhados em VALIDACAO.md. O build não é usado como prova de comportamento por si só.

## 5. Prova MCP

SDK Client real iniciou processo de produção, fez handshake, listou as quatro tools e chamou as quatro. Inspector 2.10.1 comprovou tools/list e tools/call de contexto. Payloads com approved:true, mudança de raiz e job inválido foram recusados.

Codex real está autenticado via conta ChatGPT e teve servidor `prumo-qa-demo` configurado. Contexto, revisão e evidências foram chamados e concluídos. O cliente recusou a tool de execução por sua própria política de aprovação `never`; não foi contornada. A integração não usa serviços remotos do ChatGPT para acessar o filesystem. Claude Code não está instalado; seus comandos foram documentados a partir das fontes oficiais, sem alegar execução nele.

## 6. Demonstração

Projeto fictício de publicações, dados exclusivamente em memória. `doctor` reconheceu contrato; `context` retornou código/testes/requisito; `review` identificou Editor duplicado e cenário Leitor; a IA complementou a análise ao reconhecer o caso negativo já existente e lacunas de oráculo documental. `run unit` e a mesma chamada MCP registraram BLOCKED sem consentimento; `evidence` preservou esse resultado. `npm run demo` pode repetir a sequência.

`qa approve unit` iniciou broker compilado e aguardou autenticação real; ninguém concluiu o consentimento em 120 segundos. Não houve rodada Prumo autenticada e nenhum PASS foi fabricado para suprir essa ausência.

G3 foi reconhecido pelo próprio Prumo, usando contrato externo readonly, no commit 5b9977eb45531943844e3cd8b8c82f1a6b58a688. Arquivos/stack/suítes reais são citados em DIAGNOSTICO-G3.md. Não executamos E2E/release, não iniciamos serviços, não consultamos banco e não alteramos o projeto original. O seed e a possibilidade de interromper runtime impedem assumir segurança apenas pelo nome do banco de teste.

## 7. Logs/evidências

`C:\Users\DELL\projetos-github\Prumo-Qa\.prumo\demonstracao\`: checks-finais.txt, instalacao-limpa.txt, demonstracao.json, protocolo-mcp.json, inspector-list.json, inspector-contexto.json, codex-real.jsonl, codex-skill.jsonl, g3-contexto.json, node-test.txt, npm-audit.json, aprovacao-humana.json.

Jobs reais do exemplo: `C:\Users\DELL\projetos-github\Prumo-Qa\exemplos\projeto-demo\.prumo\evidencias\`. Logs privados permanecem locais e fora do Git. Consultas sem registros/critérios retornam NOT_RUN.

## 8. Git e publicação

Commits organizados: `5697105` (núcleo, adaptadores, Skill, aprovação e demo), `e560e34` (testes), `f160613` (documentação inicial). O relatório final e a validação de instalação limpa ficam em commit adicional. O hash final e a confirmação de publicação são fornecidos na resposta de entrega e podem ser conferidos por `git log -1`/`git ls-remote origin main`.

Remoto exclusivo: https://github.com/AnaPLysyk/Prumo-Qa.git. Nenhum force push, alteração no remoto antigo, dado confidencial, credencial, PDF/HTML anexo, node_modules, build ou log integra os commits. Identidade Git configurada somente neste repositório, baseada na identidade de autoria já existente no histórico da titular.

## 9. Instalar e conectar

PowerShell nesta máquina:

```powershell
Set-Location 'C:\Users\DELL\projetos-github\Prumo-Qa'
npm.cmd ci
npm.cmd run build
npm.cmd run check
$server = Join-Path (Get-Location) 'dist\mcp.js'
$demo = Join-Path (Get-Location) 'exemplos\projeto-demo'

# Já cadastrado aqui; em outra máquina use uma vez:
codex mcp add prumo-qa-demo -- node "$server" "$demo"
codex mcp get prumo-qa-demo

# Claude Code quando instalado:
claude mcp add --transport stdio --scope user prumo-qa-demo -- node "$server" "$demo"
claude mcp get prumo-qa-demo

node .\dist\cli.js doctor --root "$demo"
node .\dist\cli.js context --root "$demo"
node .\dist\cli.js review '.\exemplos\plano-demo.json' --root "$demo"
node .\dist\cli.js approve unit --root "$demo"
node .\dist\cli.js evidence --root "$demo"
```

Em outra máquina, clone o repositório antes e substitua a raiz pelo diretório real. A instalação/disponibilização de Skill para Codex (.agents/skills) e Claude Code (.claude/skills), sem sobrescrever instruções existentes, está no README. Uma sessão nova precisa carregar MCP/Skill; não prometemos invocação automática universal.

## 10. Limites e participação humana

A pessoa precisa autenticar sua própria conta Windows para comprovar execução protegida ponta a ponta. Isso é uma barreira do produto, não trabalho pendente para outra IA. Contas só com PIN/Hello não foram implementadas. Outros sistemas operacionais ficam bloqueados para execução protegida, embora permitam leitura/análise.

O cliente Codex desta demonstração também exige que uma pessoa permita a chamada de execução conforme sua política; não manipulamos essa política. G3 permanece readonly até prova de ambiente/banco realmente isolados e autorização específica; não há desbloqueio automático.

Núcleo não é sandbox contra scripts maliciosos, administrador ou processos com acesso para alterar binários. Hashes detectam corrupção, não assinatura contra adulteração pelo dono do host. A aprovação pinna manifesto, comando, ambiente e fontes/entrypoints declarados; dependências transitivas e alterações concorrentes após preflight requerem workspace confiável e conta restrita. Há contrato de resultados individual, sem parser universal de todo framework. Limites completos em SEGURANCA.md.

O software foi implementado e validado dentro do acesso disponível. Os limites acima são verificações externas/humanas explicitamente registradas, sem representação de simulação como integração ou consentimento real.
