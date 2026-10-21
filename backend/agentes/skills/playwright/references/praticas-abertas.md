# Playwright: reconhecer antes de agir

Adaptado de `webapp-testing` (anthropics/skills, Apache-2.0) e dos guias de `playwright-skill` (testdino-hq, MIT); ver `backend/agentes/skills/TERCEIROS.md`. Ajustado às regras do Prumo QA.

## Reconhecimento, depois ação

1. Abra a página e espere o estado estável (carregamento concluído e conteúdo dinâmico renderizado).
2. Inspecione o estado renderizado: captura de tela ou leitura do DOM.
3. Só então escolha os locators, a partir do que realmente está na tela.
4. Execute as ações com os locators descobertos.

Erro comum: inspecionar o DOM de uma aplicação dinâmica antes de ela terminar de renderizar.

- HTML estático pode ser lido direto para achar seletores; se a leitura for incompleta, trate como dinâmico.
- Scripts auxiliares do projeto são caixas-pretas: rode com `--help` antes de ler o código-fonte inteiro.
- Capture os logs do console do navegador durante a automação; eles costumam explicar a falha.
- Prefira locators descritivos (papel, rótulo, texto, `data-testid`) e esperas por condição, não tempo fixo.

## Temas que valem consulta nos guias de origem

Os guias da TestDino organizam práticas em: locators e assertions, fixtures e configuração, autenticação com reaproveitamento de sessão, mock de rede, testes visuais e de acessibilidade, análise de trace, instabilidade, Page Object Model versus fixtures e helpers, integração contínua com sharding e migração a partir de Cypress ou Selenium. Use-os como leitura de apoio; a regra do projeto continua a desta Skill.

Nada disso autoriza executar comandos livres: no Prumo, execução só por capability declarada e aprovada.

## Falha em teste Playwright: ordem de diagnóstico

Ideia de apoio, reescrita para o Prumo. Antes de mexer no teste, olhe nesta ordem: mensagem de erro e linha; o trace da execução que falhou (se existir e estiver no escopo autorizado); rede e console; estado da massa de dados; só então tempo e concorrência. Se o locator não encontra o elemento por papel ou rótulo, investigue o nome acessível antes de trocar por CSS. Espera fixa e retentativa nunca são a correção: registre a causa provável e a verificação que a confirmaria.
