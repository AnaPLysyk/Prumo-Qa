# Aplicativo desktop — arquitetura e manutenção do Prumo QA

Conexões concentra os adaptadores de Jira, Qase e GitHub em `backend/conexoes/integracoes/` e as integrações de IA em `backend/conexoes/ia/`. O controlador da tela fica em `backend/conexoes/controlador.ts`.

Suporte concentra seus fluxos em `backend/suporte/controlador.ts`, `servicoRelato.ts` e `regras/chamadosDaPessoa.ts`. O texto remoto deve ser tratado como dado, não como HTML ou comando.

O site usa `site/gerar.mjs` e o catálogo de versões do projeto; não duplica o núcleo do aplicativo. Detalhes de utilização estão na [Ajuda](ajuda/17-plataforma.md).

A janela é uma camada de **apresentação**. Seus canais chegam ao registrador IPC (`backend/aplicativo/api/registrarCanaisIpc.ts`), que chama o **controlador da funcionalidade** (por exemplo, `backend/logs/controlador.ts`), sem criar um arquivo intermediário por canal.

## Manutenção manual: por onde começar

**Abra primeiro a pasta da funcionalidade.** Nela, `controlador.ts` recebe as chamadas da janela, o serviço executa a operação, `banco/` cuida da persistência, `integracoes/` conversa com serviços externos e `tipos/` reúne contratos. Não crie arquivos separados para funções minúsculas; também não misture fluxos sem relação para reduzir números.

| Quero modificar… | Comece por… | Operações relacionadas |
|---|---|---|
| Login, cadastro e sessão | `backend/login/controlador.ts` | `regras/contas.ts`, `regras/sessao.ts`, `controladorSessao.ts` |
| Login pelo GitHub ou Google | `backend/login/regras/entradaPorProvedor.ts` | `integracoes/oauthDosProvedores.ts` e servidor de autenticação |
| Administração e permissões | `backend/administracao/controlador.ts` | `servico.ts` |
| Tela Início | `backend/inicio/controlador.ts` | `servico.ts` |
| Projetos e repositórios | `backend/projetos/controlador.ts` | `servicoProjetos.ts`, `banco/projetos.ts`, `servicoRepositorioGit.ts` |
| Conexões com Jira, Qase e GitHub | `backend/conexoes/controlador.ts` | `servicoContas.ts`, `regras/nucleoServicos.ts`, `integracoes/` |
| Chat e seleção de agentes | `backend/agentes/controlador.ts` | `chat/conversar.ts`, `chat/roteamento.ts` |
| Conhecimento e Skills | `backend/agentes/controlador.ts` | `banco/conhecimento.ts`, `banco/skills.ts`, `regras/regrasDasSkills.ts` |
| Contextos e aprovações | `backend/agentes/regras/cicloDosContextos.ts` | `banco/contextos.ts`, `regras/consultasDeContextos.ts` |
| Casos de teste | `backend/testes/controlador.ts` | `servicoCasos.ts`, `servicoClassificacao.ts`, `banco/local.ts` |
| Execuções e evidências | `backend/testes/controlador.ts` | `servicoExecucoes.ts`, `regras/executarValidacao.ts`, `banco/runs.ts` |
| Resultados no Qase | `backend/testes/integracoes/publicarRunLocal.ts` | `casosQase.ts`, `execucoesQase.ts` |
| Agenda e automações | `backend/agendamentos/controlador.ts` | `regras/cicloDaRotina.ts`, `worker/Worker.ts`, `banco/agenda.ts` |
| Autorizar rotinas | `backend/agendamentos/autorizacoes/autorizarRotina.ts` | `banco/autorizacoes.ts` |
| Propostas e tickets | `backend/tickets/controlador.ts` | `servicoPropostas.ts`, `integracoesJira.ts` |
| Logs e histórico | `backend/logs/controlador.ts` | `regras/iniciarAtividade.ts`, `regras/consultasDoDiario.ts` |
| Métricas | `backend/metricas/controlador.ts` | `servico.ts` |
| Suporte | `backend/suporte/controlador.ts` | `servicoRelato.ts`, `regras/chamadosDaPessoa.ts` |
| Configurações | `backend/configuracoes/controlador.ts` | `servico.ts` |
| Ajuda e versões | `backend/ajuda/controlador.ts` | `servicoAjuda.ts`, `docs/catalogo/versoes.json` |
| Atualizações | `backend/atualizacoes/controlador.ts` | `servicoVerificacao.ts`, `servicoInstalacao.ts` |
| Janela e bandeja | `backend/aplicativo.ts` | `aplicativo/janela/`, `aplicativo/avisos/`, `aplicativo/bandeja/` |
| Terminal e MCP | `backend/cli.ts`, `backend/mcp.ts` | `terminal/`, `agentes/mcp/` |

