# Arquitetura modular do Prumo QA — branch em revisão

**Situação:** descreve a estrutura atual do repositório (2.14): uma pasta por tela em `backend/` e em `frontend/`, a interface do Electron gerada em `dist/renderer/` no build e os testes em `testes/`, por tipo e depois por camada. Registros de decisões e de versões anteriores ficam no histórico do git.

## Primeiro, escolha o nome da tela

| Você quer mudar | O que aparece para a pessoa | O que executa a ação |
| --- | --- | --- |
| Início | `frontend/inicio/` | `backend/inicio/` |
| Projetos | `frontend/projetos/` | `backend/projetos/` |
| Tickets Jira | `frontend/tickets/` | `backend/tickets/` |
| Testes (IDE, Repositório, Runs e Planos): casos, automações, execuções, evidências e vínculos | `frontend/testes/` | `backend/testes/` |
| Agendamentos (e o detalhe das execuções que as rotinas geram) | `frontend/agendamentos/` | `backend/agendamentos/` |
| Métricas | `frontend/metricas/` | `backend/metricas/` |
| Logs (e o histórico das operações usado pelo chat e pelas métricas) | `frontend/logs/` | `backend/logs/` |
| Conexões e integrações | `frontend/conexoes/` | `backend/conexoes/` |
| Agentes, chat, Cérebro, Skills e contextos do projeto | `frontend/agentes/` | `backend/agentes/` |
| Suporte | `frontend/suporte/` | `backend/suporte/` |
| Ajuda | `frontend/ajuda/` | `backend/ajuda/` |
| Configurações (engrenagem) | `frontend/configuracoes/` | `backend/configuracoes/` |
| Administração (usuários, permissões, contas, agentes da plataforma, Documentação viva) | `frontend/administracao/` | `backend/administracao/` |

**Cada pasta é uma tela do aplicativo** (ou o sino de Atualizações). Não existem pastas de módulos que não sejam telas, exceto o que é transversal: `backend/aplicativo/` (janela, bandeja e registro dos canais), `backend/terminal/` (CLI), `backend/compartilhado/` e, no frontend, `design-system/` e `compartilhado/`.

Execuções, Rastreabilidade, Contextos e Histórico não têm implementações de tela separadas. O modal de Contextos fica em `frontend/agentes/modais/contextos/abrirContextos.js`; sua API, regras e persistência ficam em `backend/agentes/`. Resultados e vínculos ficam em Testes, e o histórico operacional é consultado por Logs. Os nomes de canais e os redirecionamentos antigos podem permanecer para compatibilidade, sem recriar módulos.

## O percurso de uma ação

Exemplo: a pessoa abre Projetos e clica em Salvar.

```text
frontend/projetos/
  mostrarProjetos.js                     mostra a tela
  modais/criarEditarProjeto/
    abrirFormularioProjeto.js            mostra o formulário
  modais/escolherRepositorioGithub/
    abrirRepositoriosGithub.js           lista os repositórios do GitHub conectado e vincula
                  ↓
backend/aplicativo/preload.cjs                          oferece a chamada permitida
                  ↓ IPC prumo:espacos:criar
backend/aplicativo/api/                  identifica e valida o pedido
                  ↓
backend/projetos/api/espacosCriar.ts     atende o pedido da tela
                  ↓
backend/projetos/regras/criarEspaco.ts   aplica as regras para criar
                  ↓
backend/projetos/banco/gravarEspacos.ts  grava os dados locais
```

**Importante:** os canais IPC são mensagens internas da aplicação Electron. Esses arquivos `api/` ainda não são endpoints HTTP de um backend hospedado na internet. O `banco/` atual usa dados locais; PostgreSQL, contas, login, recuperação de senha, administração multiusuário e permissões web continuam **na Proposta**.

## Onde editar sem criar duas versões da mesma tela

