# Guia simples: onde está cada tela e o que acontece quando você clica

> **Situação:** estrutura da branch `refatoracao-modular-por-tela`. A `main` continua com os arquivos anteriores. Estas são telas de verdade movidas nesta branch; login e banco web continuam **propostos, não implementados**.

## Comece por aqui

- Quer alterar o que aparece na tela? Abra `frontend/NOME-DA-TELA/`.
- Quer alterar o que acontece depois do clique? Abra `backend/NOME-DA-TELA/` e leia o `LEIA-ME.md` da pasta: `api/` recebe o pedido, `regras/` decide, `banco/` grava.
- Quer entender por que uma pasta local ganhou `qa.project.json`? Abra `backend/projetos/regras/proporContrato.ts`.
- Quer descobrir por onde a tela conversa com as regras? Veja `backend/aplicativo/preload.cjs` → `backend/aplicativo/api/catalogoDeContratos.ts` (formato do pedido) → `backend/<tela>/api/<canal>.ts`. **Hoje não são endpoints HTTP**: são canais IPC seguros do Electron.
- Quer localizar como os dados locais são guardados? Veja `backend/projetos/banco/` → `backend/compartilhado/banco/gravarLocal.ts`.
- **Nada aqui executa uma API HTTP própria no Render.** Isso pertence à proposta futura.

## Projetos — do botão ao arquivo gravado

```text
frontend / tela Projetos
frontend/projetos/mostrarProjetos.js
  ├── selecionarProjeto.js               escolhe o projeto na interface
  └── modais/criarEditarProjeto/
      └── abrirFormularioProjeto.js       mostra campos e botão Salvar

  ↓ janela chama api.espacoCriar / api.espacoEditar

backend/aplicativo/preload.cjs                       expõe só operações IPC permitidas
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
| Conexões | `frontend/conexoes/mostrarConexoes.js` | Formulário de serviço, credencial e seleção de recurso |
| Tickets | `frontend/tickets/fluxos-v40-trecho-02.parte.js` | Tickets do Jira, defeitos do Qase e tickets locais criados a partir de falhas de runs |
| Testes | `frontend/testes/fluxos-v40-trecho-03.parte.js` | Catálogo, casos, planos e runs |
| Automações | `frontend/automacoes/mostrarAutomacoes.js` | Automações da pasta local e repositório |
| Rastreabilidade | `frontend/rastreabilidade/fluxos-v40-trecho-05.parte.js` | Liga um ticket a um caso com confirmação da pessoa |
| Histórico | `frontend/historico/mostrarHistorico.js` | Histórico dos vínculos, consultas e eventos |
| Suporte | `frontend/suporte/mostrarSuporte.js` | Relatos revisáveis e informações de diagnóstico |
| Ajuda | `frontend/ajuda/mostrarAjuda.js` | Guias, busca, versões e documentação |
| Agentes / Contextos | `frontend/agentes/abrirModalContextos.js` | Modal de contextos associado à tela Agentes |

Os pequenos componentes comuns ficam em `frontend/compartilhado/`: cada arquivo se chama pelo que faz, por exemplo `criarBotaoAcao.js`, `criarCampoFormulario.js` e `consultarServicoRemoto.js`.

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

## Suporte — como um relato chega ao GitHub

```text
frontend/suporte/mostrarSuporte.js      mostra campos e revisão
  ↓ api.suportePreparar
backend/aplicativo/preload.cjs → src/contratos.ts → src/desktop/main.ts
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

## Acompanhar um chamado de Suporte

O botão Consultar chamado da tela Suporte percorre a ponte `src/chamados.ts` e os três módulos `src/modulos/suporte/definirFormatoChamado.ts`, `buscarDadosDoChamado.ts` e `consultarChamadoGithub.ts`. Nenhuma credencial é enviada à consulta pública do GitHub. O arquivo de definição de status continua sendo `docs/catalogo/suporte-status.json`.

## Organização por tela: Início, Agendamentos, Execuções e integrações

Agora `dist/renderer/index.html` carrega os arquivos de interface na mesma ordem funcional em que os scripts grandes eram executados. Cada pasta tem um `LEIA-ME.md` curto. A divisão não altera os contratos IPC nem cria HTTP novo.

