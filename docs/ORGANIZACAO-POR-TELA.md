# Organização didática por tela — migração em andamento

> **Situação:** migração inicial; `main` permanece intacta. Esta branch **ainda não implementa** a organização final `frontend/` e `backend/`. Não declarar equivalência funcional sem executar `npm run check` e validação do Electron.

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

## Primeira etapa realmente movida nesta branch

O compilador ainda usa `src/` como `rootDir`. Para não quebrar `dist/`, CLI, Electron e MCP, estas implementações foram movidas inicialmente para `src/modulos/`. Os caminhos originais continuam como **pontes temporárias de reexportação**, a remover só depois da migração de build/testes.

| Caminho anterior (ponte) | Implementação modular | Responsabilidade |
| --- | --- | --- |
| `src/rastreabilidade.ts` | `src/modulos/rastreabilidade/mapaDeVinculos.ts` | Montar mapa de vínculos do projeto |
| `src/rotasEscrita.ts` | `src/modulos/conexoes/rotaEscritaPermitida.ts` | Validar rotas de escrita permitidas |
| `src/playwright.ts` | `src/modulos/testes/converterRelatorioPlaywright.ts` | Converter JSON do Playwright |
| `src/adf.ts` | `src/modulos/tickets/textoParaAdf.ts` | Converter texto em ADF para Jira |
| `src/multipart.ts` | `src/modulos/conexoes/montarMultipart.ts` | Montar anexos multipart |
| `src/qualidade.ts` | `src/modulos/testes/revisarCobertura.ts` | Revisar cobertura por evidências |
| `src/diagnostico.ts` | `src/modulos/logs/diagnosticoIpc.ts` | Registrar diagnósticos IPC |
| `src/textosDesktop.ts` | `src/modulos/configuracoes/textosDesktop.ts` | Textos da bandeja do desktop |

## O que **não** foi migrado

Os demais arquivos de `src/`, os arquivos do renderer em `app/renderer/`, os 119 canais IPC, o servidor MCP, o worker e o instalador continuam em seus caminhos originais. Login, cadastro, permissões por usuário, API HTTPS e PostgreSQL pertencem à **proposta**, não são funcionalidades já implementadas. Não copiar o HTML da documentação viva como se fosse uma aplicação operacional.

## Migração seguinte, módulo por módulo

1. Registrar cada tela, cada modal e cada função real no inventário; identificar componentes duplicados e reuso legítimo.
2. Para cada tela, separar componentes de interface e ações; em cada backend, separar entrada (endpoint/IPC), regra, serviço externo e consulta de dados por responsabilidade.
3. Atualizar imports, `tsconfig.json`, scripts, paths de `dist/`, entrada do Electron, preload, distribuição, CLI, MCP, site e referências nos testes **antes** de eliminar as pontes.
4. Garantir que `src/contratos.ts` continue sendo a fonte real dos 119 contratos IPC, preservando todas as autorizações, limites e revisões humanas.
5. Preservar segurança de credenciais, isolamento local, escrita externa controlada e dados existentes.
6. Criar os módulos novos (login, cadastro, reset, administração e banco) como **novas funcionalidades**, com autenticação e autorização por recurso e usuário.
7. Executar `node scripts/verificar-modulos.mjs`, `npm run check`, testes de janela, MCP e empacotamento Windows, corrigindo falhas antes de solicitar merge.

**Fonte:** estrutura publicada do Prumo QA 2.10.2 (`main` na criação da branch). O canvas da Documentação Viva é ferramenta de planejamento, não substitui código/contratos.

**Política de nomes:** preferir `criarProjeto.ts` a `helpers.ts`; preferir `modalCriarProjeto/` a `componentesDiversos/`; escrever na primeira linha do arquivo uma frase exata sobre sua função.