**Não edite arquivos gerados:** `dist/`, `backend/aplicativo/api/arquivosDosCanais.ts` e o mapa da Documentação Viva. Para os canais, use `npm.cmd run documentacao:viva`; para o mapa, `node docs/geradores/gerar-mapa-do-aplicativo.mjs`.

**Separe os ambientes:** `backend/login/servidor/` e `backend/suporte/servidor/` são serviços remotos (não são telas do Electron). `site/` é o site público. `backend/compartilhado/` é apenas para funções reutilizadas em várias áreas.

**Após mudar código:** rode `npm.cmd run typecheck` e `npm.cmd run test:backend`. Alterações de regras de negócio e segurança exigem compreender o comportamento esperado; preferências, textos e dados configuráveis devem ser modificáveis pela interface, sem exigir que a pessoa edite TypeScript.

## Arquitetura

```text
Janela (dist/renderer: HTML+CSS+JS, sandbox, CSP, sem rede)
   │  window.prumo.*  (backend/aplicativo/preload.cjs — ponte mínima catalogada, objeto congelado)
   ▼
Processo principal Electron (backend/aplicativo.ts; canais em backend/aplicativo/api/registrarCanaisIpc.ts)
   │  canais IPC `prumo:*`: confere remetente, valida com zod, devolve {ok,data|error}
   ▼
Controlador da tela (backend/<tela>/controlador.ts) — agrupa os canais por funcionalidade
   ▼
Serviço e regras da tela (backend/<tela>/servico*.ts e regras/)
   ├── banco/ — persistência
   └── integracoes/ — comunicação externa
```

O **servidor MCP não roda dentro da janela**. Cada cliente de IA inicia o seu processo (`mcp.js`, stdio); fechar a janela não o afeta (há teste para isso).

### Como Electron, Node e MCP se integram

- O app instalado não depende de Node.js. O `Prumo QA.exe` é o Electron; com a variável `ELECTRON_RUN_AS_NODE=1` ele se comporta como um Node puro, sem abrir janela.
- `backend/conexoes/ia/conectarIa.ts` detecta `process.versions.electron` e propõe `command = Prumo QA.exe`, `args = [<instalação>\resources\app\dist\mcp.js, <projeto>]`, `env ELECTRON_RUN_AS_NODE=1`. Em desenvolvimento a proposta usa o `electron.exe` do projeto da mesma forma.
- `backend/testes/regras/executarValidacao.ts` faz o mesmo para capacidades `node`: o filho recebe `ELECTRON_RUN_AS_NODE=1` (senão abriria uma janela do Prumo).
- O build usa `asar: false` para que `dist/mcp.js` e `dist/aprovar.exe` existam como arquivos reais (um executável não roda de dentro de um `.asar`).
- O pacote **não inclui npm**: capacidades `npm run` continuam exigindo Node com npm na máquina (falha como `RUNTIME_MISSING`, nunca como PASS).

### Como os eventos chegam aos logs

Cada `tools/call` MCP (e cada comando do CLI) grava um registro de início e outro de término em `%LOCALAPPDATA%\PrumoQA\projects\<hash>\<operação>.jsonl` (um arquivo por operação, sem disputa entre processos). A janela só **lê** esses arquivos: a aba Logs, ao marcar “Acompanhar”, consulta de novo a cada 2 s. Registros corrompidos são excluídos e a tela avisa que as métricas são parciais.

### Contratos técnicos (IPC e MCP)

`backend/aplicativo/api/catalogoDeContratos.ts` é a fonte única: os mesmos esquemas Zod que validam cada chamada IPC em `backend/aplicativo/api/registrarCanal.ts` alimentam o catálogo mostrado em **Ajuda › Integrações técnicas** e o arquivo gerado [docs/CONTRATOS.md](CONTRATOS.md) (`npm run contratos`). Testes comparam o catálogo com `main.ts`, `preload.cjs` e o servidor MCP real; uma operação nova sem documentação, ou um catálogo desatualizado, quebra a suíte. O processo Electron não expõe uma API HTTP local; autenticação e suporte usam serviços HTTPS remotos separados, localizados em `backend/login/servidor/` e `backend/suporte/servidor/`.

### Suporte e avisos de versão (2.5)

A aba **Suporte** prepara bug, melhoria ou sugestão (`backend/suporte/regras/`), mostra o texto exato e a revisão de privacidade e só abre o formulário oficial do GitHub após confirmação nativa; o processo principal refaz a preparação e valida o destino. O sino do cabeçalho e as preferências (`backend/configuracoes/` e `backend/atualizacoes/regras/`, `%LOCALAPPDATA%\PrumoQA\preferencias.json`) avisam de versões novas: a verificação ao iniciar é opcional e desligada por padrão, o som toca no máximo uma vez por versão e não há processo em segundo plano. Ver [SUPORTE.md](SUPORTE.md).

