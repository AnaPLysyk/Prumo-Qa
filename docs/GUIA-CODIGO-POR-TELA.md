# Guia simples: onde está cada tela e o que acontece quando você clica

> **Situação:** estrutura da branch `refatoracao-modular-por-tela`. A `main` continua com os arquivos anteriores. Estas são telas de verdade movidas nesta branch; login e banco web continuam **propostos, não implementados**.

## Comece por aqui

- Quer alterar o que aparece na tela? Abra `app/renderer/telas/NOME-DA-TELA/`.
- Quer alterar o que acontece depois do clique? Abra `backend/NOME-DA-TELA/` e leia o `LEIA-ME.md` da pasta: `api/` recebe o pedido, `regras/` decide, `banco/` grava.
- Quer entender por que uma pasta local ganhou `qa.project.json`? Abra `backend/projetos/regras/proporContrato.ts`.
- Quer descobrir por onde a tela conversa com as regras? Veja `app/preload.cjs` → `backend/aplicativo/api/catalogoDeContratos.ts` (formato do pedido) → `backend/<tela>/api/<canal>.ts`. **Hoje não são endpoints HTTP**: são canais IPC seguros do Electron.
- Quer localizar como os dados locais são guardados? Veja `backend/projetos/banco/` → `backend/compartilhado/banco/gravarLocal.ts`.
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
backend/aplicativo/api/registrarCanal.ts       confere remetente e valida o formato (catalogoDeContratos.ts)
  ↓
backend/projetos/api/
  ├── espacosCriar.ts                  atende "espacos:criar"
  └── espacosEditar.ts                 atende "espacos:editar"
  ↓
backend/projetos/regras/
  ├── criarEspaco.ts                   cria projeto e contrato local
  ├── editarEspaco.ts                  altera nome e descrição
  ├── vincularPastaAoEspaco.ts         vincula pasta após validar o contrato
  ├── vincularServicoAoEspaco.ts       associa uma conexão Jira/Qase/GitHub
  ├── removerVinculoServico.ts         remove somente o vínculo
  ├── atualizarEstadoDoVinculo.ts      guarda se vínculo é válido ou indisponível
  ├── configurarAceite.ts              escolhe campo de aceite do Jira
  ├── registrarConsultaExterna.ts      grava evento de consulta no histórico
  ├── registrarEscritaExterna.ts       grava evento de escrita no histórico
  └── associarEspaco.ts                registra relações explícitas
  ↓
backend/projetos/banco/
  ├── lerEspacos.ts / gravarEspacos.ts  lê e grava espacos.json
  └── atualizarEspaco.ts               abre, altera e grava um projeto
  ↓
backend/compartilhado/banco/gravarLocal.ts   gravação segura de JSON local
backend/projetos/tipos/espacos.ts            diz quais dados de projeto são válidos
```

## Quando a pessoa vincula uma pasta sem contrato

```text
backend/projetos/api/espacosPasta.ts (ou projetosEscolher.ts)
  ↓
backend/projetos/regras/
  ├── proporContrato.ts                inspeciona a pasta, sem gravar
  ├── resumirContratoProposto.ts       mostra o que será criado à pessoa
  └── gravarContratoProposto.ts        grava somente após consentimento
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

O backend não tem mais pontes: cada tela tem `api/` (canal IPC), `regras/`, `banco/` (dados deste computador, arquivos JSON e SQLite), `integracoes/` e `tipos/`. O nome e a primeira linha de cada arquivo mostram o propósito, e o `LEIA-ME.md` de cada pasta lista tudo. Não gerar pastas vazias: a API HTTP e o PostgreSQL só existirão quando a camada web for implementada.

## Como validar antes de usar como código oficial

```powershell
npm run leia-me
npm run check
npm run app
```

Não fazer merge desta PR antes de conferir o comportamento das telas, o contrato IPC, o MCP e o instalador do Windows.
