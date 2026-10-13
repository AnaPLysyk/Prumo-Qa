# Interfaces v40 — Design System e fluxos de qualidade

Trabalho local na branch `prumo/interfaces-aprovadas-v36`, sobre as alterações
v36/v39 ainda não confirmadas. Sem deploy, publicação ou alteração da main.
Referência visual: `prumo_qa_v39_qualidade_fluxos.html`. O código existente é a
fonte da verdade funcional; dados e números do protótipo não foram importados.
Design System: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Linha de base (antes da v40)

`npm run check` numa cópia isolada do working tree: 339 testes, **13 falhas**
(uma ambiental: cópia sem `.git`). Causas principais: o modal v39 bloqueava o
clique seguinte no menu; corrida entre o clique e a ligação dos listeners na
abertura da janela; testes v39 com resposta HTTP global incompatível com a
revalidação do vínculo feita pelo núcleo.

## Grupo B — implementado

| Tela | Resultado |
|---|---|
| Tickets | Jira e defeitos Qase numa tabela única, origem por linha, filtros (texto, origem, tipo do Jira, status, período), "Carregar mais" por fonte e estado de cada fonte. Modal de ticket com descrição, critérios, relações (Jira e Prumo), comentários, histórico, anexos, transição, edição de resumo/descrição e importação como contexto. Escrita indisponível quando desligada no projeto. Consulta avançada (descoberta de campos) em modal. |
| Defeito Qase → Jira | Modal de defeito somente leitura; "Abrir ticket no Jira…" pré-preenche o ticket, envia por `jira.criar_ticket` (confirmação nativa) e registra o vínculo `qase-defeito → jira-bug`. Com vínculo existente, o botão não é oferecido; duplicidade também é barrada pelo núcleo (`TRACE_DUPLICATE`). |
| Testes | Abas Catálogo, Casos, Suites, Planos, Runs, Automação. Casos: tipo de execução explícito (manual, automatizado, automação planejada), automação declarada no Prumo, ticket e último resultado no Prumo. Modal de caso com passos, resultados locais, associação a ticket, declaração de automação e edição (`qase.editar_caso`). Suites/planos com criação autorizada; runs locais e do Qase na mesma lista, run local em modal (casos, resultado manual, política de publicação, criar/executar/publicar). |
| Agendamentos | Tabela de rotinas (fluxo, ambiente, frequência, próxima/última execução, autorização, estado) com pausar/retomar na linha. Modal com Visão geral (regras de aprovação, falha e destino dos resultados), Autorização e Execuções da rotina. Formulário existente agrupado em Fluxo, Quando e Horário perdido. Políticas Jira e Prumo residente em "Políticas e preferências". |
| Execuções | Resumo compacto, filtros que se aplicam ao mudar, tabela com cenários e resultado. Modal Resumo · Etapas · Logs · Evidências, com evidência e logs reais do núcleo, exportação JSON e prévia/publicação do comentário Jira. Falha pode virar **rascunho** de bug (proposta local). Evidências CLI/MCP abrem em modal; Evidências segue fora do menu. |
| Rastreabilidade | Trilha ticket → caso → automação → execução/evidência → defeito a partir de `vinculosMapa`, com origem do vínculo (declarado, registrado, observado), busca, filtro de lacunas e de resultado observado, troca de projeto, abertura de cada nó. Vínculo removido fica desabilitado. Relações, lacunas e operações externas na aba Relações; declaração em modal. |
| Suporte | Formulário em etapas (descrever, revisar, enviar), passos só para bug, aviso público, lateral com acesso rápido, diagnóstico local e acompanhamento de chamado. Mesma revisão e bloqueios do núcleo. |
| Ajuda | Índice agrupado (primeiros passos, fluxos, IA, suporte, segurança, referência técnica), página inicial, busca com trecho destacado e trilha de navegação. Versões, atualizações, integrações e dados preservados. |

## Grupo A — revisado

Início/Orchestrator, chat flutuante, Agentes/Cérebro, Métricas, Histórico e Logs
foram preservados. Correções comprovadas:

- Métricas/Histórico e Agentes: rolagem horizontal entre 831 e 860 px (CSS em `ds.css`).
- Conexões: caixa vazia do formulário sempre visível; selo "NÃO CONFIGURADO" na escrita desligada.
- Projetos: seis botões soltos por projeto viraram uma linha por vínculo (serviço, chave, ID, instância, validação, estado, Validar/Remover com os mesmos nomes acessíveis).

## Núcleo (mudança mínima)