### Contextos persistentes e conhecimento de QA (2.4)

`backend/agentes/` guarda, por projeto, requisitos, regras de negócio, critérios de aceite, restrições técnicas e decisões em `%LOCALAPPDATA%\PrumoQA\contextos\<projeto>\<id>.json` (fora do projeto, sem banco, sem alterar o `qa.project.json`). Cada arquivo traz um histórico encadeado por hash (quem, quando, ação, hash do conteúdo): se for alterado fora do Prumo o contexto vira **ADULTERADO**, deixa de ser editável e **nunca** é enviado ao agente.

- **Estados:** RASCUNHO, APROVADO, CONFLITANTE, DESATUALIZADO. Aprovar é um ato humano (confirmação nativa; o aprovador é o usuário do Windows lido no processo principal) que vale só para o texto exato; editar volta a RASCUNHO; aprovar exige origem e ausência de conflito. Conflito é **derivado** (mesma chave com contextos vivos diferentes) ou marcado pela pessoa; o Prumo nunca escolhe um lado.
- **MCP:** por padrão **nada** é entregue ao agente. Com "Disponibilizar ao agente" habilitado (confirmação nativa), `contexto_projeto` devolve referências estruturadas (id, chave, versão, hash, estado, origem, texto mascarado e limitado a 4000 caracteres, alerta de texto que parece instrução) e `revisar_cobertura` aceita `contextoId`, registrando o contexto usado como fato e apontando `CONTEXT_NOT_APPROVED`, `CONTEXT_OUTDATED`, `CONTEXT_CONFLICT`, `CONTEXT_SOURCE_MISSING`, `CONTEXT_MISMATCH`, `CONTEXT_TAMPERED`, `CONTEXT_UNAVAILABLE` ou `CONTEXT_SUSPICIOUS_INSTRUCTION`. Nenhuma ferramenta MCP cria, edita, aprova ou exclui contextos (teste verifica).
- **Frameworks e Playwright:** `backend/testes/regras/revisaoDeCobertura.ts` detecta Playwright por evidência (dependência `@playwright/test` em package.json mais configuração ou teste que importa o pacote → CONFIRMADO; evidência parcial → PROVAVEL; só nome de pasta → INCERTO) e analisa arquivos de teste com 12 regras `PW_*`, cada uma com linha, trecho e a fonte oficial da documentação. A análise é textual e determinística: pode errar e não sabe se há validação de persistência. As Skills `backend/agentes/skills/playwright` e `backend/agentes/skills/api-rest` orientam a IA; `contextoCompleto.ts` compõe a resposta de `contexto_projeto` (MCP e CLI).

### Versões e atualização

`docs/catalogo/versoes.json` (validado por `backend/ajuda/servicoAjuda.ts`) é a única fonte do histórico de versões: alimenta Ajuda › Versões, as notas de release (`site/release/notas-versao.mjs`) e a conferência com `package.json`, tag e nome do instalador. **Verificar atualizações** é sempre uma ação sua: o processo principal faz uma requisição HTTPS GET a `api.github.com` (destino fixo, sem redirecionamento, com timeout, resposta validada) e a janela continua sem acesso à rede. Não são enviados logs, projetos, caminhos, identificadores, evidências nem tokens; como em qualquer conexão HTTPS, o servidor vê o seu endereço IP, o que não é anonimato. Nada é baixado nem executado: o botão apenas abre, após confirmação nativa, a página oficial da release. Sem internet, o app mostra “Não foi possível verificar atualizações. O aplicativo continua disponível para uso local.”

### Dados locais: exportar e excluir

Ajuda › Privacidade e dados mostra a pasta real, o espaço usado por categoria, a retenção (nenhuma automática) e o que não é transmitido. A exportação grava onde você escolher. A exclusão tem escopos **separados** — histórico operacional do projeto, evidências do projeto e diagnóstico da interface —, sempre com confirmação nativa, apagando só arquivos do padrão esperado (um a um, sem seguir links) e informando falhas parciais. Código-fonte nunca é tocado, **Desvincular** continua sendo outra ação (só tira o item da lista) e nada disso é exposto como ferramenta MCP.

### Diagnóstico da interface

Cada chamada IPC grava, em `%LOCALAPPDATA%\PrumoQA\diagnostico`, apenas canal, estado, duração, código de erro e um identificador de correlação — nunca argumentos, caminhos ou conteúdo. É separado do histórico de QA: atualizar a tela não conta como análise do Prumo e não altera métricas. Consultas frequentes só deixam rastro quando falham (evita encher o arquivo e qualquer recursão); o arquivo tem teto de 1 MiB por dia.

