# Histórico das versões no README

Seções que estavam no README até a 2.10.2, preservadas como registro. O catálogo oficial de cada versão está em `app/versoes.json` (Ajuda › Versões e site).

## Evolução 2.9

Integrações completas e uma interface nova. **Testes**: catálogo que lê os testes do repositório, agrupa por feature e classifica cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade) com motivo e confiança; casos e propostas do Qase; planos e execuções; automação e GitHub. **Jira**: busca com filtros, detalhe com histórico, comentar, anexar, mudar status e criar ticket. **Qase**: suites, casos, planos, runs, resultados publicados e conferidos. **GitHub**: branches `prumo/...`, commits e Pull Request em rascunho, nunca na branch principal. A escrita externa nasce **desligada**; cada operação mostra a prévia, pede confirmação nativa, não duplica e confirma relendo o serviço. **Agentes**: oito especializações e políticas por capacidade aplicadas no servidor MCP (a IA só propõe). **Início** com esfera e assistente local (responde com os dados do computador, sem modelo de IA). Menu lateral recolhível, cor de destaque, F5 atualiza a tela, Métricas modulares, ícone novo (a esfera) e site institucional renovado. Limites: escritas validadas contra serviços simulados (sem contas reais), classificação de testes é inferência, instalador sem assinatura. Guia: `app/ajuda/19-testes-e-integracoes.md`.

## Correção 2.8.1

A verificação de atualização agora diz o que aconteceu quando não conclui: sem conexão, tempo esgotado, recusa do GitHub (HTTP 403), erro do servidor (5xx) ou **limite de consultas** (HTTP 429 ou 403 com cota esgotada, com o horário de nova tentativa quando o GitHub o informa). Consulta que não conclui nunca é mostrada como "você já usa a versão mais recente" nem apaga o aviso já conhecido; a tela mostra a data da última consulta concluída. Continua uma requisição manual, sem token, sem nova tentativa automática e sem consulta em segundo plano. O catálogo de versões passou a marcar a 2.8.0 como publicada (o site anunciava uma versão antiga porque versões já lançadas ficavam como "no repositório"); um teste impede que isso se repita e o CI confere a release publicada. Publicar o site no Render continua sendo um passo manual (o serviço `prumo-qa-docs` está com deploy automático desligado).

## Evolução 2.8

O Prumo passa a **organizar e executar uma rotina de QA sozinho**, sem IA: agendamentos único, por intervalo, diário e semanal (fuso e horário de verão), fila persistente por projeto, worker residente na **bandeja do Windows** e rotinas de consulta Jira, smoke, regressão, validação por ticket, análise de mudanças e k6 (executável oficial, limites explícitos, produção bloqueada). Testes agendados exigem autorização prévia restrita (projeto, ambiente, comando por hash, validade, limite de usos, revogável) obtida pelo mesmo broker nativo do Windows, que não foi alterado; sem ela a execução fica BLOCKED. Resultados do Playwright viram cenários individuais (reporter incluído). O histórico é centralizado por projeto, repositório, ticket e rotina, com métricas reais (sem porcentagem de qualidade).

Única escrita remota: **comentário de resultado em ticket Jira**, com prévia e confirmação, ou política aprovada para rotinas agendadas; idempotente, sem alterar status. Interface com a identidade **Quality Control** (esfera e órbitas que só se movem com trabalho real), temas claro, escuro e do sistema, e português e inglês, tudo persistido por usuário. Claude e Codex continuam opcionais e sem poder de executar, agendar ou publicar. Veja [AGENDAMENTOS.md](docs/AGENDAMENTOS.md), a ajuda do aplicativo e [SEGURANCA.md](docs/SEGURANCA.md). Fora do instalador: o laboratório e a demonstração de 26 passos (`testes/e2e/ui/demonstracao-28.test.mjs`).

## Evolução 2.7

Projetos Prumo com identidade própria, contexto manual e pasta de automação opcional. Conexões desktop independentes para Jira Cloud, Qase v1 e GitHub: seleção dinâmica, leitura explícita, origem e data, isolamento por projeto/instância/conexão e credenciais protegidas pelo Windows. IA continua opcional; Agentes preserva os quatro tools MCP. Não existe servidor HTTP local, escrita em serviços, clone privado ou aprovação automática.

Tickets, Testes, Automações, Execuções e Rastreabilidade completam o trabalho manual. Associações declaradas não comprovam cobertura. Respostas são consultadas sem cache persistido; falhas aparecem com códigos próprios. [Guia manual](app/ajuda/17-plataforma.md) e [endpoints, autenticação e limites](docs/SERVICOS.md). Autenticação real em produção requer credenciais próprias; fixtures não a comprovam.

## Evolução 2.6

- Conexões distingue configuração compatível, validação de protocolo SDK e chamada observada de cliente. O botão **Testar integração** verifica handshake, quatro ferramentas e leitura, com UUID próprio. Não executa capabilities nem comprova que Claude/Codex usou o servidor.
- Registros novos guardam somente referências de contextos incluídos/consultados (id, versão, hash, estado e finalidade). Não afirmam que o agente seguiu as regras.
- Suporte exporta Markdown com id explicitamente LOCAL e consulta, por ação sua, rótulos e eventos da issue oficial. Status e respostas continuam no GitHub, sem segunda base sincronizada.
- Documentação pública: `npm.cmd run site` gera `site/public` das fontes de ajuda, contratos e versões; configuração Render em `render.yaml`. O site não acessa projetos locais nem executa testes.
- Skills QA e Playwright aprofundadas, referência de engenharia e Skill `acessibilidade`. As especializações precisam ser instaladas no cliente; MCP não as carrega universalmente.

