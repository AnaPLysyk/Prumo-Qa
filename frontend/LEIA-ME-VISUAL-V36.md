# Interfaces v36 — onde editar cada elemento

O visual de Início, Agentes, Chat, Logs, Histórico, Métricas e Configurações é carregado de `dist/renderer/interfaces-v36.js` e `dist/renderer/interfaces-v36.css`, **gerados no build** a partir das partes abaixo (a ordem importa). Edite a parte, não o arquivo gerado.

## interfaces-v36.js

1. `frontend/compartilhado/interfaces-abertura.parte.js`
2. `frontend/agentes/retratos-dos-agentes.parte.js`
3. `frontend/compartilhado/exportar-e-icones.parte.js`
4. `frontend/agentes/conversa-do-orchestrator.parte.js`
5. `frontend/compartilhado/abrir-tela-pelo-orchestrator.parte.js`
6. `frontend/agentes/orchestrator-flutuante.parte.js`
7. `frontend/inicio/tela-inicio-v36.parte.js`
8. `frontend/logs/tela-logs.parte.js`
9. `frontend/historico/tela-historico.parte.js`
10. `frontend/metricas/tela-metricas.parte.js`
11. `frontend/agentes/tela-agentes.parte.js`
12. `frontend/configuracoes/ajustes-do-assistente.parte.js`
13. `frontend/compartilhado/interfaces-fechamento.parte.js`

## interfaces-v36.css

1. `frontend/compartilhado/interfaces-base.parte.css`
2. `frontend/agentes/conversa-do-orchestrator.parte.css`
3. `frontend/logs/tela-logs.parte.css`
4. `frontend/historico/tela-historico.parte.css`
5. `frontend/metricas/tela-metricas.parte.css`
6. `frontend/agentes/tela-agentes.parte.css`
7. `frontend/compartilhado/reflow-zoom-e-movimento.parte.css`
8. `frontend/agentes/espaco-profundo.parte.css`
9. `frontend/configuracoes/menu-lateral-ceu.parte.css`
10. `frontend/agentes/seletor-de-agente.parte.css`
11. `frontend/configuracoes/ajustes-em-secoes.parte.css`

Cores de tema ficam só em `frontend/design-system` (tokens `--ds-*`); as partes de tela usam os tokens e não têm paleta própria.
