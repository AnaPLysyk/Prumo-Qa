# Integração das interfaces aprovadas v36

Trabalho local na branch `prumo/interfaces-aprovadas-v36`, sobre
`e457c06f78e0c568452627092a8ca2586ae4e396`. Sem publicação, deploy ou alteração da main.
Referência visual: `prumo_qa_v36_fundo_neural_e_formulario.html` fornecido pelo usuário.
As imagens utilizadas são as incorporadas nessa referência; não foram fornecidas
outras capturas separadas. Textos e scripts do protótipo foram analisados como dados;
fluxos e números demonstrativos não foram importados como atividade real.

## Auditoria e decisões

| Tela | Implementação existente | Integração realizada / limite |
|---|---|---|
| Home / Orchestrator | `agenda.js`, `assistente.ts`, `qc.js` | Conversa e situação local preservadas. Identificação do agente central; sem novo LLM. |
| Chat flutuante | Robô e órbitas incorporados no HTML | Imagem original local; mesma geometria e desenho das órbitas. Abrir, fechar, Escape e alternar entre flutuante/lateral. Perguntas no contrato `assistentePerguntar`. |
| Métricas | `visao`, `metricasExecucoes`, `operacoes`, módulos configuráveis de `integracoes.js` | Módulos e totais do núcleo preservados; gráficos filtráveis de atividades por operação/estado, exportação JSON/CSV e impressão. Filtros da consulta não recalculam os totais globais. |
| Histórico | `painel.historico` | Tabela, busca, operação, estado, datas, ordenação, detalhe e link de evidência. Até 1000 atividades retornadas, limite declarado. |
| Logs | `painel.logs`, exportação nativa e diagnóstico IPC | Terminal de metadados reais, filtros, acompanhamento e detalhes; diagnóstico separado. Sem terminal de comandos. |
| Agentes | `politicasAgentes.ts`, oito especializações, matriz e confirmação nativa | Listagem por especialização, habilitação e políticas persistidas pelo contrato existente. As políticas são do projeto, não de um avatar independente. |
| Agentes personalizados | Sem contrato de execução/cadastro customizado | Criar, editar, importar e exportar **prévia local**, claramente identificada. Não cria especialização, conexão ou processo no núcleo. |
| Cérebro | Skill, especialização e capacidades configuradas | Conexões clicáveis apresentam dados configurados e motivos das políticas. Sem memória aprendida ou aprendizado inventado. |
| Painel de atividades | Operações com ferramenta, cliente e origem | Eventos reais consultados pelo IPC. Sem atribuir atividade a um avatar: o núcleo não registra essa relação. Início sem término não comprova processo ativo. |

Não foram criados contratos de execução de agentes personalizados nem conexão MCP
ativa fictícia. As capacidades ainda inexistentes são prévias, conforme o pedido.
Os clientes Codex/Claude e seus diagnósticos anteriores continuam acessíveis para
pastas vinculadas, pelo componente legado de Agentes; nos projetos cadastrados,
ficam na seção interna "Clientes MCP · diagnóstico e configuração" da listagem.

## Refinamentos e armazenamento

Somente duas abas superiores: Agentes e Painel de atividades. Configuração e
Cérebro são visualizações internas. Retratos distintos, movimentos individuais,
um único canvas neural por visualização e respeito a movimento reduzido. Avatar
fixo à esquerda; formulário à direita com rolagem própria. X e ✓ separados,
centralizados e habilitados por alterações. Políticas usam confirmação nativa;
prévia usa confirmação explícita antes de persistir.

Prévias ficam no armazenamento local da janela, por UUID de projeto, na chave
`prumo-v36-drafts-<uuid>`, limitadas a 50 por projeto. Não substituem `agentes.json`.
Importação aceita JSON estrito versão 1, até 32 KiB; valida nome, objetivo e
instruções obrigatórios, tipos, comprimentos e campos desconhecidos. Importar
preenche o formulário: não salva nem executa o conteúdo.