### Onde ficam os dados

| Dado | Local |
|---|---|
| Histórico/métricas | `%LOCALAPPDATA%\PrumoQA\projects\` |
| Projetos vinculados | `%LOCALAPPDATA%\PrumoQA\vinculos.json` (só caminhos) |
| Projeto de demonstração copiado | `%LOCALAPPDATA%\PrumoQA\demonstracao\` |
| Dados internos do Electron | `%LOCALAPPDATA%\PrumoQA\app\` |
| Diagnóstico IPC | `%LOCALAPPDATA%\PrumoQA\diagnostico\` |
| Evidências de execução | `<projeto>\.prumo\evidencias\` |

`PRUMO_DATA_DIR` troca a pasta base (usado nos testes). Desinstalar **não** apaga nada disso.

## Segurança da janela

`contextIsolation`, `sandbox` e `webSecurity` ligados; `nodeIntegration` desligado; CSP `default-src 'none'`; toda requisição que não seja `file:` é cancelada; navegação e novas janelas são negadas; permissões do navegador negadas; DevTools só fora do pacote. Cada canal IPC recusa remetente que não seja a página do app, valida os argumentos e só aceita raízes **já vinculadas**. A janela nunca recebe caminho livre para ler/executar: a pasta de um projeto só entra pelo diálogo nativo. Alterar a configuração do Codex exige a caixa de confirmação do processo principal (ver "Caixa de confirmação do processo principal" em SEGURANCA.md): a página não responde por ela, e imitar o visual não autoriza nada. A autenticação humana antes de executar (`aprovar.exe`, CredUI + LogonUser) é a mesma do CLI/MCP e não foi alterada.

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

O fluxo recomendado de release é o workflow `.github/workflows/windows.yml`, numa máquina Windows limpa: uma tag `v*` gera, confere e publica o instalador em GitHub Releases. Os passos estão em [RELEASE.md](RELEASE.md).

### Limitação do build local com Smart App Control

Com **Smart App Control** (ou Controle de Aplicativo) em modo ativo, o Windows bloqueia executáveis novos e sem assinatura. O electron-builder executa um instalador provisório para gerar o desinstalador e o build local falha com `spawn UNKNOWN`; do mesmo modo, `aprovar.exe` recém-compilado pode ser bloqueado. O Prumo **não** desliga nem contorna essa proteção. Em máquinas sem esse bloqueio (ou com certificado de assinatura configurado no electron-builder) `npm run dist` funciona; o workflow do GitHub é a alternativa.

## Atualizar de uma versão anterior

Instale a nova versão sobre a antiga (mesma pasta). Projetos vinculados, histórico, métricas e evidências ficam em `%LOCALAPPDATA%\PrumoQA` e nos projetos, fora da pasta de instalação, e são preservados. Os testes de atualização sobre dados reais (`Prumo-QA-Lab/automacao/prumo-qa/testes/regressao/frontend/aplicativo/migracao*.test.mjs`) exigem o executável e o perfil instalados e hoje não rodam no CI. Conexões MCP continuam válidas enquanto o executável permanecer na mesma pasta; se mudar, reconfigure em Conexões. Nada é reconfigurado em silêncio.

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

Troque `assets/prumo-icon.png` (256×256), `assets/prumo-icon.ico` (de 16 a 256 px) e `assets/prumo-icon-1024.png` (macOS e Linux) e rode `npm run dist`. O `.ico` alimenta o executável, o instalador, o desinstalador e os atalhos do Windows. O ícone atual é **provisório**: `npm run icone` (`site/release/gerar-icones.cjs`) gera os três a partir da esfera `assets/qc-orb.png` (não rode esse comando depois de colocar o seu).

## Diagnóstico de erros comuns

| Sintoma | Causa e ação |
|---|---|
| A janela não abre em desenvolvimento, erro sobre `BrowserWindow` | `ELECTRON_RUN_AS_NODE` definido; remova a variável. |
| `spawn UNKNOWN` / “Uma política de Controle de Aplicativo bloqueou este arquivo” | Smart App Control. Veja acima; use o workflow ou assine. |
| Execução protegida retorna `BLOCKED` | Falta a autenticação humana (esperado) ou o `aprovar.exe` foi bloqueado. |
| Métricas “parciais” | Há registro inválido ou truncado em `projects\`; ele é excluído, não corrigido. |
| Cliente de IA não chama o Prumo | A configuração não comprova sessão: reabra o cliente e confira em Logs se há chamadas. |
| `PROJECT_NOT_LINKED` | A raiz não está vinculada; use Projetos › Vincular pasta. |
