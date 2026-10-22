# Áreas de QA e de TI: o que perguntar, o que verificar e o que entregar

Mapa de apoio para responder qualquer pergunta de qualidade de software. Cada seção é independente. O texto é original do Prumo; o recorte de áreas foi conferido contra coleções abertas de Skills de QA (ver TERCEIROS.md). Skill orienta; a evidência vem da execução real.

## Prontidão para liberar uma versão (go/no-go)

Antes de liberar, junte evidências, não opiniões: testes críticos passando na versão exata que vai para produção, defeitos abertos por severidade com decisão registrada (corrigir, adiar com contorno, aceitar o risco), cobertura dos requisitos desta entrega, regressão executada nas áreas alteradas, desempenho dentro do combinado, segurança sem vulnerabilidade crítica aberta, plano de reversão testado e monitoramento pronto. A decisão é do responsável pelo produto; o QA entrega o quadro de risco e diz com clareza o que não foi testado.

## Pós-mortem sem culpa de defeito escapado

Pergunte "o que no processo deixou isso passar?", nunca "quem errou". Linha do tempo (introdução, detecção, correção), causa raiz por cinco porquês, por que os testes não pegaram (faltava requisito, caso, dado, ambiente ou oráculo), o que mudar (teste novo na camada certa, alerta, critério de aceite, checklist) com dono e prazo. Um defeito escapado vira um teste de regressão automatizado.

## Casos de teste manuais bem gerenciados

Cada caso tem objetivo, pré-condições, dados, passos curtos, resultado esperado observável e vínculo ao requisito. Agrupe por funcionalidade e risco (suítes: smoke, regressão, exploratória guiada). Revise a cada mudança de requisito; apague caso obsoleto em vez de deixá-lo apodrecer. Estados do resultado: passou, falhou, bloqueado, não executado; cada falha tem evidência e um bug ligado.

## Dados de teste

Dado previsível e isolado: cada teste cria o que usa e limpa depois (fábricas, fixtures, API de preparação) em vez de depender de dados compartilhados e de ordem. Use dados sintéticos; se precisar de cópia de produção, anonimize (LGPD). Cubra dados de borda: vazio, muito longo, acentos e emoji, datas e fusos, valores monetários e arredondamento, e volumes reais para desempenho.

## Ambientes de teste

Local para desenvolver, integração para contratos, homologação parecida com produção para aceite e regressão, produção só com testes sintéticos seguros. Ambiente descartável (contêineres, banco efêmero) reduz "na minha máquina funciona". Versione a configuração, isole serviços externos com sandbox ou virtualização e registre a versão testada em cada resultado.

## Teste mobile

Verifique instalação e atualização, permissões, interrupções (ligação, notificação, rede caindo, modo avião), orientação, tamanhos de tela e versões de SO mais usados, bateria, memória e desempenho de abertura. Combine emuladores para volume e aparelhos reais para câmera, sensores, biometria e notificações push. Appium cobre vários sistemas; Maestro e Detox simplificam fluxos; Espresso e XCUITest ficam perto do código nativo.

## Teste visual (regressão visual)

Compara capturas com uma linha de base aprovada e destaca diferenças de pixel. Fixe o que varia (data, animação, dados, fontes, viewport), use limiar de tolerância, revise cada diferença como pessoa e aprove a nova base só quando a mudança for intencional. É ótimo para design system e páginas estáveis, ruim para conteúdo dinâmico.

## Banco de dados e migrações

Teste restrições (chaves, únicos, nulos), transações e rollback, índices e planos de consulta sob volume, integridade após migração (contagens e amostras antes e depois), migração aplicada e revertida em cópia anonimizada, tempo de execução e bloqueios, backup e restauração. Valide a camada de acesso: injeção, permissões mínimas e vazamento entre inquilinos.

## E-mail, SMS e códigos de acesso (OTP)

Use caixa de teste capturável (Mailpit, MailHog, serviço de sandbox) em vez de e-mail real. Verifique assunto, remetente, links (com expiração e uso único), conteúdo por idioma, fila de reenvio, limite de tentativas e que o código antigo deixa de valer. Nunca envie e-mail de teste a pessoas reais.

## Pagamentos

Use o sandbox do provedor, nunca cartão real. Cubra aprovado, recusado (vários motivos), autenticação 3-D Secure, tempo esgotado, estorno e reembolso parcial, webhooks (duplicados, fora de ordem, atrasados), idempotência de repetição, arredondamento, moedas e impostos, e conciliação entre pedido, cobrança e extrato.

## Rastreamento e analytics

Valide que cada evento certo dispara uma vez, com os parâmetros certos, no momento certo (abrir, clicar, concluir), com consentimento respeitado e sem dado pessoal indevido. Confira a camada de dados (dataLayer), o painel de depuração da ferramenta e a ausência de eventos duplicados em navegação de página única.