Os retratos são imagens WebP com movimento visual CSS, sem articulação facial
3D. A pesquisa identificou [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html)
e [three-vrm / expressões](https://pixiv.github.io/three-vrm/packages/three-vrm/examples/)
como opções para ossos e expressões faciais. Uma implementação real requer
modelos com rig/blend shapes apropriados. Não foram adicionados modelos ou
dependências 3D fora do material aprovado.

## Arquivos e motivos

| Arquivo | Motivo |
|---|---|
| `dist/renderer/interfaces-v36.js` | Adaptadores das cinco telas autorizadas, prévias locais e chat. Não substitui componentes de outros módulos. |
| `dist/renderer/interfaces-v36.css` | Estilos restritos às telas autorizadas, responsividade e movimento reduzido. |
| `dist/renderer/orbitas-v36.js` | Desenho original das órbitas do HTML, com inicialização adaptada ao controle desktop. |
| `frontend/compartilhado/runtime/i18n-en-v36.js` | Fonte das traduções; gera a cópia `dist/renderer/i18n-en-v36.js`. |
| `assets/interfaces-v36/robo-original.png` e `avatar-0.webp` a `avatar-7.webp` | Assets incorporados no HTML, extraídos sem alteração da imagem; funcionamento offline. |
| `dist/renderer/index.html` | Carrega os novos arquivos locais após os componentes existentes. |
| `backend/aplicativo/preload.cjs` | Acrescenta a única chamada restrita `exportarTela`. |
| `src/contratos.ts` | Esquema estrito/documentação de `interface:exportar`, tipos fechados, texto limitado. |
| `src/desktop/main.ts` | Exportação via diálogo nativo e extensões JSON/CSV. Necessária porque a janela bloqueia downloads blob. Bloqueio de rede preservado. |
| `docs/CONTRATOS.md` | Gerado do catálogo atualizado. Não muda operações existentes. |
| `testes/e2e/ui/desktop.test.mjs` | Seletores da tabela de Logs adaptados ao terminal, mantendo assertions de MCP real/BLOCKED/persistência; inclui a nova função na ponte esperada. |
| `testes/e2e/ui/desktop-interfaces-v36.test.mjs` | Fluxos novos, persistência, confirmação, validação/importação/exportação, eventos reais, zoom e isolamento. |
| `testes/seguranca/externa/worker.test.mjs` | Corrige a preparação do cenário de expiração: criação da autorização e worker usam o mesmo relógio simulado. Mantém a assertion BLOCKED e acrescenta checagem da validade exata de um dia. Nenhum código de worker/autorização foi alterado. |
| `docs/INTERFACES-V36.md` | Auditoria, limitações, evidências e reprodução local. |

## Preservação de módulos

Os arquivos preexistentes `app.js`, `agenda.js`, `plataforma.js`, `integracoes.js`,
`qc.css` e `estilo.css` permanecem byte a byte iguais à base. O mesmo vale para
`politicasAgentes.ts`, `mcp.ts`, `painel.ts`, `agenda.ts`, `espacos.ts`,
`evidencias.ts`, `servicos.ts`, `operacoesExternas.ts`, `worker.ts` e `autorizacoes.ts`.
Comparação SHA-256 dos 16 arquivos em
[preservacao.json](../tmp/interfaces-v36/preservacao.json).

A mudança em `main.ts` apenas acrescenta o exportador das telas autorizadas;
não altera handlers de Projetos, Tickets, Testes, Agendamentos, Execuções,
Evidências, Rastreabilidade, Conexões, Suporte ou Ajuda. A documentação técnica
da Ajuda incorpora o novo canal por seu catálogo existente. Não houve mudança
de regras MCP, autenticação, vault, execução ou modelo de permissões.

## Evidências visuais

Capturas da janela Electron real com perfil temporário e dados sintéticos. São
evidência visual da implementação, não prova de integração com contas externas.

- [Home](../tmp/interfaces-v36/capturas/inicio.png)
- [Chat flutuante](../tmp/interfaces-v36/capturas/chat-flutuante.png) e [lateral](../tmp/interfaces-v36/capturas/chat-lateral.png)
- [Métricas](../tmp/interfaces-v36/capturas/metricas.png)
- [Histórico](../tmp/interfaces-v36/capturas/historico.png)
- [Logs](../tmp/interfaces-v36/capturas/logs.png)
- [Agentes](../tmp/interfaces-v36/capturas/agentes.png)
- [Configuração](../tmp/interfaces-v36/capturas/configuracao.png)
- [Cérebro](../tmp/interfaces-v36/capturas/cerebro.png)
- [Painel de atividades](../tmp/interfaces-v36/capturas/atividades.png)

`tmp/` é ignorado pelo Git. Capturas e logs são entregues localmente e podem ser
regenerados pelo comando abaixo; não incluem dados do perfil real do usuário.

## Testes e reprodução

Os testes novos usam Electron + Playwright, IPC e MCP reais, com armazenamento
temporário. Confirmações nativas têm double explícito no processo de teste;
isso não comprova aprovação ou autenticação humana. Prévias são verificadas no
localStorage; políticas são relidas do núcleo e preservadas ao reabrir a janela.
Fixtures de serviços na regressão são sintéticas. Nenhum banco é utilizado.

Rodadas iniciais revelaram espera de importação insuficiente, downloads blob
bloqueados, catálogo gerado desatualizado, traduções novas ausentes e relógios
inconsistentes no cenário legado de expiração. Essas falhas foram corrigidas; não
foram removidas assertions de persistência, segurança ou resultados.
A primeira rodada completa iniciou a demonstração legada, que lê e copia o
laboratório irmão para uma pasta temporária. Interrompi essa rodada ao identificar
essa dependência; o original não foi modificado. A rodada final define um
laboratório desvinculado para não consultar projeto externo. Migração de
instaladores e essa demonstração ficam
explicitamente NOT_RUN neste ambiente.

Para abrir o aplicativo com o perfil local:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm.cmd run app
```

Para validar e regenerar evidências de forma isolada:

```powershell
$env:PRUMO_LAB_DIR = Join-Path (Get-Location) 'tmp\interfaces-v36\laboratorio-nao-vinculado'
$env:PRUMO_MIGRACAO = '0'
$env:PRUMO_V36_CAPTURAS = Join-Path (Get-Location) 'tmp\interfaces-v36\capturas'
npm.cmd run check
```

Rodada final de `npm run check`: **297 testes, 291 aprovados, zero falhas e
6 não executados**; processo encerrado com código 0. Os seis NOT_RUN são a
demonstração com laboratório irmão e cinco cenários de migração de instaladores.
Os quatro testes v36 passaram, incluindo os diagnósticos legados dos clientes,
exportação nativa restrita e a ausência de texto `null` nas telas.
Typecheck, build, catálogo de contratos sincronizado e regressão passaram.

Resultado completo da rodada final: [check-concluido.log](../tmp/interfaces-v36/check-concluido.log).
O relatório não cobre empacotamento/instalador, impressão física, autenticação
humana ou contas Jira/Qase/GitHub reais. JSON e CSV foram gravados e lidos nos
testes; a opção PDF abre o fluxo de impressão, cuja confirmação fica com a pessoa.