- `frontend/<tela>/` é a **fonte oficial da interface**.
- `frontend/design-system/ds.js` e `ds.css` são as fontes oficiais dos componentes compartilhados; o gerador preserva os caminhos `dist/renderer/ds.js` e `ds.css`.
- `frontend/recursos.json` mapeia os 20 recursos transversais da interface, incluindo entrada, traduções, identidade e painel de atividades, para os caminhos distribuídos existentes. Markdown de desenvolvimento não é copiado para o renderer.
- `backend/<tela>/` é a **fonte oficial das funções executadas fora da interface**.
- `dist/renderer/` é **gerado no build** a partir de `frontend/` (fonte única) e não é versionado; só `dist/renderer/vendor/` (biblioteca de terceiros) fica no git. Não editar `dist/renderer/`.
- `dist/renderer/fluxos-v40.js`, `testes-v40.js`, `interfaces-v36.js` e `interfaces-v36.css` são bundles gerados das partes-fonte organizadas no `frontend/`. Ainda existem componentes antigos não migrados na raiz `dist/renderer/`.

Para validar no Windows:

```powershell
npm.cmd run frontend:check
node frontend/construcao/gerar-telas-modulares.mjs --check
node frontend/construcao/verificar-modulos.mjs
npm.cmd run dependencias
npm.cmd run check
```

Para reconstruir cópias **depois de editar o frontend**: `npm.cmd run frontend:sync` e `node frontend/construcao/gerar-telas-modulares.mjs`. O comando `npm.cmd run build` também faz essas etapas automaticamente.

`docs/geradores/dependencias.mjs` resolve os imports TypeScript e informa origem, linha e destino. `--json` fornece o grafo para investigação. Um import local ausente interrompe o build; o verificador não executa módulos nem consulta projetos externos. O mapa de documentação viva também inclui `site/`, `docs/geradores/` e `backend/agentes/skills/`, sem incluir `site/public/`.

O site possui fonte em `site/gerar.mjs`, estilos em `site/estilos/base.css` e template em `site/componentes/pagina.mjs`. `site/gerar.mjs` permanece uma entrada compatível para npm, Render e CI. [Testes](TESTES.md) e [Skills](SKILLS.md) têm catálogos verificáveis; não são listas de funcionalidades aprovadas.

## Como cada arquivo deve ser escrito

A primeira linha explica o que faz, com uma frase curta em português. Um arquivo de regra faz uma ação; um arquivo de armazenamento faz uma leitura ou gravação; um formulário fica dentro da pasta do modal ou da tela. Evitar nomes como `utils.ts` ou `servicoGeral.ts` quando for possível descrever a responsabilidade.

As funções `backend/conexoes/integracoes/lerDetalheDoServico.ts`, `backend/agentes/chat/conversar.ts` e `backend/testes/regras/executarValidacao.ts` ainda concentram etapas longas. A outra sessão descreveu divisões dessas funções em arquivos temporários, **mas essas divisões não aparecem nos commits publicados** e não são tratadas aqui como código implementado.

**Documentação Viva:** `npm.cmd run arquitetura` gera as visões Atual (`origin/main`) e Proposta (cópia da branch), com referências ao código. Publicação de uma nova revisão só muda a Atual quando houver merge na `main`.

## Conexões — detalhes de Jira, Qase e GitHub

A função `backend/conexoes/integracoes/lerDetalheDoServico.ts` encaminha cada consulta para um arquivo com nome explícito. Foram separadas 13 operações sem alterar os limites de resposta e sem permitir operações em serviços diferentes.

- **Jira:** `consultarMetadadosJira.ts`, `consultarCamposTipoJira.ts`, `consultarTransicoesJira.ts`, `consultarAnexosJira.ts` e `consultarHistoricoJira.ts`.
- **Qase:** `consultarPlanoQase.ts` e `consultarCamposSistemaQase.ts`.
- **GitHub:** `consultarArquivosGithub.ts`, `consultarWorkflowsGithub.ts`, `consultarJobsGithub.ts`, `consultarArtefatosGithub.ts`, `consultarRevisoesGithub.ts` e `consultarCommitGithub.ts`.

