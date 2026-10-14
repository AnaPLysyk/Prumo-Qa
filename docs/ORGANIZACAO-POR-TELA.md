# Organização didática por tela — migração em andamento

> **Situação:** esta branch já contém `backend/<tela>/` e `frontend/<tela>/`. O Electron carrega `dist/renderer/`, gerado no build a partir de `frontend/` e não versionado. Consulte [o guia atual](ARQUITETURA-MODULAR-ATUAL.md) antes das notas históricas abaixo. A `main` não mudou.

## Objetivo

Abrir uma pasta com o nome da tela ou função e entender o que existe ali apenas pela leitura. Cada arquivo deve começar com **uma frase em português** dizendo o que faz; quando um modal ou fluxo tem várias responsabilidades, recebe subpasta própria. Código compartilhado fica compartilhado apenas quando é realmente usado por mais de uma tela.

## Estrutura final desejada (não existente ainda)

```text
frontend/
  inicio/
  projetos/{tela,componentes,modais/{criar,editar,membros},acoes}
  tickets/{tela,componentes,modais,acoes}
  testes/{tela,componentes,modais,acoes}
  runs/
  agendamentos/
  execucoes/
  rastreabilidade/
  agentes/{chat,cerebro,laboratorio,mcp,componentes}
  conexoes/{jira,qase,github,ia}
  automacoes/
  metricas/
  logs/
  historico/
  login/
  cadastro/
  recuperar-senha/
  administracao/{usuarios,permissoes,auditoria}
  configuracoes/
  suporte/
  ajuda/
  compartilhado/{navegacao,componentes,tema}

backend/
  inicio/
  projetos/{endpoints,regras,permissoes,banco,integracoes}
  tickets/{endpoints,regras,banco,jira}
  testes/{endpoints,regras,banco,catalogo}
  runs/{endpoints,regras,banco,qase}
  agendamentos/{endpoints,regras,banco,worker}
  execucoes/{endpoints,regras,banco,evidencias}
  rastreabilidade/{endpoints,regras,banco}
  agentes/{endpoints,regras,banco,mcp,conversas,conhecimento}
  conexoes/{endpoints,regras,banco,jira,qase,github,ia}
  automacoes/
  metricas/
  logs/
  historico/
  login/{endpoints,regras,banco}
  cadastro/{endpoints,regras,banco}
  recuperar-senha/{endpoints,regras,banco}
  administracao/{usuarios,permissoes,auditoria}
  configuracoes/
  suporte/
  ajuda/
  compartilhado/{contratos,seguranca,persistencia,desktop}
```

> Não criar pastas vazias apenas para preencher o desenho. Cada arquivo deve ter responsabilidade concreta, com seus tipos/contratos e chamadas identificados no código existente. Nos módulos web planejados, **API e banco ficam dentro da função/tela correspondente**. A configuração da conexão com o banco é uma exceção compartilhada.

## Backend: migração concluída nesta branch (refatoracao-backend-por-tela)

Todo o antigo `src/` foi movido para `backend/<tela>/`, sem pontes e sem mudar comportamento. O compilador usa `backend/` como `rootDir`; `dist/` repete a mesma árvore. As três portas de entrada continuam onde a instalação espera:

| Porta | Arquivo | Observação |
| --- | --- | --- |
| Aplicativo desktop | `backend/aplicativo.ts` → `dist/aplicativo.js` | `package.json` aponta para ela |
| Terminal | `backend/cli.ts` → `dist/cli.js` | mesmo binário `prumo` |
| Servidor MCP | `backend/mcp.ts` → `dist/mcp.js` | **mesmo caminho das versões anteriores**: configurações MCP já instaladas continuam valendo |

Dentro de cada tela: `api/` (um arquivo por canal IPC, com o nome do canal: `espacos:criar` → `projetos/api/espacosCriar.ts`), `regras/`, `banco/` (dados deste computador), `integracoes/` (Jira, Qase, GitHub, IA) e `tipos/` (formatos e limites). Pastas extras só quando a tela tem um assunto próprio (`agendamentos/worker`, `agentes/mcp`, `conexoes/escrita`...). `compartilhado/` guarda só o que várias telas usam.

Regras verificadas por `testes/estrutura-backend.test.mjs` (roda no `npm run check` e no CI):

- toda primeira linha é `/** descrição em português */`;
- fora de `tipos/`, cada arquivo tem **uma** declaração exportada, com o nome do arquivo, e nenhuma auxiliar escondida;
- `tipos/` não tem funções;
- nomes de função únicos no backend inteiro;
- todo canal IPC tem seu arquivo em `api/`;
- `backend/LEIA-ME.md` e `backend/<tela>/LEIA-ME.md` iguais ao código (`npm run leia-me`).

Duplicatas idênticas viraram uma só função (ex.: `codificarParaUrl`, `semAcentos`, `versaoDoPacote`, `raizDoAplicativo`). As variáveis que mudam com o aplicativo aberto ficam juntas em `backend/aplicativo/estadoDoAplicativo.ts`. O destino de cada canal no catálogo técnico (Ajuda › Integrações técnicas e `docs/CONTRATOS.md`) é gerado do código: o arquivo `api/` e as funções que ele chama.

