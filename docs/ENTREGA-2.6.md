# Entrega 2.6 — registro de engenharia

Data da conferência: 10/10/2026. **2.6.0 publicada**, após CI completo, com instalador e checksum conferidos. [Release oficial](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.6.0) · [site público](https://prumo-qa-docs.onrender.com) · [laboratório](https://github.com/AnaPLysyk/Prumo-QA-Lab). Este registro distingue implementação, execução observada, fixtures e verificações que dependem do ambiente; publicação não significa assinatura digital nem aprovação de todos os critérios semânticos.

1. **Estado inicial.** Git limpo em `ddc8e24`, main e pacote 2.5.0. [Baseline](BASELINE-2.6.md): 192 testes, 188 aprovados, uma falha de inicialização do broker Windows e três de migração ignorados fora do ambiente do CI.
2. **2.5.** Release [v2.5.0](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.5.0) confirmada pela API com instalador e checksum. [Workflow da tag](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38083695789) e [workflow do commit documental](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38084239522) concluídos com success. Assinatura e autenticação humana local permanecem limitações externas.
3. **Implementação 2.6.** Diagnóstico de configuração, protocolo e chamadas observadas; referências de contexto sem texto privado; Markdown com id LOCAL; consulta explícita de issue/status/histórico; documentação estática gerada das fontes do produto.
4. **Arquitetura.** Núcleo único preservado. `integracoes.ts` usa o SDK oficial; `chamados.ts` consulta somente a API pública fixa do GitHub; o frontend chama IPC validado. Não há HTTP local substituindo IPC, banco central, sincronização, segunda IA ou serviço obrigatório.
5. **Arquivos.** Novos módulos `src/integracoes.ts`, `src/chamados.ts`; fonte `app/suporte-status.json`; scripts `gerar-site.mjs`, `gerar-status.mjs`, `demonstrar-2.6.mjs`; `render.yaml`, `site/README.md`; Skill acessibilidade e referência de engenharia. Alterados painel, contratos, main/preload/renderer, atividades, contextoCompleto, qualidade, suporte, dados, versões, package/lock, ajuda, documentação e workflow de triagem. Testes novos: integracoes, chamados, desktop-integracoes, site e site-visual; assertions de privacidade/ponte atualizadas conforme o novo contrato, sem eliminar proteção.
6. **Conexões MCP.** Inspeção confirma servidor, raiz, runtime e ambiente esperados, sem exibir env secreto. Não executa comandos da configuração externa. Claude é inspecionado no arquivo de usuário/projeto conhecido, sem declarar execução no Claude Code. Erro de inspeção não equivale a ausência de configuração. O SDK testa o servidor do próprio produto e chama somente consultar_evidencias.
7. **Integração real.** O Codex autenticado existente foi utilizado pelo laboratório: os registros dos braços B/C contêm contexto_projeto e revisar_cobertura com status completed. A conexão MCP já disponível neste chat também respondeu contexto_projeto; esse processo havia sido iniciado na versão anterior, portanto não é apresentado como prova do runtime novo. A demonstração 2.6 registra à parte a chamada do Codex e a evidência visível na janela.
8. **Skills.** QA ganhou sequência explícita de entendimento, arquitetura, equivalentes, testes, menor mudança, execução e documentação; engenharia orienta rastrear consumidores antes de acusar inutilização/duplicação. Playwright aprofunda fixtures, paralelismo, persistência, negativos e traces. Acessibilidade cobre teclado, semântica, contraste, zoom e reflow. O validador oficial aprovou QA, Playwright, acessibilidade e API REST. Foram corrigidos os frontmatters inválidos de Playwright/API REST. A instalação de PyYAML falhou por bloqueio de extensão Cython; o mesmo validador foi executado com as fontes oficiais Python, sem extensão nativa e sem alterar proteções. A avaliação real fornece a Skill explicitamente no prompt; não comprova carregamento automático universal.
9. **Achados de qualidade.** Corrigida a classificação de SDK com nome Codex/Claude; registros antigos não comprovam UTILIZADO na nova tela. Achados Playwright agora são emitidos uma vez por arquivo referenciado, preservando fatos dos cenários. Segredos bloqueados deixam de ser devolvidos em Markdown/URL na preparação do suporte. Não foram afirmadas falhas de arquitetura ou dependências inúteis apenas por nome/busca textual.
10. **Acessibilidade.** Playwright sobre Electron real verificou ativação por teclado, foco visível, preenchimento a 200%/400% e ausência de overflow da página. Site navegado no Chromium em janelas 1280/640/320, com foco e captura real `.prumo/validacao-2.6/site-320.png`. Isso não é auditoria WCAG completa; leitor de tela e avaliação humana permanecem NOT_RUN. Referências: [Playwright](https://playwright.dev/docs/accessibility-testing), [WCAG/reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
11. **Suporte e Markdown.** Frontmatter com `LOCAL-<hash>`, categoria, origem e rascunho_local; versão somente quando marcada. GitHub emite o número real. Preparação local, confirmação nativa para abrir, exportação sem upload, segredos bloqueados sem repetição na projeção. Sistema/diagnóstico continuam opcionais; IP, máquina, hardware e usuário não são anexados automaticamente.
12. **Status e comunicação.** Fonte única de cinco rótulos/cores, CSS gerado com texto de contraste adequado. Consulta lê status real, responsáveis e até 100 eventos públicos, indicando ausência, conflito e histórico parcial. Data de aplicação vem do evento, quando disponível. Respostas ficam nos comentários, notificações são as do GitHub. Implementado não significa disponível; conclusão exige resolução e versão publicada. A triagem cria rótulos conhecidos e aplica recebido sem substituir status existente; não executa texto de issue nem altera main.
13. **Site e Render.** [Site público](https://prumo-qa-docs.onrender.com), 23 páginas geradas de ajuda, contratos, segurança, suporte e versões; build independente do broker Windows, sem dependências adicionais. As 23 páginas responderam HTTP 200 e correspondem ao build local atualizado para a release 2.6.0. HTML escapado, navegação, links internos/âncoras e reprodução do build verificados. Blueprint validado com o esquema oficial Render (draft 2020-12). Static Site gratuito criado em My Workspace, com deploy manual e sem alterar o portfólio preexistente. Os headers adicionais do Blueprint permanecem preparados, sem declaração de aplicação pelo conector.
14. **Laboratório.** Avaliações executadas numa cópia isolada em `.prumo/lab-2.6`, sem testar o projeto externo original ou acessar banco. Remoto [Prumo-QA-Lab](https://github.com/AnaPLysyk/Prumo-QA-Lab) já existe. Critérios/gabarito ficam fora do contexto MCP. Fixture CRLF corrigida: linha vazia deixava de ser requisito; a rubrica permanece idêntica.
15. **Resultados das avaliações.** Determinística: 14/14 casos, 150/150 verificações. Laboratório: 28/28 testes, zero falhas/ignorados. Mutantes: dois controles mortos pela suíte original; quatro sobreviventes diferenciados pelos testes novos. Nenhum foi identificado autonomamente pelo núcleo. Comparação real em dois casos/uma repetição: A 15/20, B 19/20, C 18/20. C perdeu critérios no caso Playwright; especialização não garante melhoria. O campo prumoUtilizado de C foi omitido pelo avaliador; errata separada deriva-o das chamadas completed já registradas, preservando o resultado original. Modelo: padrão do cliente, não informado pelo JSONL disponível. Não há prova de superioridade nem teste estatístico.
16. **Regressão.** A primeira rodada 2.6 teve 198 aprovados/uma falha/3 ignorados (assertion antiga de privacidade). A seguinte revelou três problemas de suporte, rastreabilidade Playwright e seleção da janela do teste visual; corrigidos com as assertions preservadas. A rodada de aceite teve 203 testes, 199 aprovados, uma falha `spawnSync aprovar.exe UNKNOWN` e três de migração ignorados. A rodada `.prumo/check-publicacao-2.6.txt` teve **203 testes, 200 aprovados, zero falhas, três ignorados**. O bloqueio do broker é intermitente e não foi ocultado. CI de distribuição continua sendo necessário para a release. A demonstração existente terminou seus 20 passos sobre a 2.6, com confirmação nativa automatizada declarada e execução protegida BLOCKED.
17. **Aplicativo e demonstração.** Capturas da regressão em `.prumo/demonstracao-2.5`; log `.prumo/demo-regressao-2.6-corrigida.txt`. A demonstração nova concluiu 24 etapas com chamada pelo Codex real, SDK separado, referências de contexto, revisão estática Playwright, bloqueio protegido, Markdown/status controlados e persistência. Contexto aprovado e resposta de issue são fixtures explicitamente rotuladas. A captura corrigida é `.prumo/demonstracao-2.6/20261010211344454/conexoes-revisao-final.png`. Ela é de desenvolvimento. O programa **instalado** foi validado no [CI da release](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38088474506): migração 3/3 e janela/MCP 17 aprovados, zero falhas e um teste com servidor simulado ignorado. Não houve instalação local declarada nesta máquina.
18. **Distribuição e assinatura.** Instalador oficial baixado sem executá-lo; SHA-256 conferiu com o checksum publicado e o digest do asset: `53c1de612536f13afe817b0dd4f9ff09343991d5ac4bb3c60eabc68486fec183`. Assinatura **NotSigned**, conferida no CI e no arquivo baixado. Evidência `.prumo/download-verificado-2.6.json`. O primeiro NSIS local foi gerado, mas o último build local foi bloqueado com spawn UNKNOWN e seu arquivo intermediário não foi utilizado. A política de scripts PowerShell também recusou o helper de download; os comandos HTTPS/hash foram usados diretamente, sem alterar a política nem executar o instalador. HTTPS do site não assina executáveis. Autenticação Windows humana ponta a ponta continua não demonstrada.
19. **Git e release.** Commits organizados: [6e5fa3d](https://github.com/AnaPLysyk/Prumo-Qa/commit/6e5fa3d) (núcleo/app), [458a23f](https://github.com/AnaPLysyk/Prumo-Qa/commit/458a23f) (Skills/site/docs), [d63c3bb](https://github.com/AnaPLysyk/Prumo-Qa/commit/d63c3bb) (integridade e teste visual), [2e8d85d](https://github.com/AnaPLysyk/Prumo-Qa/commit/2e8d85d) (catálogo publicado e suporte). Tag nova v2.6.0 no d63c3bb, sem reutilizar tags ou force push. [CI da tag](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38088474506) success; release não draft publicada em 10/10/2026 às 21:45:33 UTC, com instalador e checksum. `app/versoes.json` só foi marcado publicada depois dessa confirmação. [Histórico final](https://github.com/AnaPLysyk/Prumo-Qa/commits/main) inclui a consolidação documental.
20. **Limites e decisões humanas.** Certificado legítimo/assinatura, licença/termos, autenticação Windows real, instalação local sob a política do sistema e leitor de tela exigem decisões/validação humana. Claude Code não teve chamada real demonstrada. Registros de protocolo são metadados locais com hashes, não trilha assinada; não há retenção destrutiva automática. Fontes truncadas ou análise de regex não comprovam suficiência funcional, obediência do agente ou descoberta semântica de todos os defeitos.

## Comandos e evidências locais

```powershell
npm.cmd run check
npm.cmd run build
node scripts/gerar-contratos.mjs
npm.cmd run site
npm.cmd run dist
npm.cmd audit --omit=dev --json
node scripts/demonstrar-2.5.mjs
node scripts/demonstrar-2.6.mjs
node .prumo/validar-render.mjs
# Na cópia isolada do Lab, com PRUMO_MCP apontando ao dist/mcp.js deste produto:
npm.cmd run check
node avaliacoes/avaliar.mjs --prumo <dist/mcp.js>
npm.cmd run mutantes
npm.cmd run deteccao
node avaliacoes/comparacao.mjs --casos 1,14 --bracos A,B,C --repeticoes 1 --prumo <dist/mcp.js>
node avaliacoes/errata-comparacao-26.mjs
```

Resultados não publicados no Git do produto: `.prumo/check-2.6.txt`, `check-final-2.6.txt`, `check-aceite-2.6.txt`, `dist-2.6.txt`, `audit-2.6.json` (zero vulnerabilidades de produção), `demo-regressao-2.6-corrigida.txt`, `validacao-2.6/site-320.png`; avaliações sintéticas na cópia do Lab. O relatório registra também as tentativas que falharam, sem substituí-las por aprovação fabricada.

## Complemento de evidências

O site está disponível em [prumo-qa-docs.onrender.com](https://prumo-qa-docs.onrender.com), serviço Static Site `srv-db5aq2o473hc73ag1nh0` no workspace confirmado. Deploy `dep-db5aq30473hc73ag1ogg` ficou live no commit `458a23f`; home e versões responderam HTTP 200, apontando a release oficial 2.5 enquanto a 2.6 ainda não estava publicada. Auto deploy está desligado. O conector criou a configuração básica; os headers adicionais do Blueprint não foram aplicados automaticamente (foi observado apenas nosniff entre os headers conferidos). O portfólio preexistente foi preservado.

O deploy de publicação `dep-db5b5mtckfvc739jlln0` ficou **live** no commit `2e8d85d` em 10/10/2026 às 21:49:23 UTC. As 23 páginas foram conferidas novamente por HTTPS, com conteúdo idêntico ao artefato local; a página de versões aponta a release oficial 2.6.0. Evidência `.prumo/site-publico-2.6.json`.

O [workflow do catálogo](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38089074265) concluiu com success. Os cinco rótulos existem no GitHub e suas cores conferem com `app/suporte-status.json`, verificação `.prumo/rotulos-publicos-2.6.json`. Nenhuma issue foi criada ou alterada nessa preparação. A rodada local após os metadados publicados (`check-metadados-publicados-2.6.txt`) repetiu 204 testes, 200 aprovados, uma falha do broker Windows e três ignorados; a conferência documental final fica em `.prumo/check-entrega-final-2.6.txt`.

O Lab foi publicado no commit [8808e57](https://github.com/AnaPLysyk/Prumo-QA-Lab/commit/8808e57), com resultados e [relatório independente](https://github.com/AnaPLysyk/Prumo-QA-Lab/blob/main/docs/AVALIACAO-2.6.md). O diretório original, previamente limpo, foi sincronizado somente por fast-forward; os testes continuaram restritos à cópia isolada. A tentativa inicial de commit na cópia não tinha identidade Git e não criou commit; foi concluída com a identidade já configurada no produto, sem alterar configuração global. Na exportação pública de engenharia somente a raiz pessoal foi ocultada; critérios e resultado NAO_ATENDEU foram mantidos.

A revisão local anterior (`.prumo/check-revisao-final-2.6.txt`) executou **204 testes: 200 aprovados, uma falha e três ignorados**. A única falha foi novamente o bloqueio `spawnSync aprovar.exe UNKNOWN` do Windows, antes de o broker receber a entrada. A rodada anterior sem falhas não substitui esse resultado. O teste permanece obrigatório e a publicação depende da execução completa no CI.

O primeiro [CI 2.6](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38087493227) falhou no teste visual do site: a seleção imediata da nova janela por URL não a encontrou no runner. O teste passou a aguardar o evento da janela e sua navegação, preservando todas as verificações visuais. Instalador e release foram pulados nessa execução. O workflow também verifica as novas integrações e o zoom no aplicativo instalado.

A captura final revelou um achado adicional: a revisão com referência de contexto e `executed:false` era gravada corretamente, mas rejeitada no histórico porque a projeção Zod reordenava as chaves antes de conferir o digest. A integridade agora é conferida contra o objeto efetivamente gravado, com validação estrita do esquema e todas as verificações semânticas mantidas. O teste de regressão cobre essa combinação e os registros originais da demonstração permanecem intactos. A rodada anterior à correção (`check-correcao-ci-2.6.txt`) teve 204 testes, 201 aprovados e três ignorados.

A suíte após a correção (`check-integridade-final-2.6.txt`) teve **204 testes, 201 aprovados, zero falhas e três ignorados**. O [CI do commit d63c3bb](https://github.com/AnaPLysyk/Prumo-Qa/actions/runs/38088022937) concluiu com success: mesma suíte principal, migração 3/3 sem ignorados e programa instalado com 17 aprovados/zero falhas/um ignorado entre 18 testes. O ignorado usa servidor simulado de atualização, que não é permitido no pacote; o teste do destino oficial continua separado. Instalação sobre 2.2, preservação dos dados e desinstalação foram verificadas nesse runner Windows. O checksum desse artefato de main é `923c4d37473e540c4c15b31180ddf35bae755e3ac7c292006093428e5d0e3177`; não substitui o checksum da futura release. Assinatura observada: NotSigned.

O novo build NSIS local (`dist-final-2.6.txt`) falhou com `spawn UNKNOWN` ao gerar o desinstalador. O executável intermediário não é tratado como instalador válido e não foi instalado. A rodada posterior ao preparo do catálogo (`check-catalogo-final-2.6.txt`) voltou a ter 200 aprovados, uma falha do broker e três ignorados. Nenhum teste foi pulado para contornar o bloqueio.

As 23 páginas Render responderam HTTP 200 e tiveram conteúdo idêntico ao build local, registro `.prumo/site-publico-2.6.json`. A consulta pública de issues retornou lista vazia: não há chamado real cuja transição possa ser demonstrada. A demonstração de status é uma fixture e nenhuma issue de teste foi criada. O workflow prepara o catálogo também por publicação da configuração, sem precisar de um chamado fictício.

Auditoria de dependências: os arquivos locais `audit-2.6.json` (produção) e `audit-completo-2.6.json` (completa) reportaram zero vulnerabilidades. Entretanto, `npm ci` no CI reportou oito vulnerabilidades moderadas. Os resultados de ambientes distintos são registrados como observados; a auditoria local não apaga o aviso do CI e não houve `npm audit fix --force` nem atualização de dependência incompatível para escondê-lo.

A demonstração nova concluiu suas 24 etapas em `.prumo/demonstracao-2.6/20261010211344454/resumo.json`: 23 verificações aprovadas e a tentativa protegida BLOCKED (assertion do bloqueio atendida). A chamada Codex é real, com UUID visível na janela; aprovação de contexto e status de issue são fixtures declaradas. Dados persistem e a pasta/JSONL ficam fora do Git. A revisão visual encontrou `null` literal e código de inspeção em branco; ambos foram corrigidos, com assertion para que campos ausentes não virem texto e separação entre configuração proposta e inspeção.

A avaliação adicional de engenharia (RQ-015), com critérios fixados antes da chamada, foi **NAO_ATENDEU, 8/11 critérios automáticos**. A resposta detectou documentação divergente, repetição de código, mistura de responsabilidades como suspeita, teste sem oráculo, espera fixa e cenário ignorado. A inspeção da resposta mostrou limites da rubrica: os controles legítimos foram descritos em frases, em vez dos identificadores exatos exigidos; a duplicação foi confirmada pelos corpos/consumidores, enquanto o critério exigia o rótulo suspeita. Esses três resultados não comprovam três erros semânticos da IA. A rubrica e o resultado original foram preservados, sem reclassificação para favorecer o produto. Fonte: `Prumo-QA-Lab/avaliacoes/resultados/2026-10-10-engenharia-2.6.0.json` na cópia isolada.

## Inventário da evolução

`git diff --name-status ddc8e24..d63c3bb`: A indica criado; M indica modificado. A configuração final de triagem e os metadados de publicação complementam esse inventário nos commits documentais posteriores.

```text
M .github/workflows/triagem.yml
M .github/workflows/windows.yml
M .gitignore
M README.md
M app/ajuda/05-conectar-ia.md
M app/ajuda/11-privacidade.md
M app/preload.cjs
M app/renderer/app.js
M app/renderer/estilo.css
M app/renderer/index.html
A app/renderer/status.css
A app/suporte-status.json
M app/versoes.json
M docs/APLICATIVO.md
A docs/BASELINE-2.6.md
M docs/CONTRATOS.md
A docs/ENTREGA-2.6.md
M docs/SEGURANCA.md
M docs/SUPORTE.md
M package-lock.json
M package.json
A render.yaml
A scripts/demonstrar-2.6.mjs
A scripts/gerar-site.mjs
A scripts/gerar-status.mjs
A site/README.md
A skills/acessibilidade/SKILL.md
M skills/api-rest/SKILL.md
M skills/playwright/SKILL.md
M skills/qa/SKILL.md
A skills/qa/references/engenharia.md
M src/atividades.ts
A src/chamados.ts
M src/contextoCompleto.ts
M src/contratos.ts
M src/dados.ts
M src/desktop/main.ts
A src/integracoes.ts
M src/painel.ts
M src/qualidade.ts
M src/suporte.ts
A testes/chamados.test.mjs
M testes/desktop-ajuda.test.mjs
A testes/desktop-integracoes.test.mjs
M testes/desktop.test.mjs
M testes/frameworks.test.mjs
A testes/integracoes.test.mjs
A testes/site-visual.test.mjs
A testes/site.test.mjs
M testes/suporte.test.mjs
```