As definições comuns estão em `backend/conexoes/tipos/ParametrosConsulta.ts` e `ResultadoConsulta.ts`. A mudança precisa passar no CI Windows antes de ser considerada validada.

## Agentes — composição do chat

O arquivo `backend/agentes/chat/conversar.ts` mantém o percurso principal da pergunta. Ele agora chama `montarResposta.ts` para montar uma resposta com fontes e segredos mascarados e `juntarConhecimentos.ts` para acrescentar conhecimentos aprovados e o indicador de Cérebro. Essas ações continuam locais e não autorizam automaticamente chamadas para IA externa.

A consulta ao provedor externo e a execução de validações continuam sendo funções longas a revisar separadamente, com testes de autorização e regressão antes do merge.

## Chat: solicitação externa, resposta e aprovação

No backend dos Agentes, cada etapa do Chat fica próxima da tela correspondente:

```text
backend/agentes/
├── chat/
│   ├── conversar.ts                  organiza a conversa
│   ├── juntarConhecimentos.ts        acrescenta conhecimentos aprovados
│   ├── montarResposta.ts             apresenta fontes e resposta sem segredos
│   ├── consultarIaExterna.ts         verifica autorização antes de chamar Claude/Codex
│   └── registrarSugestoesDaIa.ts     cria rascunhos que precisam de aprovação
└── tipos/ContextoDelegacao.ts       explica quais dados chegam à IA externa
```

O sistema não transforma automaticamente o texto de uma IA em conhecimento aprovado. Falta de autorização, cliente indisponível ou falha da execução retornam ao modo LOCAL. O comportamento continua sujeito aos testes automatizados e ao CI Windows.

## Execuções — evidência inicial antes de executar

O fluxo começa em `backend/testes/regras/executarValidacao.ts`, que chama `criarEvidenciaInicial.ts` para montar o registro inicial `BLOCKED`. Nesse momento ainda não existe execução, aprovação ou resultado. Em seguida, `executarValidacao.ts` valida contrato e escopo, solicita a confirmação humana e somente então inicia um processo, respeitando os limites de tempo e de saída. O resultado final é armazenado pelo módulo Evidências.

`testes/unitario/backend/testes/evidencia-inicial.test.mjs` verifica especificamente que uma evidência nova não simula execução ou aprovação. O fluxo completo de autorização continua sendo testado pela suíte geral; **não houve alteração das permissões humanas nesta etapa**.

### Logs e relatórios da execução

Depois de executar o processo com aprovação, `backend/testes/regras/mascararLogsDaExecucao.ts` remove segredos da saída para a interface e para as evidências. `gravarRelatorioRedigido.ts` mantém somente o relatório de casos redigido, substituindo o conteúdo bruto do runner antes do registro da evidência. Ambos são chamados por `executarValidacao.ts` e não podem alterar a aprovação, o comando, o timeout nem a classificação dos resultados.

Os testes de regressão usam pastas temporárias e dados fictícios. `testes/unitario/backend/testes/logs-e-relatorios-execucao.test.mjs` confirma o mascaramento e a substituição ou exclusão de artefatos brutos. A operação ainda precisa passar no CI Windows.

## Documentação viva dentro do aplicativo

O build gera `dist/documentacao/mapa.json` (`docs/geradores/gerar-mapa-do-aplicativo.mjs`, não versionado) a partir do código desta versão: para cada pasta de `frontend/` e `backend/`, os arquivos com a descrição da primeira linha e as funções, os canais IPC (ponte, arquivo `api/`, funções chamadas) e os testes que importam arquivos daquela tela. A tela **Administração › Documentação viva** (`frontend/administracao/`) mostra esse mapa pelo canal `administracao:mapa` (`backend/administracao/`). O mapa não leva código-fonte nem dados da pessoa. A visão Atual (main) × Proposta (cópia de trabalho) continua disponível para desenvolvimento com `npm run arquitetura`.