Exceção registrada: `backend/aplicativo/api/catalogoDeContratos.ts` continua uma tabela única com os 119 canais e as 8 ferramentas MCP. As antigas "fábricas" com várias funções dentro já foram divididas, uma ação por arquivo, mantendo a mesma API: `Worker` (agendamentos/worker), `nucleoServicos` e `cofreCredenciais` (conexoes), `AdaptadorServico` (conexoes/integracoes) e `criarServidor` (uma ferramenta MCP por arquivo em agentes/mcp). Ainda há funções únicas longas, que podem ganhar passos menores sem mudar comportamento: `lerDetalheDoServico`, `responderComDadosLocais`, `revisarCobertura`, `executarValidacao`, `conversar`, `mapaDeVinculos`, `executarK6` e `executarComandoPrumo`.

## Segunda etapa: arquivos existentes na branch, separados por tela

Agora os scripts de interface estão dentro de `frontend/`, carregados explicitamente por `dist/renderer/index.html`. Projetos tem seu formulário em `telas/projetos/modais/criarEditarProjeto/`. Suporte e Ajuda já possuem arquivos separados; Contextos é um modal em Agentes. Os scripts genéricos `plataforma.js` e `apoio-v40.js` foram deixados apenas como marcadores de migração, **não executados** na página.


**Leia `docs/GUIA-CODIGO-POR-TELA.md`** para acompanhar a lógica da tela Projetos, incluindo os canais IPC, a regra e o armazenamento.

Há etapas posteriores obrigatórias: migrar arquivos grandes `fluxos-v40.js`, `testes-v40.js`, `interfaces-v36.js`, `integracoes.js`; só depois reorganizar `rootDir`, `dist`, Electron, CLI, MCP e instalador para o layout final `frontend/` e `backend/`. Login, banco multiusuário e API HTTPS continuam como proposta.


## Atualização: telas separadas nesta branch

Também foram decompostos `dist/renderer/agenda.js` (Início, Agendamentos, Execuções, controles da janela e worker) e `dist/renderer/integracoes.js` (Tickets, Testes, Runs, Conexões, Automações, Agentes, Rastreabilidade e Métricas). `dist/renderer/index.html` passou a listar os novos scripts por tela na ordem de execução original. Os dois arquivos antigos são apenas marcadores de transição. Documentação em `docs/GUIA-CODIGO-POR-TELA.md`.

**Atenção:** ainda há código de interface concentrado em `dist/renderer/fluxos-v40.js`, `dist/renderer/testes-v40.js`, `dist/renderer/interfaces-v36.js` e outros. A interface modularizada ainda não é a arquitetura final `frontend/`.

## O que **não** foi migrado

No frontend, os arquivos de `dist/renderer/` fora das telas listadas continuam nos caminhos originais. O backend inteiro já está em `backend/`. Login, cadastro, permissões por usuário, API HTTPS e PostgreSQL pertencem à **proposta**, não são funcionalidades já implementadas. Não copiar o HTML da documentação viva como se fosse uma aplicação operacional.

## Migração seguinte, módulo por módulo

1. Registrar cada tela, cada modal e cada função real no inventário; identificar componentes duplicados e reuso legítimo.
2. Para cada tela, separar componentes de interface e ações; em cada backend, separar entrada (endpoint/IPC), regra, serviço externo e consulta de dados por responsabilidade.
3. Atualizar imports, `tsconfig.json`, scripts, paths de `dist/`, entrada do Electron, preload, distribuição, CLI, MCP, site e referências nos testes **antes** de eliminar as pontes.
4. Garantir que `backend/aplicativo/api/catalogoDeContratos.ts` continue sendo a fonte real dos 119 contratos IPC, preservando todas as autorizações, limites e revisões humanas.
5. Preservar segurança de credenciais, isolamento local, escrita externa controlada e dados existentes.
6. Criar os módulos novos (login, cadastro, reset, administração e banco) como **novas funcionalidades**, com autenticação e autorização por recurso e usuário.
7. Executar `npm run check` (inclui `testes/estrutura-backend.test.mjs`), testes de janela, MCP e empacotamento Windows, corrigindo falhas antes de solicitar merge.

**Fonte:** estrutura publicada do Prumo QA 2.10.2 (`main` na criação da branch). O canvas da Documentação Viva é ferramenta de planejamento, não substitui código/contratos.

**Política de nomes:** preferir `criarProjeto.ts` a `helpers.ts`; preferir `modalCriarProjeto/` a `componentesDiversos/`; escrever na primeira linha do arquivo uma frase exata sobre sua função.

## Fontes por função — Fluxos, Testes e Visual v36

Os arquivos `fluxos-v40.js`, `testes-v40.js`, `interfaces-v36.js` e `interfaces-v36.css` foram **organizados como fontes por tela e função**, mantendo os quatro arquivos originais como bundles executados. O gerador `ferramentas/frontend/gerar-telas-modulares.mjs` recompõe os arquivos a partir de `ferramentas/frontend/telas-modulares.json`.

**Total nesta etapa:** 35 partes de Fluxos, 17 de Testes v40, 77 do visual v36 JavaScript e 27 de estilos v36 CSS. As fontes não devem ser carregadas isoladamente porque mantêm relações de escopo e ordem de execução. O CSS preserva a ordem da cascata.

**Realizado:** as cópias do Electron deixaram de ser versionadas; `dist/renderer/` é gerado no build. **Ainda não realizado:** migração total dos scripts legados e adaptação completa do empacotamento; divisão restante do núcleo desktop; implementação das novas telas de autenticação e administração; PostgreSQL e API HTTPS. A Documentação Viva Proposta não equivale a código já implementado.