## Testar sistemas com IA

Saída de modelo é probabilística: avalie com conjuntos de exemplos (golden set) e critérios claros, não um único caso. Verifique regressão ao trocar modelo ou prompt, alucinação (afirmações sem fonte), recusa indevida e excesso de recusa, injeção de prompt, vazamento de dados, viés, custo e latência, e comportamento com entrada vazia, enorme ou em outro idioma. Mantenha humanos revisando amostras e defina o que é inaceitável.

## Engenharia do caos

Injete falhas controladas (latência, queda de dependência, perda de pacote, disco cheio) para provar que o sistema degrada com elegância. Comece com hipótese de estado estável, raio de impacto pequeno, ambiente seguro, botão de abortar e observabilidade; só depois aumente. O resultado vira melhoria de timeout, retry com backoff, disjuntor e alerta.

## Teste em produção, canário e monitoramento sintético

Feature flags liberam aos poucos; canário compara a versão nova com a antiga em tráfego real e reverte sozinho; testes sintéticos percorrem jornadas críticas a cada poucos minutos e alertam antes do usuário. Use dados e contas de teste marcados, sem efeito colateral (nada de cobrança ou e-mail real), e meça pelos SLOs.

## Testes de contrato e virtualização de serviços

Contrato (Pact ou OpenAPI) mantém consumidor e provedor de acordo sem subir tudo. Para dependências lentas ou caras use virtualização (WireMock, MSW, Mountebank) com respostas realistas, incluindo erros, lentidão e respostas inválidas; atualize o mock quando o contrato mudar para não testar contra uma ficção.

## Métricas, painéis e portões de qualidade

Meça o que muda decisões: defeitos escapados, tempo de correção, taxa de falha de mudança, instabilidade (flakiness), tempo do pipeline, cobertura de risco e de requisitos. Portões bloqueiam avanço quando o limite quebra (testes críticos vermelhos, vulnerabilidade crítica, queda de cobertura em código novo). Evite metas por pessoa ou por número de casos; olhe tendência e contexto.

## Cobertura em CI

Meça cobertura de código novo (diff) e impeça queda (catraca), mas trate o número como pista: cobertura sem asserção não prova nada. Relacione com risco: o módulo de pagamento exige mais que a tela de ajuda. Teste de mutação mede a força dos testes em módulos críticos.

## Triagem de bugs

Antes de tratar um bug: reproduza, procure duplicata, classifique tipo (funcional, desempenho, segurança, acessibilidade, dado), severidade e prioridade, componente e dono provável, e registre o que falta (versão, passos, evidência). Bugs sem reprodução voltam com pergunta objetiva. Relatos vagos viram um teste mínimo que falha, que depois vira o teste de regressão da correção.

## Reprodução mínima de falhas

Reduza até o menor cenário que ainda falha: remova passos, dados e configuração um de cada vez, fixe a versão, capture logs e rede, repita em loop se for intermitente. Registre o que muda o resultado. O cenário mínimo é o melhor relato de bug e a melhor base do teste automatizado.

## Curadoria da suíte de regressão

Revise com evidência: testes que nunca falharam em um ano e cobrem risco baixo, duplicados, lentos demais para o valor, instáveis e sem dono são candidatos a remover, consolidar ou mover para uma camada mais barata. Nunca remova só porque o nome é parecido; confira o oráculo e o risco coberto.

## Migração entre ferramentas de automação

De Selenium para Playwright (ou parecido): comece pelas jornadas de maior valor, mantenha as duas suítes rodando em paralelo até a nova igualar a cobertura, troque esperas explícitas por esperas automáticas, seletores por papéis e rótulos acessíveis, e dados por fábricas. Meça estabilidade e tempo antes e depois para provar o ganho.

## Observabilidade como apoio ao teste

Logs estruturados, métricas e traces distribuídos servem de oráculo: um teste de ponta a ponta também confere que o evento foi registrado, que o trace atravessou os serviços e que nenhum erro silencioso apareceu. Use o identificador de correlação para ligar a falha do teste ao log do servidor.

## Shift-left na prática

Revise requisitos com perguntas de testabilidade (qual é o resultado observável? e se falhar? e no limite?), escreva critérios de aceite em exemplos antes de codificar, faça par com desenvolvimento, rode análise estática e testes de unidade e contrato a cada commit, e mantenha o ciclo curto. O defeito mais barato é o que o requisito claro evitou.

## Segurança e privacidade como parte do teste

Faça modelagem de ameaças leve em cada recurso novo (quem pode fazer o quê, com quais dados), teste autorização por papel e por dado (IDOR), valide entradas, segredos fora do código, dependências atualizadas e logs sem dado pessoal. Registre base legal e retenção quando houver dado pessoal (LGPD) e peça apoio ao encarregado de dados.