```text
frontend/
├── inicio/mostrarInicio.js                    inicia o painel
├── agendamentos/
│   ├── mostrarAgendamentos.js                  mostra rotinas
│   ├── formularios/montarFormularioRotina.js   campos de criar/editar
│   ├── cartoes/montarCartaoRotina.js           cada rotina em cartão
│   ├── permissoes/mostrarPermissoesRotina.js  permissões de execução
│   └── datas/interpretarHorarios.js            datas e fusos
├── execucoes/operacao-v40.js                   histórico e detalhes
├── metricas/mostrarMetricas.js                 indicadores
├── tickets/fluxos-v40-trecho-02.parte.js       tickets, detalhe, criação e tickets locais
├── testes/
│   ├── formularios/montarFormularioProposta.js
│   ├── cartoes/montarCartaoProposta.js
│   └── mostrarCatalogoCodigo.js
├── runs/fluxos-v40-trecho-04.parte.js          runs locais e do Qase
├── rastreabilidade/mostrarVinculos.js          vínculos declarados
├── conexoes/mostrarEscritaExterna.js           autorizações por serviço
├── agentes/mostrarAgentesIntegrados.js         recursos do painel Agentes
└── configuracoes/controlesDaJanela.js         menu, tema e idioma
```

Os arquivos `dist/renderer/agenda.js` e `dist/renderer/integracoes.js` agora são marcadores de transição e **não são carregados** pelo `index.html`. As implementações de apresentação permanecem em JavaScript clássico, com a ordem dos scripts explícita e funções globais acessíveis entre eles. A futura consolidação definitiva de `frontend/` e `backend/` ainda depende de adaptar build, empacotamento e demais arquivos.

## Fluxos e Testes avançados: organização das funções sem mudar a janela

As implementações grandes v40 usam funções no mesmo escopo. Para manter o código executado exatamente igual durante a migração, os arquivos-fonte `.parte.js` ficam na pasta da própria tela, em `frontend/<nome-da-tela>/`.

Abra a pasta da tela, escolha o arquivo pelo nome da função e leia a frase inicial. Para alterar uma ação, edite **a parte-fonte** e depois rode `node ferramentas/frontend/gerar-telas-modulares.mjs`. Não edite diretamente `fluxos-v40.js` ou `testes-v40.js`, pois agora eles são arquivos gerados que o Electron carrega. A geração não substitui testes de comportamento.

Os testes em `testes/arquitetura-telas.test.mjs` comprovam que a união das partes reproduz integralmente os arquivos executados e que o `index.html` carrega apenas os bundles na ordem correta. Use `node ferramentas/frontend/gerar-telas-modulares.mjs --check` para conferir a igualdade sem escrever arquivos.

**Atenção:** `frontend/` e `backend/` continuam como organização futura. As novas telas de login e administração permanecem na documentação Proposta; não aparecem na árvore atual de código.

## Visual v36: onde estão as funções do robô, chat e cérebro

O visual aprovado continua funcionando por `dist/renderer/interfaces-v36.js` e `dist/renderer/interfaces-v36.css`. Para facilitar a manutenção, suas fontes estão divididas em pastas `frontend/<tela>/visual-v36-fonte/` e `visual-v36-estilos/`. O código gerado continua idêntico ao original na revisão da migração.

Procure **Agentes** para `montarAssistenteFlutuante`, `montarPainelChat`, `enviarPerguntaChat`, `mostrarCerebroAgente`, `listarAgentesDisponiveis` e `abrirDetalhesAgente`. Procure **Logs** para `montarLinhaLog`, `desenharLogsFiltrados` e `carregarRegistrosLog`. Procure **Histórico** para `filtrarAtividadesHistorico` e `montarTabelaHistorico`. Procure **Métricas** para `filtrarRegistrosMetricas`, `prepararDadosGrafico` e `pintarGrafico`. Em **Configurações**, `editarPreferenciasAssistente` concentra a exibição dos campos de IA, voz e estilo.

O gerador atualizado é `node ferramentas/frontend/gerar-telas-modulares.mjs`; com `--check` ele compara as fontes sem escrever. O comando anterior `node ferramentas/frontend/gerar-telas-modulares.mjs` continua funcionando como ponte, mas use o novo nome. `testes/arquitetura-telas.test.mjs` confere os bundles JavaScript, o CSS gerado e o carregamento das páginas.

**Limite da comprovação:** arquivos gerados idênticos comprovam que a refatoração das fontes não alterou esses bytes na migração; não comprovam isoladamente o funcionamento de todas as telas, nem substituem os testes do Electron e a validação visual.
