# Guia simples: onde está cada tela e o que acontece quando você clica

> **Situação:** estrutura da branch `refatoracao-modular-por-tela`. A `main` continua com os arquivos anteriores. Estas são telas de verdade movidas nesta branch; login e banco web continuam **propostos, não implementados**.

## Comece por aqui

- Quer alterar o que aparece na tela? Abra `app/renderer/telas/NOME-DA-TELA/`.
- Quer alterar uma função do projeto? Abra `src/modulos/projetos/espacos/`.
- Quer entender por que uma pasta local ganhou `qa.project.json`? Abra `src/modulos/projetos/contrato/`.
- Quer descobrir por onde a tela conversa com as regras? Veja `app/preload.cjs` → `src/contratos.ts` → `src/desktop/main.ts`. **Hoje não são endpoints HTTP**: são canais IPC seguros do Electron.
- Quer localizar como os dados locais são guardados? Veja `src/modulos/projetos/espacos/armazenarEspacos.ts` → `src/armazenamentoLocal.ts`.
- **Nada aqui executa uma API HTTP própria no Render.** Isso pertence à proposta futura.

## Projetos — do botão ao arquivo gravado

```text
frontend / tela Projetos
app/renderer/telas/projetos/mostrarProjetos.js
  ├── selecionarProjeto.js               escolhe o projeto na interface
  └── modais/criarEditarProjeto/
      └── abrirFormularioProjeto.js       mostra campos e botão Salvar

  ↓ janela chama api.espacoCriar / api.espacoEditar

app/preload.cjs                       expõe só operações IPC permitidas
  ↓ canais "espacos:criar" / "espacos:editar"
src/contratos.ts                      valida formato e limite dos dados
  ↓
src/desktop/main.ts                   encaminha operação ao núcleo
  ↓
src/espacos.ts                        ponte de compatibilidade
  ↓
src/modulos/projetos/espacos/
  ├── criarProjeto.ts                  cria projeto e contrato local
  ├── editarProjeto.ts                 altera nome e descrição
  ├── vincularPastaDoProjeto.ts        vincula pasta após validar o contrato
  ├── vincularServicoAoProjeto.ts      associa uma conexão Jira/Qase/GitHub
  ├── removerServicoDoProjeto.ts       remove somente o vínculo
  ├── validarEstadoDoVinculo.ts        guarda se vínculo é válido ou indisponível
  ├── configurarCampoAceite.ts         escolhe campo de aceite do Jira
  ├── registrarConsultaExterna.ts      grava evento de consulta no histórico
  ├── registrarEscritaExterna.ts       grava evento de escrita no histórico
  ├── associarReferencias.ts           registra relações explícitas
  ├── definicoesEspaco.ts              diz quais dados de projeto são válidos
  └── armazenarEspacos.ts             lê e grava os registros locais
      ↓
src/armazenamentoLocal.ts             controla gravação segura de JSON local
```

## Quando a pessoa vincula uma pasta sem contrato

```text
src/desktop/main.ts
  ↓ src/contratoDetectado.ts (ponte)
src/modulos/projetos/contrato/
  ├── proporContrato.ts                inspeciona a pasta, sem gravar
  ├── resumirContrato.ts               mostra o que será criado à pessoa
  └── gravarContratoAprovado.ts         grava somente após consentimento
```

## Outras telas extraídas

| Tela | Abra este arquivo | O que ele mostra |
| --- | --- | --- |
| Conexões | `app/renderer/telas/conexoes/mostrarConexoes.js` | Formulário de serviço, credencial e seleção de recurso |
| Tickets | `app/renderer/telas/tickets/mostrarTickets.js` | Consulta de tickets Jira |
| Testes | `app/renderer/telas/testes/mostrarTestesRemotos.js` | Consulta de casos e planos Qase |
| Automações | `app/renderer/telas/automacoes/mostrarAutomacoes.js` | Automações da pasta local e repositório |
| Rastreabilidade | `app/renderer/telas/rastreabilidade/mostrarRastreabilidade.js` | Liga um ticket a um caso com confirmação da pessoa |
| Histórico | `app/renderer/telas/historico/mostrarHistorico.js` | Histórico dos vínculos, consultas e eventos |
| Suporte | `app/renderer/telas/suporte/mostrarSuporte.js` | Relatos revisáveis e informações de diagnóstico |
| Ajuda | `app/renderer/telas/ajuda/mostrarAjuda.js` | Guias, busca, versões e documentação |
| Agentes / Contextos | `app/renderer/telas/agentes/abrirModalContextos.js` | Modal de contextos associado à tela Agentes |

Os pequenos componentes comuns ficam em `app/renderer/telas/compartilhado/`: cada arquivo se chama pelo que faz, por exemplo `criarBotaoAcao.js`, `criarCampoFormulario.js` e `consultarServicoRemoto.js`.

**Atenção:** o renderer possui outras versões que complementam ou substituem esses fluxos (por exemplo, `fluxos-v40.js`, `testes-v40.js`, `integracoes.js` e `interfaces-v36.js`). Esses arquivos **ainda não foram migrados**. Não conclua que os arquivos acima são a única implementação de cada tela.

## Fluxo do backend sem adivinhações

A organização atual preserva interfaces existentes para não quebrar chamadas: `src/espacos.ts` e `src/contratoDetectado.ts` são pontes e não regras novas. O nome e o comentário inicial de cada arquivo mostram o propósito. Não gerar `endpoints/` ou `banco/` vazios: as APIs HTTP e PostgreSQL por módulo serão criadas apenas quando a camada web for implementada.

## Como validar antes de usar como código oficial

```powershell
node scripts/verificar-modulos.mjs
npm run check
npm run app
```

Não fazer merge desta PR antes de conferir o comportamento das telas, o contrato IPC, o MCP e o instalador do Windows.

## Suporte — como um relato chega ao GitHub

```text
app/renderer/telas/suporte/mostrarSuporte.js      mostra campos e revisão
  ↓ api.suportePreparar
app/preload.cjs → src/contratos.ts → src/desktop/main.ts
  ↓ src/suporte.ts (entrada de compatibilidade)
src/modulos/suporte/
  definirSolicitacao.ts                           valida os campos
  revisarPrivacidadeRelato.ts                    verifica segredos e privacidade
  montarTextoRelato.ts                           monta a prévia em Markdown
  gerarLinkGithubRelato.ts                       gera o link oficial
  prepararRelato.ts                              devolve prévia sem enviar
```

## Configurações, Agentes e Ajuda

```text
src/preferencias.ts                                entrada de compatibilidade
  ↓ src/modulos/configuracoes/                     tipo, tema, idioma e armazenamento
  ↓ src/modulos/agentes/autorizarDelegacaoIa.ts    permissão de delegar à IA
  ↓ src/modulos/ajuda/                             aviso e reconhecimento de versão
```

A delegação à IA só é autorizada depois de confirmação no processo principal. A gravação continua local; ainda não existe cadastro, login ou banco de usuários nesta branch.