`src/espacos.ts` e `src/rastreabilidade.ts`: tipo de referência `qase-defeito`
(serviço Qase), para registrar o vínculo defeito → ticket. Nenhuma migração;
validação de escopo e duplicidade existentes inalteradas.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `app/renderer/ds.css`, `ds.js` | Design System (tokens derivados, componentes, utilitários; CSP sem `style`). |
| `app/renderer/fluxos-v40.js` | Tickets, defeito, caso, Testes e Rastreabilidade. |
| `app/renderer/operacao-v40.js` | Agendamentos, Execuções e evidências. |
| `app/renderer/apoio-v40.js` | Suporte e Ajuda. |
| `frontend/compartilhado/runtime/i18n-en-v40.js` | Fonte do inglês das telas novas; gera `app/renderer/i18n-en-v40.js`, sem redefinir chaves existentes. |
| `app/renderer/qualidade-v39.js` | Modal ganha tamanho e subtítulo. |
| `app/renderer/agenda.js` | Formulário de rotina com o layout do DS (mesmos campos e IDs). |
| `app/renderer/plataforma.js`, `integracoes.js` | Correções de Projetos e Conexões. |
| `app/renderer/index.html` | Carrega os arquivos v40; remove `qualidade-fontes-v39.js` (substituído). |
| `testes/janela.mjs` | Espera a primeira tela e fecha o modal antes de usar o menu. |
| `testes/desktop-v40.test.mjs` | 7 testes novos (fluxos, estados, permissões, responsividade, zoom, console). |
| `testes/servicos-fixtures.mjs` | Criação de ticket simulada, só com `aceitarCriacao`. |
| Testes desktop existentes | Seletores do novo padrão de modal; mesmas verificações funcionais. |

## Limites e pendências

- Defeitos do Qase: somente leitura (sem contrato de criação, edição, comentário ou anexo).
- Execuções: sem armazenamento contratado para anexo manual e comentário; capturas, vídeos e relatórios só quando registrados pelo executor.
- Dependências entre rotinas e política arbitrária de falha não existem no backend.
- Execuções lista a fila do Prumo; runs do Qase ficam em Testes › Runs; evidências CLI/MCP em modal próprio.
- Validação com serviços simulados e perfil temporário: não comprova contas de produção nem autenticação humana do Windows.

## Reprodução

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$env:PRUMO_MIGRACAO = '0'; $env:PRUMO_LAB_DIR = Join-Path (Get-Location) 'tmp\ds\lab-inexistente'
$env:PRUMO_V40_CAPTURAS = Join-Path (Get-Location) 'tmp\ds\v40'
npm.cmd run check
npm.cmd run app
```

## Resultado da validação (11/10/2026)

`npm run check` completo no working tree (typecheck + build + todos os testes,
`PRUMO_MIGRACAO=0`, laboratório irmão ausente): **339 testes · 333 PASS · 0 FAIL ·
6 SKIPPED**. Os pulos são ambientais e declarados pelos próprios testes:
laboratório Prumo QA ausente (demonstração 2.8), etapas de instalador do CI
Windows (2.6/2.7) e migrações que exigem `PRUMO_MIGRACAO=1` e `PRUMO_APP_EXE`.
Linha de base antes da v40: 13 falhas. Console da janela sem erros em todas as
telas (inclui CSP). Capturas reais (dados sintéticos): `tmp/ds/antes/`,
`tmp/ds/depois/`, `tmp/ds/v40/` e referência do protótipo em `tmp/ds/prototipo/`
(pastas ignoradas pelo Git).

## Testes: Qase e código (revisão de produto)

Testes passa a representar o que existe no Qase **e** no código do projeto:

- **Visão geral**: casos do Qase e testes do repositório numa lista única. Um caso e um teste
  só ficam juntos por anotação explícita no código — `qase(31, …)`, `qase.id(31)`, `@qase(31)`,
  `@qase-31`, `Qase: SFQ-31` — lida no trecho do próprio teste. Nome parecido não liga nada.
  Situações: caso com código, manual, automação planejada, automatizado no Qase sem código
  encontrado, código que anota um caso inexistente e código sem caso. Filtros por fonte, nível
  (unitário, API, E2E…), execução e tags; agrupamento por tag, feature ou nível.
- **Código** (visão de IDE, somente leitura): árvore de pastas dos arquivos de teste, leitor com
  numeração e marcadores por teste (nível, tags, caso do Qase), painel de conexões (caso, tickets,
  resultados no Prumo) e a linha "Agentes neste código" com as permissões reais do projeto.
  Projeto só com GitHub navega pela leitura de arquivos do GitHub já existente.
- Modal do caso: bloco "Código que implementa", que abre o arquivo na linha do teste.

Núcleo: `src/catalogoTestes.ts` extrai `qase` e o intervalo de linhas de cada teste e reconhece
o título no formato do reporter (`test(qase(31, '…'), …)`); novo canal `testes:arquivo`
(somente leitura, só arquivos de teste dentro da pasta vinculada, sem link simbólico, até 300 KB,
segredos mascarados). Agentes continuam agindo pelo MCP e pelas políticas do projeto: criar
branch, commit e PR segue sendo da pessoa, em `prumo/*` e com confirmação (docs/SEGURANCA.md).
Contextos saiu do menu e abre em modal a partir de Agentes.
