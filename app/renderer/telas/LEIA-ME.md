# Frontend — o que aparece na tela

**Este é o lugar para alterar o que a pessoa vê no Prumo QA.** Abra a pasta com o nome da tela. Dentro dela, o nome do arquivo indica a ação e a primeira frase explica sua função.

## Onde procurar

| O que precisa alterar | Onde encontrar |
| --- | --- |
| Tela Projetos e seus formulários | `frontend/projetos/` |
| Tickets Jira | `frontend/tickets/` |
| Casos de Testes, catálogo e propostas Qase | `frontend/testes/` |
| Planos e Runs Qase | `frontend/runs/` |
| Agendamentos e permissões de rotina | `frontend/agendamentos/` |
| Execuções e evidências na interface | `frontend/execucoes/` |
| Rastreabilidade | `frontend/rastreabilidade/` |
| Agentes, chat, robô e Cérebro | `frontend/agentes/` |
| Conexões Jira, Qase e GitHub | `frontend/conexoes/` |
| Métricas, Histórico e Logs | `frontend/metricas/`, `frontend/historico/` e `frontend/logs/` |
| Suporte, Ajuda e preferências | `frontend/suporte/`, `frontend/ajuda/` e `frontend/configuracoes/` |
| Componentes usados em várias telas | `frontend/compartilhado/` |

**A lógica correspondente está em `backend/<nome-da-tela>/`.** Lá existem arquivos por ação em `api/` (pedidos da janela via IPC), `regras/`, `banco/` (dados locais), `integracoes/` e `tipos/` quando necessários.

### Qual arquivo editar?

Edite **somente `frontend/`**. Por compatibilidade com o aplicativo Electron instalado, o build sincroniza uma cópia para `app/renderer/telas/`. Esta segunda pasta é **gerada**, não deve ser editada manualmente. O teste automático confere a igualdade de todos os arquivos, evitando versões diferentes da mesma tela.

Os scripts `app/renderer/fluxos-v40.js`, `testes-v40.js`, `interfaces-v36.js` e o CSS v36 continuam como bundles gerados pelas partes-fonte de `frontend/`. Alguns arquivos legados da janela ainda ficam em `app/renderer/` até que a migração completa do Electron seja validada.

Comandos:

```powershell
npm.cmd run frontend:check
npm.cmd run frontend:sync
node scripts/gerar-telas-modulares.mjs --check
npm.cmd run check
```

**Atenção:** nesta fase a interface ainda é Electron + JavaScript clássico e o backend usa IPC. Isto **não** significa que as telas de login, cadastro, recuperação de senha, administração e API web já estejam implementadas. Esses módulos pertencem à Proposta e devem passar por contratos, testes e permissões antes da publicação.
