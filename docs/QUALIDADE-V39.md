# Integração dos fluxos de qualidade v39

Referência: `prumo_qa_v39_qualidade_fluxos.html`. O aplicativo existente define
os contratos funcionais; dados demonstrativos, scripts e números do protótipo
não foram importados como registros reais. Trabalho local na branch
`prumo/interfaces-aprovadas-v36`, sem deploy ou alteração da main. As alterações
locais anteriores foram preservadas.

## Auditoria e implementação

O aplicativo usa Electron, preload restrito e IPC validado. CLI e MCP compartilham
o núcleo TypeScript. Persistência em arquivos locais, sem banco novo ou migração.
Projetos têm UUID independente da pasta e dos recursos Jira/Qase/GitHub. Conexões
e tokens permanecem no mecanismo existente, com safeStorage/DPAPI no processo
principal; os agentes não recebem credenciais.

| Área | Resultado |
|---|---|
| Projetos | Cadastro, seleção e vínculos existentes preservados; layout compacto, identidade de cada serviço mantida. |
| Conexões | Validação e configuração existentes preservadas; refinamento visual usa os tokens do aplicativo. |
| Tickets | Busca Jira e escrita autorizada existentes; detalhes em modal. Consulta avançada recolhida. Defeitos Qase na mesma tela, com lista e detalhe, leitura explícita e erros visíveis. |
| Testes | Catálogo, suites, casos, propostas, planos e runs existentes; caso remoto e proposta em modal; listagem preservada ao fechar. |
| Agendamentos | Formulário de rotina e detalhes em modal; pausa, retomada, autorizações, recorrência e horários perdidos continuam no núcleo. |
| Execuções | Resumo e tentativas em modal; período enviado ao filtro real. Tipo/origem filtram os 100 registros carregados, com limite declarado. |
| Evidências | Acessíveis em Execuções e nos detalhes, sem entrada visível independente no menu. JSON e logs reais consultados; exportação JSON pelo diálogo nativo. |
| Rastreabilidade | Busca e abertura de tickets/casos com vínculo vigente; recurso de vínculo removido tem navegação desabilitada. Nós históricos são separados dos IDs atuais. |
| Orchestrator | Projeto/contexto e políticas existentes preservados; nenhuma permissão adicional para IA. |

Operações externas agora revalidam conexão/vínculo antes de reutilizar uma
operação confirmada ou reconciliar resposta perdida. Operações já tentadas cujo
escopo diverge ou não está registrado retornam `OPERATION_SCOPE_CHANGED`; não
reenviam nem migram o registro. Associações Qase de vínculos removidos não são
usadas para escolher a automação de um caso no vínculo atual.

## Arquivos desta implementação

- `dist/renderer/qualidade-v39.js/.css`: modal nativo, retorno de foco, preservação
  dos nós/listeners, apresentação contextual de evidências e estilos por tela.
- `dist/renderer/qualidade-fontes-v39.js` (removido na v40, substituído por `fluxos-v40.js`/`operacao-v40.js`; ver INTERFACES-V40.md): defeitos Qase, navegação de relações e
  exportação de evidência consultada.
- `dist/renderer/index.html`, `plataforma.js`, `integracoes.js`, `agenda.js`:
  carregamento e adaptação dos fluxos existentes, filtros e resumo de execução.
- `src/adaptadoresServicos.ts`: leitura fechada de defeitos Qase.
- `src/operacoesExternas.ts`: conferência do escopo antes de reutilização.
- `src/rastreabilidade.ts`, `src/fluxoQase.ts`: isolamento de associações antigas.
- `src/contratos.ts`, `src/desktop/main.ts`, `docs/CONTRATOS.md`: tipo fechado
  `evidencia-json` no exportador nativo existente, sem caminho vindo da janela.
- `testes/e2e/ui/desktop-qualidade-v39.test.mjs`, `servicos.test.mjs`,
  `servicos-fixtures.mjs`, `escrita.test.mjs`, `fluxo-qase.test.mjs`: testes novos.
  `janela.mjs` e regressões desktop adaptam a navegação para o modal mantendo
  as verificações funcionais.

## Dados reais e limites

Cadastro de projeto, persistência de rotinas, seleção, fila, evidências do núcleo,
modal e exportação são implementações reais. Serviços remotos são consultados
somente com conexão e recurso vinculados; a validação automatizada usa serviços
simulados e perfil/projeto temporários. Ela não comprova contas de produção ou
autenticação humana Windows. Confirmações de escrita nos testes usam doubles
explícitos do runner. Nenhum ticket ou defeito real é criado durante testes.

Defeitos Qase têm **somente leitura**. Criação, edição, comentário e anexos de
defeitos não têm contrato no produto. A interface informa a indisponibilidade.
O fluxo existente de run com falha → proposta de bug → Jira segue revisão,
permissão, confirmação e reconciliação existentes; não cria defeito Qase.

Anexo manual e comentário de execução não têm armazenamento/autoria contratados;
não foram simulados como recursos disponíveis. Capturas, vídeos, payloads e
arquivos arbitrários não são inventados nem abertos por caminho livre. A
exportação entrega o JSON consultado, com resultados/logs existentes.
Dependências entre rotinas e política arbitrária de falha não existem no backend.
O histórico de Execuções continua baseado na fila; não agrega automaticamente
atividade CLI/MCP ou runs externas em uma única linha. Evidências CLI/MCP podem
ser consultadas pelo botão contextual de Execuções.

## Reprodução isolada

```powershell
$env:PRUMO_LAB_DIR = Join-Path (Get-Location) 'tmp\qualidade-v39\laboratorio-nao-vinculado'
$env:PRUMO_MIGRACAO = '0'
$env:PRUMO_V39_CAPTURAS = Join-Path (Get-Location) 'tmp\qualidade-v39\capturas'
npm.cmd run check
```

A pasta de laboratório acima é inexistente de propósito: impede a demonstração
legada de consultar o laboratório irmão. Migrações de instaladores não são
executadas neste ambiente. Nenhum teste deve tocar banco ou projeto externo.

Para abrir localmente: `npm.cmd run app` (remova `ELECTRON_RUN_AS_NODE` do
ambiente caso esteja definido). Selecione um projeto, configure conexões com
suas próprias permissões e consulte dados. Escrita continua desligada por padrão
e exige as confirmações do núcleo.

Capturas da janela Electron real, com dados sintéticos, ficam em
`tmp/qualidade-v39/capturas/`; logs em `tmp/qualidade-v39/`. Essas pastas são
ignoradas pelo Git. Resultados finais da validação serão registrados abaixo após
a execução completa.