Camada local de engenharia de qualidade para agentes que já desenvolvem software. Entende o contexto autorizado de um projeto, confere estrutura de planos de teste, controla execução e preserva evidências. A IA hospedeira interpreta requisitos e riscos; o núcleo impõe regras determinísticas. Não exige outra chave de LLM.

CLI e servidor MCP stdio usam o mesmo núcleo. São quatro tools: `contexto_projeto`, `revisar_cobertura`, `executar_validacao`, `consultar_evidencias`. A Skill orienta o raciocínio; não é um modelo nem um mecanismo de permissão.

A versão 2.1 acrescenta um terminal de acompanhamento, histórico local e métricas derivadas das operações realmente observadas. Contexto, revisão estrutural, consultas, logs e métricas funcionam sem IA conectada. A IA externa continua responsável por interpretar requisitos e riscos. Não há chat independente, segunda chave de LLM nem telemetria remota.

```text
Claude / Codex / IA compatível
               |
          MCP local stdio
               |
     Prumo QA: quatro ferramentas <--- CLI
               |
        Núcleo de qualidade
               |
    Atividades       Evidências de testes
    dados do usuário .prumo do projeto
               |
         Terminal Prumo
```

O terminal consulta arquivos locais; a IA não precisa permanecer ligada. Uma chamada MCP concluída não equivale a teste PASS. A imagem de referência usa números ilustrativos; o programa mostra somente o seu histórico.

## Novidades da 2.5

- **Suporte**: aba para relatar bug, melhoria ou sugestão. O relato é montado e revisado localmente (segredos bloqueiam, dados pessoais avisam), nada é anexado sem marcação e o formulário oficial de GitHub Issues só é aberto após confirmação nativa. Também exporta para arquivo, sem GitHub. Detalhes e triagem segura em [docs/SUPORTE.md](docs/SUPORTE.md).
- **Sino de atualização** no cabeçalho (mouse, teclado e clique) e **som opcional** que toca uma vez por versão; preferências persistentes; a verificação de atualização não roda em segundo plano e não há serviço do Windows nem tarefa agendada; nada é baixado ou instalado automaticamente.

## Novidades da 2.4

- **Contextos por projeto**: requisitos, regras, critérios, restrições e decisões com estados RASCUNHO/APROVADO/CONFLITANTE/DESATUALIZADO, aprovação humana, histórico verificável por hash, isolamento e exclusão com confirmação. Só vão à IA se você habilitar (ver [docs/APLICATIVO.md](docs/APLICATIVO.md)).
- **`revisar_cobertura` com `contextoId`** e **`contexto_projeto`** com contextos autorizados, frameworks detectados e conhecimento aplicável.
- **Playwright e API REST**: detecção por evidência real, 12 regras de análise de testes com fonte oficial e Skills especializadas.
- Marcos: [docs/MARCOS.md](docs/MARCOS.md) (2.3.1 estabilização/assinatura, 2.4.0 contextos, 2.5.0 suporte e notificações); [docs/ASSINATURA.md](docs/ASSINATURA.md) e [docs/INSTALACAO-MANUAL.md](docs/INSTALACAO-MANUAL.md).

## Novidades da 2.3

- **Ajuda › Integrações técnicas**: catálogo das 20 operações IPC da janela e das 4 ferramentas MCP, gerado do código ([docs/CONTRATOS.md](docs/CONTRATOS.md)) e conferido por testes. Não existe API HTTP.
- **Ajuda › Versões**: histórico detalhado de 2.0.0 a 2.3.0, offline, de uma fonte única (`app/versoes.json`) que também gera as notas de release.
- **Ajuda › Atualizações**: verificação **manual** da release oficial; nada é baixado nem instalado. Atualizar sobre a versão anterior preserva projetos, histórico, métricas e evidências (testado no CI com a 2.2.0 publicada).
- **Ajuda › Privacidade e dados**: pasta real, espaço usado, retenção, exportação e exclusão controlada por escopo, com confirmação nativa.
- **Central de ajuda** reorganizada (guia, perguntas frequentes expansíveis, problemas comuns) e **diagnóstico da interface** separado das métricas de QA.
- **Prumo QA Lab**: projeto independente (pasta irmã Prumo-QA-Lab; o repositório remoto AnaPLysyk/Prumo-QA-Lab ainda precisa ser criado, veja [docs/ENTREGA-2.3.md](docs/ENTREGA-2.3.md)) com oito situações controladas para avaliar o próprio Prumo pelo MCP real.

## Aplicativo desktop (2.2)

A versão 2.2 acrescenta uma **janela desktop** (Electron) para consultar projetos, métricas, logs, histórico, evidências, conexões de IA e a ajuda (privacidade e termos em rascunho). É só apresentação: usa o mesmo núcleo, não executa testes e não altera projetos. O servidor MCP continua sendo iniciado pelo cliente de IA e **não depende da janela**.

Para usar sem PowerShell, baixe o instalador `Prumo-QA-Setup-<versão>.exe` na página de *Releases* do repositório (não exige Node.js). O instalador **não é assinado**: o SmartScreen ou o Smart App Control podem alertar ou bloquear, e o Prumo não contorna isso. Para desenvolver ou gerar o instalador:

```powershell
npm.cmd ci
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue   # se definido pelo terminal
npm.cmd run app      # abre a janela em desenvolvimento
npm.cmd run dist     # release\Prumo-QA-Setup-<versão>.exe
```

Arquitetura, dados, segurança da janela, troca do ícone (`assets/`), release pelo GitHub Actions e limitações do Smart App Control estão em [docs/APLICATIVO.md](docs/APLICATIVO.md).
