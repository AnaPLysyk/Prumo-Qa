# Arquitetura modular do Prumo QA — branch em revisão

**Situação real:** esta documentação descreve a branch `refatoracao-modular-por-tela`, **não a `main` publicada**. O aplicativo de produção permanece na versão existente. A refatoração depende do CI Windows e de testes locais antes do merge.

## Primeiro, escolha o nome da tela

| Você quer mudar | O que aparece para a pessoa | O que executa a ação |
| --- | --- | --- |
| Projetos | `frontend/projetos/` | `backend/projetos/` |
| Tickets Jira | `frontend/tickets/` | `backend/tickets/` |
| Testes e casos Qase | `frontend/testes/` | `backend/testes/` |
| Agentes, chat e Cérebro | `frontend/agentes/` | `backend/agentes/` |
| Conexões e integrações | `frontend/conexoes/` | `backend/conexoes/` |
| Agendamentos | `frontend/agendamentos/` | `backend/agendamentos/` |
| Execuções | `frontend/execucoes/` | `backend/execucoes/` |
| Rastreabilidade | `frontend/rastreabilidade/` | `backend/rastreabilidade/` |
| Métricas | `frontend/metricas/` | `backend/metricas/` |
| Histórico | `frontend/historico/` | `backend/historico/` |
| Logs | `frontend/logs/` | `backend/logs/` |
| Ajuda e suporte | `frontend/ajuda/`, `frontend/suporte/` | `backend/ajuda/`, `backend/suporte/` |
| Configurações | `frontend/configuracoes/` | `backend/configuracoes/` |

Outras pastas do backend, como `aplicativo/`, `atualizacoes/`, `contextos/`, `evidencias/` e `terminal/`, atendem funções transversais ou abas internas; **não são necessariamente telas independentes**.

## O percurso de uma ação

Exemplo: a pessoa abre Projetos e clica em Salvar.

```text
frontend/projetos/
  mostrarProjetos.js                     mostra a tela
  modais/criarEditarProjeto/
    abrirFormularioProjeto.js            mostra o formulário
                  ↓
app/preload.cjs                          oferece a chamada permitida
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
- `backend/<tela>/` é a **fonte oficial das funções executadas fora da interface**.
- `app/renderer/telas/` é **uma cópia gerada para compatibilidade** com o Electron: não editar manualmente.
- `app/renderer/fluxos-v40.js`, `testes-v40.js`, `interfaces-v36.js` e `interfaces-v36.css` são bundles gerados das partes-fonte organizadas no `frontend/`. Ainda existem componentes antigos não migrados na raiz `app/renderer/`.

Para validar no Windows:

```powershell
npm.cmd run frontend:check
node scripts/gerar-telas-modulares.mjs --check
node scripts/verificar-modulos.mjs
npm.cmd run check
```

Para reconstruir cópias **depois de editar o frontend**: `npm.cmd run frontend:sync` e `node scripts/gerar-telas-modulares.mjs`. O comando `npm.cmd run build` também faz essas etapas automaticamente.

## Como cada arquivo deve ser escrito

A primeira linha explica o que faz, com uma frase curta em português. Um arquivo de regra faz uma ação; um arquivo de armazenamento faz uma leitura ou gravação; um formulário fica dentro da pasta do modal ou da tela. Evitar nomes como `utils.ts` ou `servicoGeral.ts` quando for possível descrever a responsabilidade.

As funções `backend/conexoes/integracoes/lerDetalheDoServico.ts`, `backend/agentes/chat/conversar.ts` e `backend/execucoes/regras/executarValidacao.ts` ainda concentram etapas longas. A outra sessão descreveu divisões dessas funções em arquivos temporários, **mas essas divisões não aparecem nos commits publicados** e não são tratadas aqui como código implementado.

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

O fluxo começa em `backend/execucoes/regras/executarValidacao.ts`, que chama `criarEvidenciaInicial.ts` para montar o registro inicial `BLOCKED`. Nesse momento ainda não existe execução, aprovação ou resultado. Em seguida, `executarValidacao.ts` valida contrato e escopo, solicita a confirmação humana e somente então inicia um processo, respeitando os limites de tempo e de saída. O resultado final é armazenado pelo módulo Evidências.

`testes/evidencia-inicial.test.mjs` verifica especificamente que uma evidência nova não simula execução ou aprovação. O fluxo completo de autorização continua sendo testado pela suíte geral; **não houve alteração das permissões humanas nesta etapa**.

### Logs e relatórios da execução

Depois de executar o processo com aprovação, `backend/execucoes/regras/mascararLogsDaExecucao.ts` remove segredos da saída para a interface e para as evidências. `gravarRelatorioRedigido.ts` mantém somente o relatório de casos redigido, substituindo o conteúdo bruto do runner antes do registro da evidência. Ambos são chamados por `executarValidacao.ts` e não podem alterar a aprovação, o comando, o timeout nem a classificação dos resultados.

Os testes de regressão usam pastas temporárias e dados fictícios. `testes/logs-e-relatorios-execucao.test.mjs` confirma o mascaramento e a substituição ou exclusão de artefatos brutos. A operação ainda precisa passar no CI Windows.
